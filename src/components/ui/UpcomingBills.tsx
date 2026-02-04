/**
 * Upcoming Bills Component - Kawaii Edition
 *
 * Displays a sorted list of bills by next due date with urgency indicators.
 * Features tabbed view: "This Pay Period" vs "All Bills" with income source picker.
 * Shows paid status for bills that have been paid this month.
 */

import { useState, useMemo } from 'react';
import { differenceInDays, isSameMonth, parseISO, addDays, addWeeks, format, isBefore, isAfter } from 'date-fns';
import { Check, ChevronDown, Calendar, Wallet } from 'lucide-react';
import type { Debt, Payment, IncomeSource } from '../../types';
import { CATEGORY_INFO } from '../../types';
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
}

interface BillWithDueDate extends Debt {
  nextDueDate: Date;
  daysUntil: number;
}

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

// Get pay period interval (from today to next payday)
function getPayPeriodInterval(source: IncomeSource, today: Date): { start: Date; end: Date } {
  const nextPayday = getNextPayday(source, today);
  return {
    start: today,
    end: nextPayday,
  };
}

export function UpcomingBills({ debts, customCategories = [], payments = [], incomeSources = [] }: UpcomingBillsProps) {
  const [activeTab, setActiveTab] = useState<TabType>(incomeSources.length > 0 ? 'pay-period' : 'all');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(incomeSources[0]?.id || '');
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Get selected income source
  const selectedSource = useMemo(() => {
    return incomeSources.find((s) => s.id === selectedSourceId) || incomeSources[0];
  }, [incomeSources, selectedSourceId]);

  // Calculate pay period for selected source
  const payPeriod = useMemo(() => {
    if (!selectedSource) return null;
    return getPayPeriodInterval(selectedSource, today);
  }, [selectedSource, today]);

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

  // Filter bills by pay period
  const payPeriodBills = useMemo((): BillWithDueDate[] => {
    if (!payPeriod) return [];
    return sortedBills.filter((bill) => {
      // Include bills due between now and next payday (inclusive)
      return !isAfter(bill.nextDueDate, payPeriod.end);
    });
  }, [sortedBills, payPeriod]);

  // Get the bills to display based on active tab
  const displayBills = activeTab === 'pay-period' ? payPeriodBills : sortedBills;

  // Calculate total due this pay period
  const payPeriodTotal = useMemo(() => {
    return payPeriodBills.reduce((sum, bill) => {
      const paidPayment = isPaidThisMonth(bill.id);
      if (paidPayment) return sum; // Don't count paid bills
      return sum + bill.minimumPayment;
    }, 0);
  }, [payPeriodBills]);

  // Get category color for a debt
  const getCategoryColor = (debt: Debt): string => {
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
        bg: 'bg-amber-50 border-amber-200',
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
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('pay-period')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'pay-period'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Pay Period
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              All
            </button>
          </div>
        )}
      </div>

      {/* Pay Period Info Bar */}
      {activeTab === 'pay-period' && hasIncomeSources && payPeriod && selectedSource && (
        <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/20 rounded-2xl border border-primary-100 dark:border-primary-800">
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
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Until next payday</p>
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
                      onClick={() => {
                        setSelectedSourceId(source.id);
                        setShowSourcePicker(false);
                      }}
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

            {/* Pay period date and total */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-end">
                <Calendar size={12} />
                {format(payPeriod.end, 'MMM d')}
              </p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
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
          const paidPayment = isPaidThisMonth(bill.id);
          const isPaid = !!paidPayment;

          return (
            <div
              key={bill.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl border transition-all
                ${isPaid
                  ? 'bg-green-50 border-green-200'
                  : urgency.bg
                }
              `}
            >
              {/* Category color dot or paid checkmark */}
              {isPaid ? (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Check size={16} className="text-white" strokeWidth={3} />
                </div>
              ) : (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                />
              )}

              {/* Bill info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isPaid ? 'text-green-700' : 'text-gray-900'}`}>
                  {bill.name}
                  {isPaid && (
                    <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                      Paid
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {isPaid
                    ? `Paid ${formatCurrency(paidPayment.amount)} this month`
                    : `Due ${formatOrdinal(bill.dueDay)} of each month`
                  }
                </p>
              </div>

              {/* Amount and urgency badge */}
              <div className="text-right flex-shrink-0">
                <p className={`font-semibold ${isPaid ? 'text-green-600' : 'text-gray-900'}`}>
                  {formatCurrency(isPaid && paidPayment ? paidPayment.amount : bill.minimumPayment)}
                </p>
                {!isPaid && urgency.badge && (
                  <span
                    className={`
                      inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1
                      ${bill.daysUntil === 0
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-white'
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
