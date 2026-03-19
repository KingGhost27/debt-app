/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 *
 * Creates a checkout session for monthly, annual, or lifetime Pro plans.
 * Called from the client UpgradeModal when user selects a plan.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

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
    const { plan, userId, userEmail, returnUrl } = req.body as {
      plan: string;
      userId: string;
      userEmail?: string;
      returnUrl?: string;
    };

    if (!plan || !userId) {
      return res.status(400).json({ error: 'Missing plan or userId' });
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return res.status(400).json({ error: `Invalid plan: ${plan}` });
    }

    const isLifetime = plan === 'lifetime';
    const origin = returnUrl || req.headers.origin || 'https://cowculator.net';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: isLifetime ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?upgraded=1`,
      cancel_url: `${origin}/settings`,
      client_reference_id: userId,
      metadata: { userId, plan },
      ...(userEmail && { customer_email: userEmail }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
