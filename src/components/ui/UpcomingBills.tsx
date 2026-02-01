/**
 * Upcoming Bills Component
 *
 * Displays a sorted list of bills by next due date with urgency indicators.
 * Shows today, within 7 days, or normal styling based on urgency.
 * Shows paid status for bills that have been paid this month.
 */

import { useMemo } from 'react';
import { differenceInDays, isSameMonth, parseISO } from 'date-fns';
import { Check } from 'lucide-react';
import type { Debt, Payment } from '../../types';
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
}

interface BillWithDueDate extends Debt {
  nextDueDate: Date;
  daysUntil: number;
}

export function UpcomingBills({ debts, customCategories = [], payments = [] }: UpcomingBillsProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

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
      <h3 className="text-sm text-gray-500 mb-4">UPCOMING BILLS</h3>

      <div className="space-y-3">
        {sortedBills.map((bill) => {
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
