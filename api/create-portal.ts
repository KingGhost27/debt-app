/**
 * Vercel Serverless Function: Create Stripe Customer Portal Session
 *
 * Lets Pro users manage their subscription (cancel, update payment method, etc.)
 * via Stripe's hosted Customer Portal.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, returnUrl } = req.body as {
      customerId: string;
      returnUrl?: string;
    };

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

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
      customer: customerId,
      return_url: safeReturnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
