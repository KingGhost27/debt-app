/**
 * Subscriptions Page - Kawaii Edition
 *
 * Track recurring subscription services with custom billing frequencies.
 * Shows monthly/annual totals, upcoming renewals, and subscription list.
 * Features cute styling, animations, and delightful interactions.
 */

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Calendar, Pause, Play } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { format, parseISO, differenceInDays, addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { SubscriptionModal } from '../components/ui/SubscriptionModal';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency } from '../lib/calculations';
import type { Subscription, SubscriptionFrequency } from '../types';
import { SUBSCRIPTION_CATEGORY_INFO } from '../types';

// Calculate monthly cost from any frequency
function getMonthlyAmount(amount: number, frequency: SubscriptionFrequency): number {
  const { value, unit } = frequency;
  switch (unit) {
    case 'days':
      return (amount / value) * 30;
    case 'weeks':
      return (amount / value) * 4.33;
    case 'months':
      return amount / value;
    case 'years':
      return amount / (value * 12);
    default:
      return amount;
  }
}

// Get next billing date if current one is in the past
function getNextBillingDate(subscription: Subscription): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let billingDate = parseISO(subscription.nextBillingDate);

  while (isBefore(billingDate, today)) {
    const { value, unit } = subscription.frequency;
    switch (unit) {
      case 'days':
        billingDate = addDays(billingDate, value);
        break;
      case 'weeks':
        billingDate = addWeeks(billingDate, value);
        break;
      case 'months':
        billingDate = addMonths(billingDate, value);
        break;
      case 'years':
        billingDate = addYears(billingDate, value);
        break;
    }
  }

  return billingDate;
}

// Format frequency for display
function formatFrequency(frequency: SubscriptionFrequency): string {
  const { value, unit } = frequency;
  if (value === 1) {
    const labels: Record<string, string> = {
      days: 'Daily', weeks: 'Weekly', months: 'Monthly', years: 'Yearly',
    };
    return labels[unit] ?? unit;
  }
  if (value === 2 && unit === 'weeks') return 'Bi-weekly';
  if (value === 3 && unit === 'months') return 'Quarterly';
  if (value === 6 && unit === 'months') return 'Semi-annual';
  return `Every ${value} ${unit}`;
}

