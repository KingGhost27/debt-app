/**
 * Subscriptions Page - the ranch's recurring bills.
 *
 * Track recurring subscription services with custom billing frequencies.
 * The "Recurring costs" card (adapted from the 21st.dev Dot Graph Card, see
 * components/ui/DotGraphCard.tsx) shows what bills each day this month and each
 * month of the next year; below it the subscriptions sit in ranch cards grouped
 * by category. Also rendered inside Track's Subs tab (embedded). Styled in
 * subscriptions.css from the --ranch-* tokens.
 */

import { useState, useMemo } from 'react';
import { CalendarDays, Pause, Pencil, Play, Plus, Repeat, Trash2, Tv } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { format, parseISO, differenceInDays, addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Plank } from '../components/dashboard/RanchPanels';
import { SubscriptionModal } from '../components/ui/SubscriptionModal';
import { DotGraphCard } from '../components/ui/DotGraphCard';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency } from '../lib/calculations';
import type { Subscription, SubscriptionFrequency } from '../types';
import { SUBSCRIPTION_CATEGORY_INFO } from '../types';
import './subscriptions.css';

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
    <button type="button" onClick={() => setIsModalOpen(true)} className="sub-btn" aria-label="Add subscription">
      <Plus size={18} aria-hidden="true" />
      Add
    </button>
  );

  const emptyState = (
    <EmptyState
      icon={Tv}
      title="No Subscriptions Yet"
      description="Add your streaming services, software subscriptions, and other recurring charges to track your spending."
      action={{ label: 'Add Your First Subscription', onClick: () => setIsModalOpen(true) }}
      encouragement="Stay on top of your recurring costs!"
    />
  );

  // Empty state
  if (subscriptions.length === 0) {
    if (embedded) {
      return (
        <div className="sub-body is-embedded">
          <div className="sub-add">{addButton}</div>
          {emptyState}
          <SubscriptionModal isOpen={isModalOpen} onClose={handleCloseModal} subscription={editingSubscription} />
          <ConfirmDialog {...dialogProps} />
        </div>
      );
    }
    return (
      <div className="sub animate-page-enter">
        <PageHeader title="Subscriptions" subtitle="Track recurring services" />
        <div className="sub-body">{emptyState}</div>
        <SubscriptionModal isOpen={isModalOpen} onClose={handleCloseModal} subscription={editingSubscription} />
        <ConfirmDialog {...dialogProps} />
      </div>
    );
  }

  const pausedCount = subscriptions.length - activeSubscriptions.length;

  const sharedContent = (
    <>
      <DotGraphCard
        subscriptions={subscriptions}
        monthlyTotal={monthlyTotal}
        footer={
          <dl className="sub-stats">
            <div>
              <dt>Annual</dt>
              <dd className="num">{formatCurrency(annualTotal)}</dd>
            </div>
            <div>
              <dt>Active</dt>
              <dd className="num">{activeSubscriptions.length} subscription{activeSubscriptions.length !== 1 ? 's' : ''}</dd>
            </div>
            {pausedCount > 0 && (
              <div>
                <dt>Paused</dt>
                <dd className="num">{pausedCount}</dd>
              </div>
            )}
          </dl>
        }
      />

      {/* Subscriptions List */}
      <div className="sub-groups">
        {Object.entries(subscriptionsByCategory).map(([category, subs]) => {
          const categoryInfo = SUBSCRIPTION_CATEGORY_INFO[category as keyof typeof SUBSCRIPTION_CATEGORY_INFO];
          const color = categoryInfo?.color || '#6b7280';
          return (
            <section key={category} className="sub-group">
              <div className="sub-group-h">
                <Plank icon={<i className="sub-cdot" style={{ background: color }} />}>{categoryInfo?.label || category}</Plank>
              </div>
              <ul className="rui-card sub-list">
                {subs.map((subscription) => {
                  const nextBilling = getNextBillingDate(subscription);
                  const daysUntil = differenceInDays(nextBilling, new Date());
                  const soon = subscription.isActive && daysUntil <= 7 && daysUntil >= 0;
                  return (
                    <li key={subscription.id} className={subscription.isActive ? '' : 'is-paused'}>
                      <span className="sub-ic" style={{ '--sub-c': color } as React.CSSProperties}>
                        <Repeat size={18} aria-hidden="true" />
                      </span>
                      <div className="sub-n">
                        <b>
                          <span>{subscription.name}</span>
                          {!subscription.isActive && <span className="rui-badge soon">Paused</span>}
                        </b>
                        <small>
                          <span>{formatFrequency(subscription.frequency)}</span>
                          {subscription.isActive && (
                            <span className="sub-date">
                              <CalendarDays size={14} aria-hidden="true" />
                              {format(nextBilling, 'MMM d')}
                            </span>
                          )}
                          {soon && (
                            <span className={`rui-badge ${daysUntil === 0 ? 'focus' : 'soon'}`}>
                              {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                            </span>
                          )}
                        </small>
                      </div>
                      <b className="sub-amt num">{formatCurrency(subscription.amount)}</b>
                      <div className="sub-acts">
                        <button type="button" onClick={() => handleToggleActive(subscription)} className="sub-icon-btn" title={subscription.isActive ? 'Pause' : 'Resume'} aria-label={`${subscription.isActive ? 'Pause' : 'Resume'} ${subscription.name}`}>
                          {subscription.isActive ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
                        </button>
                        <button type="button" onClick={() => handleEdit(subscription)} className="sub-icon-btn" title="Edit" aria-label={`Edit ${subscription.name}`}>
                          <Pencil size={17} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => handleDelete(subscription)} className="sub-icon-btn is-bad" title="Delete" aria-label={`Delete ${subscription.name}`}>
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="sub-body is-embedded">
        <div className="sub-add">{addButton}</div>
        {sharedContent}
        <SubscriptionModal isOpen={isModalOpen} onClose={handleCloseModal} subscription={editingSubscription} />
        <ConfirmDialog {...dialogProps} />
      </div>
    );
  }

  return (
    <div className="sub animate-page-enter">
      <PageHeader title="Subscriptions" subtitle="Track recurring services" action={addButton} />
      <div className="sub-body">{sharedContent}</div>
      <SubscriptionModal isOpen={isModalOpen} onClose={handleCloseModal} subscription={editingSubscription} />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
