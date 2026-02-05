/**
 * Subscriptions Page - Kawaii Edition
 *
 * Track recurring subscription services with custom billing frequencies.
 * Shows monthly/annual totals, upcoming renewals, and subscription list.
 * Features cute styling, animations, and delightful interactions.
 */

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Calendar, Sparkles, Pause, Play } from 'lucide-react';
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
    const unitSingular = unit.slice(0, -1); // Remove 's'
    return `Every ${unitSingular}`;
  }
  return `Every ${value} ${unit}`;
}

export function SubscriptionsPage() {
  const { subscriptions, deleteSubscription, updateSubscription } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

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
    if (window.confirm(`Delete "${subscription.name}"? This cannot be undone.`)) {
      deleteSubscription(subscription.id);
    }
  };

  const handleToggleActive = (subscription: Subscription) => {
    updateSubscription(subscription.id, { isActive: !subscription.isActive });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubscription(null);
  };

  // Empty state
  if (subscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Subscriptions"
          subtitle="Track recurring services"
          emoji="🔄"
        />
        <div className="px-4">
          <EmptyState
            icon="📺"
            title="No Subscriptions Yet"
            description="Add your streaming services, software subscriptions, and other recurring charges to track your spending."
            action={{
              label: 'Add Your First Subscription',
              onClick: () => setIsModalOpen(true),
            }}
            encouragement="Stay on top of your recurring costs!"
          />
        </div>
        <SubscriptionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          subscription={editingSubscription}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Subscriptions"
        subtitle="Track recurring services"
        emoji="🔄"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            Add
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Summary Card */}
        <div className="card bg-gradient-to-br from-primary-50 to-white rounded-3xl border border-primary-100 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
          <Sparkles size={14} className="absolute top-4 right-6 text-primary-300 animate-kawaii-pulse" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw size={18} className="text-primary-500" />
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">
                Recurring Costs
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/60 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Monthly</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(monthlyTotal)}
                </p>
              </div>
              <div className="p-4 bg-white/60 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Annual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(annualTotal)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? 's' : ''}
              </span>
              {subscriptions.length > activeSubscriptions.length && (
                <span className="text-gray-400">
                  {subscriptions.length - activeSubscriptions.length} paused
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="space-y-4">
          {Object.entries(subscriptionsByCategory).map(([category, subs]) => {
            const categoryInfo = SUBSCRIPTION_CATEGORY_INFO[category as keyof typeof SUBSCRIPTION_CATEGORY_INFO];
            return (
              <div key={category}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryInfo?.color || '#6b7280' }}
                  />
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {categoryInfo?.label || category}
                  </h3>
                </div>

                {/* Subscription Cards */}
                <div className="space-y-3">
                  {subs.map((subscription) => {
                    const nextBilling = getNextBillingDate(subscription);
                    const daysUntil = differenceInDays(nextBilling, new Date());
                    const monthlyAmount = getMonthlyAmount(subscription.amount, subscription.frequency);

                    return (
                      <div
                        key={subscription.id}
                        className={`card bg-white rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden ${
                          !subscription.isActive ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Color bar */}
                        <div
                          className="h-1 -mx-4 -mt-4 mb-3"
                          style={{ backgroundColor: categoryInfo?.color || '#6b7280' }}
                        />

                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {subscription.name}
                              </h4>
                              {!subscription.isActive && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                                  Paused
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatCurrency(subscription.amount)} · {formatFrequency(subscription.frequency)}
                            </p>
                            {subscription.isActive && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {format(nextBilling, 'MMM d, yyyy')}
                                </span>
                                {daysUntil <= 7 && daysUntil >= 0 && (
                                  <span
                                    className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                      daysUntil === 0
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-amber-100 text-amber-600'
                                    }`}
                                  >
                                    {daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Amount and Actions */}
                          <div className="flex items-start gap-2">
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(subscription.amount)}
                              </p>
                              <p className="text-xs text-gray-400">
                                ~{formatCurrency(monthlyAmount)}/mo
                              </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleToggleActive(subscription)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors"
                                title={subscription.isActive ? 'Pause' : 'Resume'}
                              >
                                {subscription.isActive ? <Pause size={16} /> : <Play size={16} />}
                              </button>
                              <button
                                onClick={() => handleEdit(subscription)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(subscription)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-xl transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        subscription={editingSubscription}
      />
    </div>
  );
}
