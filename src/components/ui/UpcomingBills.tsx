/**
 * Upcoming Bills Component
 *
 * Displays a sorted list of bills by next due date with urgency indicators.
 * Shows today, within 7 days, or normal styling based on urgency.
 */

import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import type { Debt } from '../../types';
import { CATEGORY_INFO } from '../../types';
import {
  formatCurrency,
  formatOrdinal,
  getNextDueDate,
} from '../../lib/calculations';

interface UpcomingBillsProps {
  debts: Debt[];
  customCategories?: { id: string; name: string; color: string }[];
}

interface BillWithDueDate extends Debt {
  nextDueDate: Date;
  daysUntil: number;
}

export function UpcomingBills({ debts, customCategories = [] }: UpcomingBillsProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

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

          return (
            <div
              key={bill.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl border
                ${urgency.bg}
              `}
            >
              {/* Category color dot */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryColor }}
              />

              {/* Bill info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {bill.name}
                </p>
                <p className="text-sm text-gray-500">
                  Due {formatOrdinal(bill.dueDay)} of each month
                </p>
              </div>

              {/* Amount and urgency badge */}
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(bill.minimumPayment)}
                </p>
                {urgency.badge && (
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
