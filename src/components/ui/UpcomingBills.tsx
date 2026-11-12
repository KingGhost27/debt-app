/**
 * Upcoming Bills Component
 *
 * Displays a sorted list of bills by next due date with urgency indicators.
 * Tabbed view: "This Pay Period" vs "All Bills" with income source picker.
 * Shows paid status for bills that have been paid this month. No card of its
 * own: it sits inside a ranch card (dashboard section). Styled in
 * pages/track.css (.upb-*) from the ranch tokens.
 */

import { useState, useMemo } from 'react';
import { differenceInDays, isSameMonth, parseISO, addDays, addWeeks, addMonths, addYears, format, isBefore } from 'date-fns';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Calendar, PartyPopper, Receipt, Wallet, Repeat } from 'lucide-react';
import { Plank } from '../dashboard/RanchPanels';
import type { Debt, Payment, IncomeSource, Subscription, SubscriptionCategory } from '../../types';
import { CATEGORY_INFO, SUBSCRIPTION_CATEGORY_INFO } from '../../types';
import {
  formatCurrency,
  formatOrdinal,
  getNextDueDate,
} from '../../lib/calculations';
import '../../pages/track.css';

interface UpcomingBillsProps {
  debts: Debt[];
  customCategories?: { id: string; name: string; color: string }[];
  payments?: Payment[];
  incomeSources?: IncomeSource[];
  subscriptions?: Subscription[];
}

interface BillWithDueDate extends Debt {
  nextDueDate: Date;
  daysUntil: number;
}

interface SubscriptionWithDueDate {
  id: string;
  name: string;
  amount: number;
  nextDueDate: Date;
  daysUntil: number;
  category: SubscriptionCategory;
  isSubscription: true;
}

type BillItem = (BillWithDueDate & { isSubscription?: false }) | SubscriptionWithDueDate;

type TabType = 'pay-period' | 'all';

// Calculate the next payday based on frequency and last known pay date
function getNextPayday(source: IncomeSource, fromDate: Date): Date {
  if (!source.nextPayDate) {
    // If no next pay date set, estimate based on frequency
    const daysToAdd = {
      weekly: 7,
      'bi-weekly': 14,
      'semi-monthly': 15,
      monthly: 30,
    };
    return addDays(fromDate, daysToAdd[source.payFrequency]);
  }

  let nextPay = parseISO(source.nextPayDate);

  // If the stored next pay date is in the past, calculate the next one
  while (isBefore(nextPay, fromDate)) {
    switch (source.payFrequency) {
      case 'weekly':
        nextPay = addWeeks(nextPay, 1);
        break;
      case 'bi-weekly':
        nextPay = addWeeks(nextPay, 2);
        break;
      case 'semi-monthly':
        // Roughly 15 days
        nextPay = addDays(nextPay, 15);
        break;
      case 'monthly':
        nextPay = addDays(nextPay, 30);
        break;
    }
  }

  return nextPay;
}

// Get the length of a pay period in days/weeks
function getPayPeriodLength(frequency: IncomeSource['payFrequency']): { weeks?: number; days?: number } {
  switch (frequency) {
    case 'weekly':
      return { weeks: 1 };
    case 'bi-weekly':
      return { weeks: 2 };
    case 'semi-monthly':
      return { days: 15 };
    case 'monthly':
      return { days: 30 };
    default:
      return { weeks: 2 };
  }
}

// Get pay period interval (from last payday to next payday)
// offset: 0 = current period, 1 = next period, -1 = previous period, etc.
function getPayPeriodInterval(source: IncomeSource, today: Date, offset: number = 0): { start: Date; end: Date } {
  const nextPayday = getNextPayday(source, today);
  const periodLength = getPayPeriodLength(source.payFrequency);

  // Calculate the base pay period end (next payday)
  let periodEnd = nextPayday;

  // Apply offset to move forward or backward through pay periods
  if (offset !== 0) {
    if (periodLength.weeks) {
      periodEnd = addWeeks(nextPayday, offset * periodLength.weeks);
    } else if (periodLength.days) {
      periodEnd = addDays(nextPayday, offset * periodLength.days);
    }
  }

  // Calculate the start of the pay period
  let periodStart: Date;
  if (periodLength.weeks) {
    periodStart = addWeeks(periodEnd, -periodLength.weeks);
  } else if (periodLength.days) {
    periodStart = addDays(periodEnd, -periodLength.days);
  } else {
    periodStart = today;
  }

  return {
    start: periodStart,
    end: periodEnd,
  };
}

