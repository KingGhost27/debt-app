/**
 * Vercel Serverless Function: Stripe Webhook Handler
 *
 * Receives Stripe events and updates user_subscriptions in Supabase.
 * Handles: checkout completed, subscription updates, subscription deletions.
 *
 * IMPORTANT: This endpoint must receive the raw body for signature verification.
 * Vercel config in vercel.json disables body parsing for this route.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
// NOTE: package.json sets "type": "module" — relative specifiers MUST carry .js.
import { decideCheckoutWrite } from './_lib/purchase-guard.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
});

// Service role client — bypasses RLS for webhook writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  // Preferred: read directly from the stream (production / bodyParser:false)
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length > 0) return Buffer.concat(chunks);

  // Fallback: vercel dev sometimes pre-parses the body despite bodyParser:false
  const body = (req as unknown as { body: unknown }).body;
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  if (body && typeof body === 'object') return Buffer.from(JSON.stringify(body), 'utf8');
  return Buffer.alloc(0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    // Signature verification is unconditional in every environment.
    // Local testing requires the Stripe CLI listener, which signs events
    // with the webhook secret it prints on startup.
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId;
  const plan = session.metadata?.plan as string;
  if (!userId || !plan) {
    console.error('Missing userId or plan in checkout session metadata');
    return;
  }

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || '';

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || undefined;

  const isLifetime = plan === 'lifetime';

  // For subscriptions, fetch period end from Stripe. Done before the row lookup so
  // the read-then-write window below is two quick database calls, not a Stripe call.
  // Newer Stripe API versions moved current_period_end onto the subscription item.
  let currentPeriodEnd: string | null = null;
  if (subscriptionId && !isLifetime) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const periodEnd =
      (sub as unknown as { current_period_end?: number }).current_period_end ??
      sub.items?.data?.[0]?.current_period_end;
    if (typeof periodEnd === 'number' && !Number.isNaN(periodEnd)) {
      currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
    }
  }

  const { data: existing, error: lookupError } = await supabase
    .from('user_subscriptions')
    .select('plan_type, status, current_period_end, stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (lookupError) {
    // Throw so Stripe retries instead of us writing blind over a paid plan.
    console.error('Supabase lookup error:', lookupError);
    throw lookupError;
  }

  const decision = decideCheckoutWrite(existing, subscriptionId ?? null);
  if (decision.action === 'keep-lifetime') {
    if (isLifetime) {
      // Usually Stripe re-delivering the event that made this row lifetime.
      console.warn(
        `Lifetime already active for user ${userId}; ignored checkout ${session.id}. ` +
          'If this was a second lifetime payment rather than a retry, refund it in Stripe.',
      );
    } else {
      console.error(
        `DUPLICATE PURCHASE: user ${userId} already has lifetime Pro; kept it and ignored ` +
          `checkout ${session.id} (${plan}). Refund this payment in the Stripe dashboard` +
          (subscriptionId ? ` and cancel subscription ${subscriptionId}.` : '.'),
      );
    }
    return;
  }
  if (decision.orphanedSubscriptionId) {
    console.error(
      `ORPHANED SUBSCRIPTION: user ${userId} bought ${plan} (checkout ${session.id}) while ` +
        `subscription ${decision.orphanedSubscriptionId} was not canceled. It may keep billing; ` +
        `check it in the Stripe dashboard and cancel it if so.`,
    );
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId || null,
        plan_type: plan,
        status: 'active',
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Supabase upsert error:', error);
    throw error;
  }
}

/**
 * Lifetime plans are one-time purchases — they have no Stripe subscription
 * lifecycle. A stale subscription event for the same customer (e.g. an old
 * monthly sub finishing its cancellation) must never downgrade them.
 */
async function isLifetimeRow(customerId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan_type')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.plan_type === 'lifetime';
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  if (await isLifetimeRow(customerId)) {
    console.log('Skipping subscription update for lifetime plan customer');
    return;
  }

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    trialing: 'trialing',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
    paused: 'canceled',
  };

  const periodEnd =
    (subscription as unknown as { current_period_end?: number }).current_period_end ??
    subscription.items?.data?.[0]?.current_period_end;
  const periodEndIso =
    typeof periodEnd === 'number' && !Number.isNaN(periodEnd)
      ? new Date(periodEnd * 1000).toISOString()
      : null;

  const { data: updated, error } = await supabase
    .from('user_subscriptions')
    .update({
      status: statusMap[subscription.status] || 'active',
      current_period_end: periodEndIso,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    // Match the subscription, not the customer: an event for an old or
    // orphaned subscription must not rewrite the customer's current plan.
    .eq('stripe_subscription_id', subscription.id)
    .select('id');

  if (error) {
    console.error('Subscription update error:', error);
    throw error;
  }
  if (!updated?.length) {
    // Normal when the event beats checkout.session.completed or the subscription
    // was replaced; worth seeing if it happens for a live customer's only plan.
    console.warn(`subscription.updated ${subscription.id}: no row holds this subscription`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  if (await isLifetimeRow(customerId)) {
    console.log('Skipping subscription deletion for lifetime plan customer');
    return;
  }

  const { data: updated, error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    // Same rule as the update handler: only the row holding this subscription.
    .eq('stripe_subscription_id', subscription.id)
    .select('id');

  if (error) {
    console.error('Subscription delete error:', error);
    throw error;
  }
  if (!updated?.length) {
    console.warn(`subscription.deleted ${subscription.id}: no row holds this subscription`);
  }
}
