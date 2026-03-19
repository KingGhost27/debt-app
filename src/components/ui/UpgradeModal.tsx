/**
 * UpgradeModal
 *
 * Centered overlay showing three Pro pricing plans.
 * Triggers Stripe Checkout when user picks a plan.
 * Used when users hit free-tier limits or click "Upgrade" in Settings.
 */

import { useState, useCallback } from 'react';
import { X, Crown, Sparkles, Zap, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

  const handleSelectPlan = useCallback(async (planId: string) => {
    if (!user) return;
    setLoadingPlan(planId);
    setError(null);

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          userId: user.id,
          userEmail: user.email,
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Pro"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[calc(100dvh-32px)] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-celebration-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X size={18} className="text-gray-400" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 pt-8 pb-6 text-center rounded-t-3xl">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3">
            <Crown size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Upgrade to Pro</h2>
          <p className="text-white/80 text-sm mt-1">Unlock the full Cowculator experience</p>
        </div>

        {/* Pro features list */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Everything in Pro</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRO_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-1.5 text-xs text-gray-600">
                <Sparkles size={12} className="text-primary-400 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="px-6 py-5 space-y-3">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={!!loadingPlan}
              className={`
                w-full text-left p-4 rounded-2xl border-2 transition-all
                ${plan.highlight
                  ? 'border-primary-400 bg-primary-50 shadow-md shadow-primary-200/30'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }
                ${loadingPlan === plan.id ? 'opacity-70' : ''}
                disabled:cursor-wait
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {plan.highlight ? (
                    <Zap size={18} className="text-primary-500" />
                  ) : plan.id === 'lifetime' ? (
                    <Star size={18} className="text-amber-500" />
                  ) : null}
                  <span className="font-bold text-gray-900">{plan.name}</span>
                  {plan.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      plan.id === 'lifetime'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-primary-100 text-primary-700'
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400 ml-1">{plan.period}</span>
                </div>
              </div>

              {/* Sub-features */}
              <div className="mt-2 flex flex-wrap gap-2">
                {plan.features.map((f) => (
                  <span key={f} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>

              {loadingPlan === plan.id && (
                <p className="text-xs text-primary-500 mt-2 animate-pulse">
                  Redirecting to checkout...
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-4">
            <p className="text-xs text-red-500 text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-5 text-center">
          <p className="text-[10px] text-gray-300">
            Powered by Stripe. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
}