export function SubscriptionsPage({ embedded = false }: { embedded?: boolean }) {
  const { subscriptions, deleteSubscription, updateSubscription } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  // Calculate totals (only active subscriptions)
  const activeSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.isActive),
    [subscriptions]
  );

  const monthlyTotal = useMemo(() => {
    return activeSubscriptions.reduce((sum, sub) => {
      return sum + getMonthlyAmount(sub.amount, sub.frequency);
    }, 0);
  }, [activeSubscriptions]);

  const annualTotal = monthlyTotal * 12;

  // Sort by next billing date
  const sortedSubscriptions = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      // Active subscriptions first
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      // Then by next billing date
      const dateA = getNextBillingDate(a);
      const dateB = getNextBillingDate(b);
      return dateA.getTime() - dateB.getTime();
    });
  }, [subscriptions]);

  // Group by category
  const subscriptionsByCategory = useMemo(() => {
    const grouped: Record<string, Subscription[]> = {};
    sortedSubscriptions.forEach((sub) => {
      if (!grouped[sub.category]) {
        grouped[sub.category] = [];
      }
      grouped[sub.category].push(sub);
    });
    return grouped;
  }, [sortedSubscriptions]);

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  };

  const handleDelete = (subscription: Subscription) => {
    confirm({
      title: 'Delete Subscription',
      message: `Are you sure you want to delete "${subscription.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteSubscription(subscription.id),
    });
  };

  const handleToggleActive = (subscription: Subscription) => {
    updateSubscription(subscription.id, { isActive: !subscription.isActive });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubscription(null);
  };

  const addButton = (
    <button
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:scale-105 active:scale-95"
    >
      <Plus size={18} />
      Add
    </button>
  );

  // Empty state
  if (subscriptions.length === 0) {
    if (embedded) {
      return (
        <div className="space-y-4">
          <div className="flex justify-end">{addButton}</div>
          <EmptyState
            icon="📺"
            title="No Subscriptions Yet"
            description="Add your streaming services, software subscriptions, and other recurring charges to track your spending."
            action={{ label: 'Add Your First Subscription', onClick: () => setIsModalOpen(true) }}
            encouragement="Stay on top of your recurring costs!"
          />
          <SubscriptionModal isOpen={isModalOpen} onClose={handleCloseModal} subscription={editingSubscription} />
          <ConfirmDialog {...dialogProps} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 animate-page-enter">
        <PageHeader title="Subscriptions" subtitle="Track recurring services" emoji="🔄" />
        <div className="px-4">
          <EmptyState
            icon="📺"
            title="No Subscriptions Yet"
            description="Add your streaming services, software subscriptions, and other recurring charges to track your spending."
            action={{ label: 'Add Your First Subscription', onClick: () => setIsModalOpen(true) }}
            encouragement="Stay on top of your recurring costs!"
          />
        </div>
        <SubscriptionModal isOpen={isModalOpen} onClose={handleCloseModal} subscription={editingSubscription} />
      </div>
    );
  }

  const sharedContent = (
    <>
      {/* Summary Card */}
      <div className="card p-3! bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/30 dark:to-gray-800 rounded-2xl border border-primary-100 dark:border-primary-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <RefreshCw size={13} className="text-primary-500" />
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Recurring Costs</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded-xl">
              <p className="text-[10px] text-gray-500 mb-0.5">Monthly</p>
              <p className="text-base font-bold text-primary-600">{formatCurrency(monthlyTotal)}</p>
            </div>
            <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded-xl">
              <p className="text-[10px] text-gray-500 mb-0.5">Annual</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(annualTotal)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? 's' : ''}</span>
            {subscriptions.length > activeSubscriptions.length && (
              <span className="text-gray-400">{subscriptions.length - activeSubscriptions.length} paused</span>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-2">
        {Object.entries(subscriptionsByCategory).map(([category, subs]) => {
          const categoryInfo = SUBSCRIPTION_CATEGORY_INFO[category as keyof typeof SUBSCRIPTION_CATEGORY_INFO];
          return (
            <div key={category}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryInfo?.color || '#6b7280' }} />
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{categoryInfo?.label || category}</h3>
              </div>
              <div className="space-y-1.5">
                {subs.map((subscription) => {
                  const nextBilling = getNextBillingDate(subscription);
                  const daysUntil = differenceInDays(nextBilling, new Date());
                  return (
                    <div key={subscription.id} className={`card p-2.5! bg-white rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden ${!subscription.isActive ? 'opacity-60' : ''}`}>
                      <div className="h-0.5 -mx-2.5 -mt-2.5 mb-2" style={{ backgroundColor: categoryInfo?.color || '#6b7280' }} />

                      {/* Top row: name + amount + buttons */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-gray-900 truncate">{subscription.name}</h4>
                          {!subscription.isActive && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full shrink-0">Paused</span>}
                        </div>
                        <p className="text-xs font-bold text-gray-900 shrink-0">{formatCurrency(subscription.amount)}</p>
                        <div className="flex shrink-0">
                          <button onClick={() => handleToggleActive(subscription)} className="p-1 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors" title={subscription.isActive ? 'Pause' : 'Resume'}>
                            {subscription.isActive ? <Pause size={12} /> : <Play size={12} />}
                          </button>
                          <button onClick={() => handleEdit(subscription)} className="p-1 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => handleDelete(subscription)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>

                      {/* Bottom row: date/frequency info only */}
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span>{formatFrequency(subscription.frequency)}</span>
                        {subscription.isActive && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="flex items-center gap-0.5">
                              <Calendar size={10} className="text-gray-400" />
                              {format(nextBilling, 'MMM d')}
                            </span>
                            {daysUntil <= 7 && daysUntil >= 0 && (
                              <span className={`px-1 py-0.5 text-[10px] font-medium rounded-full ${daysUntil === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                {daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">{addButton}</div>
        {sharedContent}
        <SubscriptionModal isOpen={isModalOpen} onClose={handleCloseModal} subscription={editingSubscription} />
        <ConfirmDialog {...dialogProps} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-page-enter">
      <PageHeader title="Subscriptions" subtitle="Track recurring services" emoji="🔄" action={addButton} />
      <div className="px-4 py-6 space-y-6">
        {sharedContent}
      </div>
      <SubscriptionModal isOpen={isModalOpen} onClose={handleCloseModal} subscription={editingSubscription} />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
