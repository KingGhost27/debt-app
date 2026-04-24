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
        className="relative z-10 w-full max-w-sm max-h-[calc(100dvh-24px)] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-celebration-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
        >
          <X size={16} className="text-white/80" />
        </button>

        {/* Header — compact */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-4 pt-4 pb-3 text-center rounded-t-2xl">
          <div className="inline-flex items-center justify-center w-9 h-9 bg-white/20 rounded-xl mb-1.5">
            <Crown size={18} className="text-white" />
          </div>
          <h2 className="text-base font-extrabold text-white leading-tight">Upgrade to Pro</h2>
          <p className="text-white/80 text-[11px] mt-0.5">Unlock the full Cowculator experience</p>
        </div>

        {/* Pro features — tighter */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Everything in Pro</p>
          <div className="grid grid-cols-2 gap-y-1 gap-x-2">
            {PRO_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-1 text-[11px] text-gray-600">
                <Sparkles size={10} className="text-primary-400 flex-shrink-0" />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards — clearly separated buttons */}
        <div className="px-4 py-3 space-y-2">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => handleSelectPlan(plan.id)}
              disabled={!!loadingPlan}
              className={`
                w-full text-left p-3 rounded-xl border transition-all
                border-gray-200 hover:border-primary-400 hover:bg-primary-50/40 active:scale-[0.99]
                ${loadingPlan === plan.id ? 'opacity-70' : ''}
                disabled:cursor-wait
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {plan.id === 'annual' ? (
                    <Zap size={14} className="text-primary-500 flex-shrink-0" />
                  ) : plan.id === 'lifetime' ? (
                    <Star size={14} className="text-amber-500 flex-shrink-0" />
                  ) : null}
                  <span className="font-bold text-sm text-gray-900">{plan.name}</span>
                  {plan.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                      plan.id === 'lifetime'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-primary-100 text-primary-700'
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-base font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-[10px] text-gray-400 ml-0.5">{plan.period}</span>
                </div>
              </div>

              {/* Sub-features */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {plan.features.map((f) => (
                  <span key={f} className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>

              {loadingPlan === plan.id && (
                <p className="text-[10px] text-primary-500 mt-1 animate-pulse">
                  Redirecting to checkout...
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-red-500 text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 pb-3 text-center">
          <p className="text-[9px] text-gray-300">
            Powered by Stripe. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
}