// Find the due date that falls within or near a pay period
// Returns the due date in the pay period's month range
function getDueDateInPeriod(dueDay: number, periodStart: Date, periodEnd: Date): Date | null {
  // Check if due day falls in the start month
  const startMonth = periodStart.getMonth();
  const startYear = periodStart.getFullYear();
  const endMonth = periodEnd.getMonth();
  const endYear = periodEnd.getFullYear();

  // Get last day of each month to clamp the due day
  const lastDayOfStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const lastDayOfEndMonth = new Date(endYear, endMonth + 1, 0).getDate();

  // Try due date in start month
  const clampedDayStart = Math.min(dueDay, lastDayOfStartMonth);
  const dueDateInStartMonth = new Date(startYear, startMonth, clampedDayStart);

  // Try due date in end month (if different from start month)
  const clampedDayEnd = Math.min(dueDay, lastDayOfEndMonth);
  const dueDateInEndMonth = new Date(endYear, endMonth, clampedDayEnd);

  // Check which one falls within the period
  const dates: Date[] = [];

  if (dueDateInStartMonth >= periodStart && dueDateInStartMonth <= periodEnd) {
    dates.push(dueDateInStartMonth);
  }

  if (startMonth !== endMonth || startYear !== endYear) {
    if (dueDateInEndMonth >= periodStart && dueDateInEndMonth <= periodEnd) {
      dates.push(dueDateInEndMonth);
    }
  }

  // Return the earliest date that falls in the period
  if (dates.length === 0) return null;
  return dates.sort((a, b) => a.getTime() - b.getTime())[0];
}

