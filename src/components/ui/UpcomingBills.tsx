/**
 * Upcoming Bills Component - Kawaii Edition
 *
 * Displays a sorted list of bills by next due date with urgency indicators.
 * Features tabbed view: "This Pay Period" vs "All Bills" with income source picker.
 * Shows paid status for bills that have been paid this month.
 */

import { useState, useMemo } from 'react';
import { differenceInDays, isSameMonth, parseISO, addDays, addWeeks, addMonths, addYears, format, isBefore } from 'date-fns';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Calendar, Wallet, RefreshCw } from 'lucide-react';
import type { Debt, Payment, IncomeSource, Subscription, SubscriptionCategory } from '../../types';
import { CATEGORY_INFO, SUBSCRIPTION_CATEGORY_INFO } from '../../types';
import {
  formatCurrency,
  formatOrdinal,
  getNextDueDate,
} from '../../lib/calculations';

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

  // Get urgency styling
  const getUrgencyStyles = (daysUntil: number): { bg: string; badge: string | null } => {
    if (daysUntil === 0) {
      return {
        bg: 'bg-red-50 border-red-200',
        badge: 'TODAY',
      };
    }
    if (daysUntil <= 7) {
      return {
        bg: 'bg-primary-50 border-primary-200',
        badge: `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      };
    }
    return {
      bg: 'bg-gray-50 border-gray-100',
      badge: null,
    };
  };

  // Check if we have income sources to show pay period view
  const hasIncomeSources = incomeSources.length > 0;

  if (debts.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm text-gray-500 mb-3">UPCOMING BILLS</h3>
        <div className="text-center py-6 text-gray-500 text-sm">
          Add debts to track upcoming bills
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Bills
        </h3>

        {/* Tabs */}
        {hasIncomeSources && (
          <div className="flex bg-primary-200/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('pay-period')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'pay-period'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-primary-700/70 hover:text-primary-800'
              }`}
            >
              Pay Period
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-primary-700/70 hover:text-primary-800'
              }`}
            >
              All
            </button>
          </div>
        )}
      </div>

      {/* Pay Period Info Bar */}
      {activeTab === 'pay-period' && hasIncomeSources && payPeriod && selectedSource && (
        <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/20 rounded-2xl border border-primary-100 dark:border-primary-800">
          {/* Date Range Header with Navigation */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-primary-200/50 dark:border-primary-700/50">
            {/* Previous button */}
            <button
              onClick={() => setPeriodOffset(periodOffset - 1)}
              className="p-1.5 rounded-lg hover:bg-primary-200/50 dark:hover:bg-primary-700/50 transition-colors"
              aria-label="Previous pay period"
            >
              <ChevronLeft size={20} className="text-primary-600 dark:text-primary-400" />
            </button>

            {/* Date range and label */}
            <div className="text-center">
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-0.5">
                {periodLabel}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Calendar size={14} className="text-primary-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {format(payPeriod.start, 'MMM d')} — {format(payPeriod.end, 'MMM d')}
                </span>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={() => setPeriodOffset(periodOffset + 1)}
              className="p-1.5 rounded-lg hover:bg-primary-200/50 dark:hover:bg-primary-700/50 transition-colors"
              aria-label="Next pay period"
            >
              <ChevronRight size={20} className="text-primary-600 dark:text-primary-400" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Income source picker */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowSourcePicker(!showSourcePicker)}
                className="flex items-center gap-2 text-left w-full"
              >
                <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <Wallet size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Next payday</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1">
                    {selectedSource.name}
                    {incomeSources.length > 1 && (
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${showSourcePicker ? 'rotate-180' : ''}`} />
                    )}
                  </p>
                </div>
              </button>

              {/* Dropdown */}
              {showSourcePicker && incomeSources.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 overflow-hidden">
                  {incomeSources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => handleSourceChange(source.id)}
                      className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                        source.id === selectedSourceId ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Wallet size={14} />
                      {source.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Total due */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total due</p>
              <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(payPeriodTotal)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for pay period */}
      {activeTab === 'pay-period' && displayBills.length === 0 && (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No bills due this pay period!</p>
        </div>
      )}

      <div className="space-y-3">
        {displayBills.map((bill) => {
          const urgency = getUrgencyStyles(bill.daysUntil);
          const categoryColor = getCategoryColor(bill);
          const isSubscription = bill.isSubscription;

          // Only check paid status for debt bills, not subscriptions
          const paidPayment = !isSubscription ? isPaidThisMonth(bill.id) : undefined;
          const isPaid = !!paidPayment;

          // Get the amount to display
          const displayAmount = isSubscription
            ? bill.amount
            : isPaid && paidPayment
              ? paidPayment.amount
              : (bill as BillWithDueDate).minimumPayment;

          return (
            <div
              key={`${isSubscription ? 'sub' : 'debt'}-${bill.id}`}
              className={`
                flex items-center gap-3 p-3 rounded-xl border transition-all
                ${isPaid
                  ? 'bg-green-50 border-green-200'
                  : urgency.bg
                }
              `}
            >
              {/* Icon: checkmark for paid, RefreshCw for subscription, or color dot for debt */}
              {isPaid ? (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Check size={16} className="text-white" strokeWidth={3} />
                </div>
              ) : isSubscription ? (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${categoryColor}20` }}
                >
                  <RefreshCw size={14} style={{ color: categoryColor }} />
                </div>
              ) : (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                />
              )}

              {/* Bill info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isPaid ? 'text-green-700' : 'text-gray-900 dark:text-white'}`}>
                  {bill.name}
                  {isPaid && (
                    <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                      Paid
                    </span>
                  )}
                  {isSubscription && !isPaid && (
                    <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                      Sub
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isPaid
                    ? `Paid ${formatCurrency(paidPayment!.amount)} this month`
                    : isSubscription
                      ? `Renews ${format(bill.nextDueDate, 'MMM d')}`
                      : `Due ${formatOrdinal((bill as BillWithDueDate).dueDay)} of each month`
                  }
                </p>
              </div>

              {/* Amount and urgency badge */}
              <div className="text-right flex-shrink-0">
                <p className={`font-semibold ${isPaid ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                  {formatCurrency(displayAmount)}
                </p>
                {!isPaid && urgency.badge && (
                  <span
                    className={`
                      inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1
                      ${bill.daysUntil === 0
                        ? 'bg-red-500 text-white'
                        : 'bg-primary-500 text-white'
                      }
                    `}
                  >
                    {urgency.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
