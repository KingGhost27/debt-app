/**
 * Vercel Serverless Function: Create Stripe Customer Portal Session
 *
 * Lets Pro users manage their subscription (cancel, update payment method, etc.)
 * via Stripe's hosted Customer Portal.
 *
 * Identity comes exclusively from the verified Supabase JWT; the Stripe
 * customer ID is looked up server-side from user_subscriptions.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from './_lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
});

// Service role client — server-side lookup of the caller's Stripe customer
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

    const { data: subscription, error: lookupError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (lookupError) {
      console.error('Subscription lookup error:', lookupError);
      return res.status(500).json({ error: 'Failed to create portal session' });
    }

    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const { returnUrl } = (req.body ?? {}) as { returnUrl?: string };

    // Allowlist return_url origins to prevent phishing via attacker-supplied URL.
    const ALLOWED_ORIGINS = [
      'https://cowculator.net',
      'https://www.cowculator.net',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    let safeReturnUrl = 'https://cowculator.net/settings';
    if (returnUrl) {
      try {
        const u = new URL(returnUrl);
        const o = `${u.protocol}//${u.host}`;
        if (ALLOWED_ORIGINS.includes(o)) safeReturnUrl = returnUrl;
      } catch {
        // fall through to default
      }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: safeReturnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
