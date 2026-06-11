/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 *
 * Creates a checkout session for monthly, annual, or lifetime Pro plans.
 * Called from the client UpgradeModal when user selects a plan.
 *
 * Identity comes exclusively from the verified Supabase JWT — the client
 * sends only the plan and an optional return URL.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from './_lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
});

// Service role client — reuse the caller's existing Stripe customer if any
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Plan → Stripe Price ID mapping (set in Vercel env vars)
const PRICE_MAP: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { plan, returnUrl } = (req.body ?? {}) as {
      plan: string;
      returnUrl?: string;
    };

    if (!plan) {
      return res.status(400).json({ error: 'Missing plan' });
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return res.status(400).json({ error: `Invalid plan: ${plan}` });
    }

    const isLifetime = plan === 'lifetime';

    // Allowlist origins to prevent phishing via attacker-supplied returnUrl.
    const ALLOWED_ORIGINS = [
      'https://cowculator.net',
      'https://www.cowculator.net',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    const safeOrigin = (candidate: string | undefined): string | null => {
      if (!candidate) return null;
      try {
        const u = new URL(candidate);
        const o = `${u.protocol}//${u.host}`;
        return ALLOWED_ORIGINS.includes(o) ? o : null;
      } catch {
        return null;
      }
    };
    const origin =
      safeOrigin(returnUrl) ||
      safeOrigin(req.headers.origin as string | undefined) ||
      'https://cowculator.net';

    // Reuse the existing Stripe customer when one exists to avoid duplicates.
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const existingCustomerId = subscription?.stripe_customer_id || undefined;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: isLifetime ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?upgraded=1`,
      cancel_url: `${origin}/settings`,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : user.email && { customer_email: user.email }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
