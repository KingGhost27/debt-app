/**
 * UpgradeModal
 *
 * Centered overlay showing three Pro pricing plans.
 * Triggers Stripe Checkout when user picks a plan.
 * Used when users hit free-tier limits or click "Upgrade" in Settings.
 */

import { useState, useCallback } from 'react';
import { Crown, Check, Zap, Star } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { isRunningInTwa } from '../../lib/twa';

interface UpgradeModalProps {
  onDismiss: () => void;
}

interface PlanOption {
  id: 'monthly' | 'annual' | 'lifetime';
  name: string;
  price: string;
  period: string;
  badge?: string;
  highlight?: boolean;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    features: ['Cancel anytime', 'All Pro features'],
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$39.99',
    period: '/year',
    badge: 'Save 33%',
    highlight: true,
    features: ['Best value', 'All Pro features', '~$3.33/month'],
  },
  {
    id: 'lifetime',
    name: 'OG Heifer',
    price: '$19',
    period: 'one-time',
    badge: 'Limited!',
    features: ['Pay once, Pro forever', 'First 200-300 members only', 'OG Heifer badge'],
  },
];

const PRO_FEATURES = [
  'Unlimited debts',
  'All 10 kawaii themes',
  'Full budget planner',
  'Asset tracking',
  'Subscription tracker',
  'Advanced charts',
  'Payment history & streaks',
  'Data export (CSV/JSON)',
];

export function UpgradeModal({ onDismiss }: UpgradeModalProps) {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Play consumption-only: no purchase flow inside the Android wrapper.
  const inTwa = isRunningInTwa();

  const handleSelectPlan = useCallback(async (planId: string) => {
    // Defence in depth — the plan buttons are not rendered in the TWA, but if a future
    // change reintroduces a caller, checkout must still refuse to start there.
    if (isRunningInTwa()) return;
    if (!user) return;
    setLoadingPlan(planId);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in again to upgrade');
      }
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan: planId,
          returnUrl: window.location.origin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingPlan(null);
    }
  }, [user]);

  return (
    <ModalShell onClose={onDismiss} size="sm" title="Upgrade to Pro" subtitle="Unlock the full Cowculator experience" icon={<Crown size={18} />}>
      <div className="up-feats">
        <p className="up-h">Everything in Pro</p>
        <ul>
          {PRO_FEATURES.map((feature) => (
            <li key={feature}><Check size={15} strokeWidth={3} />{feature}</li>
          ))}
        </ul>
      </div>

      {/*
        Google Play consumption-only compliance: inside the Android wrapper we may not
        present a purchase flow, and may not link out to one. Plain text only — the
        absence of a tappable path to checkout is the point, so do not "helpfully" turn
        cowculator.net into a link here.
      */}
      {inTwa ? (
        <div className="grid gap-3">
          <p className="mdl-note" style={{ fontSize: 16, color: 'var(--ranch-ink)' }}>
            Pro is managed on the Cowculator website. Visit{' '}
            <b>cowculator.net</b> in your
            browser to see plans.
          </p>
          <p className="mdl-note">
            Already have Pro? Sign in here with the same account and your features unlock
            automatically.
          </p>
          <button type="button" onClick={onDismiss} className="mdl-btn">Got it</button>
        </div>
      ) : (
        <div className="up-plans">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => handleSelectPlan(plan.id)}
              disabled={!!loadingPlan}
              className={`up-plan${plan.highlight ? ' is-hi' : ''}${loadingPlan === plan.id ? ' is-busy' : ''}`}
            >
              <span className="up-top">
                <span className="up-name">
                  {plan.id === 'annual' ? <Zap size={16} /> : plan.id === 'lifetime' ? <Star size={16} /> : null}
                  {plan.name}
                  {plan.badge && <span className={`rui-badge ${plan.id === 'lifetime' ? 'soon' : 'ok'}`}>{plan.badge}</span>}
                </span>
                <span className="up-price"><b>{plan.price}</b> <small>{plan.period}</small></span>
              </span>
              <span className="up-sub">{plan.features.join(' · ')}</span>
              {loadingPlan === plan.id && <span className="up-sub" role="status">Redirecting to checkout...</span>}
            </button>
          ))}
        </div>
      )}

      {error && !inTwa && <p className="mdl-err" role="alert" style={{ textAlign: 'center' }}>{error}</p>}

      <p className="mdl-note" style={{ textAlign: 'center', fontSize: 13 }}>
        Powered by Stripe. Cancel anytime. No hidden fees.
      </p>
    </ModalShell>
  );
}
