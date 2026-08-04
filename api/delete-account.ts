/**
 * Vercel Serverless Function: Delete Account
 *
 * Self-serve account deletion, as promised in the privacy policy.
 *
 * Identity comes exclusively from the verified Supabase JWT — a caller can only
 * ever delete themselves, never an id supplied in the request body.
 *
 * Order matters: any live Stripe subscription is cancelled BEFORE the database
 * row goes away, because the row is where the subscription id lives. Reversing
 * these two steps would leave an orphaned subscription billing a user whose
 * account no longer exists.
 *
 * Deleting the auth user is sufficient to remove all user data: every one of the
 * ten application tables declares
 *   user_id uuid references auth.users(id) on delete cascade
 * so Postgres removes the rows atomically. Do NOT replace this with a hand-written
 * list of table deletes — a table added later would be silently missed, whereas the
 * cascade picks it up for free.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
// NOTE: package.json sets "type": "module" — this relative specifier MUST carry the
// .js extension. See the matching note in create-portal.ts.
import { getAuthenticatedUser } from './_lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
});

// Service role client — required to delete an auth user and to read the caller's
// subscription row without being subject to RLS.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // 1. Cancel any live Stripe subscription before the row disappears.
    const { data: subscription, error: lookupError } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (lookupError) {
      console.error('Account deletion: subscription lookup failed', {
        userId: user.id,
        lookupError,
      });
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    // Lifetime plans have no subscription id — there is nothing to cancel.
    if (subscription?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      } catch (stripeError) {
        // Already cancelled or already gone is fine — deletion should still proceed.
        const alreadyGone =
          stripeError instanceof Stripe.errors.StripeError &&
          (stripeError.code === 'resource_missing' || stripeError.statusCode === 404);

        if (!alreadyGone) {
          console.error('Account deletion: Stripe cancellation failed', {
            userId: user.id,
            subscriptionId: subscription.stripe_subscription_id,
            stripeError,
          });
          // Refuse rather than delete the account and keep charging them.
          return res.status(502).json({
            error:
              'We could not cancel your subscription with our payment provider, so we have not deleted your account. Please email support@cowculator.net and we will handle it.',
          });
        }
      }
    }

    // 2. Delete the auth user. FK cascade removes every application row.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Account deletion: auth user delete failed', {
        userId: user.id,
        deleteError,
      });
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    // The Stripe customer object is intentionally left in place: billing records are
    // retained by Stripe under their own retention rules, which is what the privacy
    // policy tells users.
    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Account deletion: unexpected failure', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