// Get subscription billing date that falls within a period
function getSubscriptionBillingInPeriod(
  subscription: Subscription,
  periodStart: Date,
  periodEnd: Date
): Date | null {
  let billingDate = parseISO(subscription.nextBillingDate);

  // Move forward until we find a date in or after the period
  while (isBefore(billingDate, periodStart)) {
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

  // Check if the billing date falls within the period
  if (billingDate >= periodStart && billingDate <= periodEnd) {
    return billingDate;
  }

  return null;
}

export function UpcomingBills({ debts, customCategories = [], payments = [], incomeSources = [], subscriptions = [] }: UpcomingBillsProps) {
  const [activeTab, setActiveTab] = useState<TabType>(incomeSources.length > 0 ? 'pay-period' : 'all');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(incomeSources[0]?.id || '');
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current, -1 = previous, 1 = next

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Get selected income source
  const selectedSource = useMemo(() => {
    return incomeSources.find((s) => s.id === selectedSourceId) || incomeSources[0];
  }, [incomeSources, selectedSourceId]);

  // Reset period offset when changing income source
  const handleSourceChange = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setPeriodOffset(0);
    setShowSourcePicker(false);
  };

  // Calculate pay period for selected source with offset
  const payPeriod = useMemo(() => {
    if (!selectedSource) return null;
    return getPayPeriodInterval(selectedSource, today, periodOffset);
  }, [selectedSource, today, periodOffset]);

  // Get label for the current period
  const periodLabel = useMemo(() => {
    if (periodOffset === 0) return 'This pay period';
    if (periodOffset === -1) return 'Last pay period';
    if (periodOffset === 1) return 'Next pay period';
    if (periodOffset < 0) return `${Math.abs(periodOffset)} periods ago`;
    return `${periodOffset} periods ahead`;
  }, [periodOffset]);

  // Check if a debt has been paid this month
  const isPaidThisMonth = (debtId: string): Payment | undefined => {
    return payments.find((p) => {
      if (!p.isCompleted || !p.completedAt || p.debtId !== debtId) return false;
      const paidDate = parseISO(p.completedAt);
      return isSameMonth(paidDate, today);
    });
  };

  // Calculate next due dates and sort by urgency
  const sortedBills = useMemo((): BillWithDueDate[] => {
    return debts
      .map((debt) => {
        const nextDueDate = getNextDueDate(debt.dueDay, today);
        const daysUntil = differenceInDays(nextDueDate, today);
        return { ...debt, nextDueDate, daysUntil };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [debts, today]);

  // Filter bills by pay period (debts + subscriptions)
  const payPeriodBills = useMemo((): BillItem[] => {
    if (!payPeriod) return [];

    // Get debt bills in pay period
    const debtBills: BillItem[] = debts
      .map((debt) => {
        const dueDateInPeriod = getDueDateInPeriod(debt.dueDay, payPeriod.start, payPeriod.end);
        if (!dueDateInPeriod) return null;

        const daysUntil = differenceInDays(dueDateInPeriod, today);
        return { ...debt, nextDueDate: dueDateInPeriod, daysUntil, isSubscription: false as const };
      })
      .filter((bill) => bill !== null) as BillItem[];

    // Get subscription bills in pay period
    const subBills: SubscriptionWithDueDate[] = subscriptions
      .filter((sub) => sub.isActive)
      .map((sub) => {
        const billingDate = getSubscriptionBillingInPeriod(sub, payPeriod.start, payPeriod.end);
        if (!billingDate) return null;

        const daysUntil = differenceInDays(billingDate, today);
        return {
          id: sub.id,
          name: sub.name,
          amount: sub.amount,
          nextDueDate: billingDate,
          daysUntil,
          category: sub.category,
          isSubscription: true as const,
        };
      })
      .filter((bill) => bill !== null) as SubscriptionWithDueDate[];

    // Combine and sort by date
    return [...debtBills, ...subBills].sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  }, [debts, subscriptions, payPeriod, today]);

  // Get the bills to display based on active tab
  const displayBills: BillItem[] = activeTab === 'pay-period'
    ? payPeriodBills
    : sortedBills.map((b) => ({ ...b, isSubscription: false as const }));

  // Calculate total due this pay period
  const payPeriodTotal = useMemo(() => {
    return payPeriodBills.reduce((sum, bill) => {
      if (bill.isSubscription) {
        return sum + bill.amount;
      }
      const paidPayment = isPaidThisMonth(bill.id);
      if (paidPayment) return sum; // Don't count paid bills
      return sum + (bill as BillWithDueDate).minimumPayment;
    }, 0);
  }, [payPeriodBills]);

  // Get category color for a debt or subscription
  const getCategoryColor = (item: BillItem): string => {
    if (item.isSubscription) {
      const subCatInfo = SUBSCRIPTION_CATEGORY_INFO[item.category as keyof typeof SUBSCRIPTION_CATEGORY_INFO];
      return subCatInfo?.color || '#6b7280';
    }
    const debt = item as BillWithDueDate;
    if (debt.category in CATEGORY_INFO) {
      return CATEGORY_INFO[debt.category as keyof typeof CATEGORY_INFO].color;
    }
    const customCat = customCategories.find((c) => c.id === debt.category);
    return customCat?.color || '#6b7280';
  };

  // Urgency: due today is the focus color, within a week is "soon"
  const urgencyOf = (daysUntil: number): { cls: string; badge: string | null } => {
    if (daysUntil === 0) return { cls: 'is-today', badge: 'Today' };
    if (daysUntil <= 7) return { cls: 'is-soon', badge: `${daysUntil} day${daysUntil !== 1 ? 's' : ''}` };
    return { cls: '', badge: null };
  };

  // Check if we have income sources to show pay period view
  const hasIncomeSources = incomeSources.length > 0;

  if (debts.length === 0) {
    return (
      <section className="rui-card upb">
        <div className="trk-mod-h"><Plank icon={<Receipt size={18} aria-hidden="true" />}>Bills</Plank></div>
        <p className="cht-empty">Add debts to track upcoming bills</p>
      </section>
    );
  }

  return (
    <section className="rui-card upb">
      <div className="trk-mod-h">
        <Plank icon={<Receipt size={18} aria-hidden="true" />}>Bills</Plank>
      {/* Tabs */}
      {hasIncomeSources && (
        <div className="upb-tabs" role="tablist" aria-label="Bill range">
          <button type="button" role="tab" aria-selected={activeTab === 'pay-period'} className={activeTab === 'pay-period' ? 'is-on' : ''} onClick={() => setActiveTab('pay-period')}>
            Pay Period
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'all'} className={activeTab === 'all' ? 'is-on' : ''} onClick={() => setActiveTab('all')}>
            All
          </button>
        </div>
      )}
      </div>

      {/* Pay Period Info Bar */}
      {activeTab === 'pay-period' && hasIncomeSources && payPeriod && selectedSource && (
        <div className="upb-period">
          <div className="upb-range">
            <button type="button" onClick={() => setPeriodOffset(periodOffset - 1)} className="cal-nav-btn" aria-label="Previous pay period">
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <div>
              <p>{periodLabel}</p>
              <b className="num">
                <Calendar size={15} aria-hidden="true" />
                {format(payPeriod.start, 'MMM d')} — {format(payPeriod.end, 'MMM d')}
              </b>
            </div>
            <button type="button" onClick={() => setPeriodOffset(periodOffset + 1)} className="cal-nav-btn" aria-label="Next pay period">
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="upb-src">
            <div className="upb-pick">
              <button
                type="button"
                onClick={() => setShowSourcePicker(!showSourcePicker)}
                aria-expanded={showSourcePicker}
                disabled={incomeSources.length < 2}
              >
                <span className="upb-ic"><Wallet size={16} aria-hidden="true" /></span>
                <span className="upb-pick-t">
                  <small>Next payday</small>
                  <b>
                    {selectedSource.name}
                    {incomeSources.length > 1 && <ChevronDown size={15} className={showSourcePicker ? 'is-open' : ''} aria-hidden="true" />}
                  </b>
                </span>
              </button>

              {showSourcePicker && incomeSources.length > 1 && (
                <ul className="upb-menu">
                  {incomeSources.map((source) => (
                    <li key={source.id}>
                      <button type="button" onClick={() => handleSourceChange(source.id)} className={source.id === selectedSourceId ? 'is-on' : ''}>
                        <Wallet size={15} aria-hidden="true" />
                        {source.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="upb-total">
              <small>Total due</small>
              <b className="num">{formatCurrency(payPeriodTotal)}</b>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for pay period */}
      {activeTab === 'pay-period' && displayBills.length === 0 && (
        <p className="upb-empty">
          <PartyPopper size={22} aria-hidden="true" />
          No bills due this pay period!
        </p>
      )}

      <ul className="upb-list">
        {displayBills.map((bill) => {
          const urgency = urgencyOf(bill.daysUntil);
          const categoryColor = getCategoryColor(bill);
          const isSubscription = bill.isSubscription;

          // Only check paid status for debt bills, not subscriptions
          const paidPayment = !isSubscription ? isPaidThisMonth(bill.id) : undefined;
          const isPaid = !!paidPayment;

          const displayAmount = isSubscription
            ? bill.amount
            : isPaid && paidPayment
              ? paidPayment.amount
              : (bill as BillWithDueDate).minimumPayment;

          return (
            <li key={`${isSubscription ? 'sub' : 'debt'}-${bill.id}`} className={isPaid ? 'is-paid' : urgency.cls}>
              {/* Check for paid, repeat for subscription, category dot for debt */}
              {isPaid ? (
                <span className="upb-ic is-paid"><Check size={16} strokeWidth={3} aria-hidden="true" /></span>
              ) : isSubscription ? (
                <span className="upb-ic" style={{ color: categoryColor }}><Repeat size={16} aria-hidden="true" /></span>
              ) : (
                <span className="upb-ic"><i style={{ background: categoryColor }} /></span>
              )}

              <div className="upb-n">
                <p>
                  <b>{bill.name}</b>
                  {isPaid && <span className="rui-badge ok">Paid</span>}
                  {isSubscription && !isPaid && <span className="rui-badge soon">Sub</span>}
                </p>
                <small>
                  {isPaid
                    ? `Paid ${formatCurrency(paidPayment!.amount)} this month`
                    : isSubscription
                      ? `Renews ${format(bill.nextDueDate, 'MMM d')}`
                      : `Due ${formatOrdinal((bill as BillWithDueDate).dueDay)} of each month`}
                </small>
              </div>

              <div className="upb-amt">
                <b className="num">{formatCurrency(displayAmount)}</b>
                {!isPaid && urgency.badge && (
                  <span className={`rui-badge ${bill.daysUntil === 0 ? 'focus' : 'soon'}`}>{urgency.badge}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
