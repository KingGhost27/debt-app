/**
 * Mini Calendar Component
 *
 * Visual monthly calendar showing bill due dates and paydays.
 * Highlights days with bills (pink) and paydays (green $).
 * Supports navigation to previous/future months.
 */

import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { Debt, IncomeSource, Subscription } from '../../types';
import { CATEGORY_INFO, SUBSCRIPTION_CATEGORY_INFO } from '../../types';
import { getPaydaysInMonth, getPayCycleEndsInMonth } from '../../lib/calculations';

interface MiniCalendarProps {
  debts: Debt[];
  incomeSources?: IncomeSource[];
  subscriptions?: Subscription[];
  customCategories?: { id: string; name: string; color: string }[];
  size?: 'small' | 'large';
}

export function MiniCalendar({ debts, incomeSources = [], subscriptions = [], customCategories = [], size = 'small' }: MiniCalendarProps) {
  const isLarge = size === 'large';
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  // Today's date (for highlighting current day)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Displayed month (can be navigated)
  const [displayedMonth, setDisplayedMonth] = useState<Date>(today);

  // Navigation handlers
  const goToPreviousMonth = () => setDisplayedMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setDisplayedMonth((prev) => addMonths(prev, 1));
  const goToCurrentMonth = () => setDisplayedMonth(today);

  // Check if we're viewing the current month
  const isCurrentMonth = isSameMonth(displayedMonth, today);

  // Build a map of day -> debts due that day
  const dueDateMap = useMemo(() => {
    const map = new Map<number, Debt[]>();
    debts.forEach((debt) => {
      const day = debt.dueDay;
      if (!map.has(day)) {
        map.set(day, []);
      }
      map.get(day)!.push(debt);
    });
    return map;
  }, [debts]);

  // Build a map of day -> income sources with paydays that day (for displayed month)
  const paydayMap = useMemo(() => {
    const map = new Map<number, IncomeSource[]>();
    incomeSources.forEach((source) => {
      const paydays = getPaydaysInMonth(source, displayedMonth);
      paydays.forEach((payday) => {
        const day = payday.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)!.push(source);
      });
    });
    return map;
  }, [incomeSources, displayedMonth]);

  // Build a map of day -> income sources with pay cycle ends that day
  const cycleEndMap = useMemo(() => {
    const map = new Map<number, IncomeSource[]>();
    incomeSources.forEach((source) => {
      const cycleEnds = getPayCycleEndsInMonth(source, displayedMonth);
      cycleEnds.forEach((cycleEnd) => {
        const day = cycleEnd.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)!.push(source);
      });
    });
    return map;
  }, [incomeSources, displayedMonth]);

  // Build a map of day -> subscriptions billing that day (for displayed month)
  const subscriptionMap = useMemo(() => {
    const map = new Map<number, Subscription[]>();
    const monthStart = startOfMonth(displayedMonth);
    const monthEnd = endOfMonth(displayedMonth);

    subscriptions
      .filter((sub) => sub.isActive)
      .forEach((sub) => {
        // Parse the next billing date
        let billingDate = new Date(sub.nextBillingDate);

        // Find billing dates that fall in the displayed month
        // We need to check multiple billing cycles to cover the displayed month
        const { value, unit } = sub.frequency;

        // Move forward until we're in or past the displayed month
        while (billingDate < monthStart) {
          switch (unit) {
            case 'days':
              billingDate = new Date(billingDate.getTime() + value * 24 * 60 * 60 * 1000);
              break;
            case 'weeks':
              billingDate = new Date(billingDate.getTime() + value * 7 * 24 * 60 * 60 * 1000);
              break;
            case 'months':
              billingDate = new Date(billingDate.setMonth(billingDate.getMonth() + value));
              break;
            case 'years':
              billingDate = new Date(billingDate.setFullYear(billingDate.getFullYear() + value));
              break;
          }
        }

        // Now check billing dates that fall within the displayed month
        while (billingDate <= monthEnd) {
          if (billingDate >= monthStart && billingDate <= monthEnd) {
            const day = billingDate.getDate();
            if (!map.has(day)) {
              map.set(day, []);
            }
            map.get(day)!.push(sub);
          }

          // Move to next billing date
          switch (unit) {
            case 'days':
              billingDate = new Date(billingDate.getTime() + value * 24 * 60 * 60 * 1000);
              break;
            case 'weeks':
              billingDate = new Date(billingDate.getTime() + value * 7 * 24 * 60 * 60 * 1000);
              break;
            case 'months':
              billingDate = new Date(billingDate.setMonth(billingDate.getMonth() + value));
              break;
            case 'years':
              billingDate = new Date(billingDate.setFullYear(billingDate.getFullYear() + value));
              break;
          }
        }
      });

    return map;
  }, [subscriptions, displayedMonth]);

  // Get calendar days for displayed month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(displayedMonth);
    const monthEnd = endOfMonth(displayedMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [displayedMonth]);

  // Get debts due on a specific day of month
  const getDebtsForDay = (date: Date): Debt[] => {
    if (!isSameMonth(date, displayedMonth)) return [];
    return dueDateMap.get(date.getDate()) || [];
  };

  // Get paydays for a specific day of month
  const getPaydaysForDay = (date: Date): IncomeSource[] => {
    if (!isSameMonth(date, displayedMonth)) return [];
    return paydayMap.get(date.getDate()) || [];
  };

  // Get pay cycle ends for a specific day of month
  const getCycleEndsForDay = (date: Date): IncomeSource[] => {
    if (!isSameMonth(date, displayedMonth)) return [];
    return cycleEndMap.get(date.getDate()) || [];
  };

  // Get subscriptions for a specific day of month
  const getSubscriptionsForDay = (date: Date): Subscription[] => {
    if (!isSameMonth(date, displayedMonth)) return [];
    return subscriptionMap.get(date.getDate()) || [];
  };

  // Get subscription category color
  const getSubscriptionColor = (sub: Subscription): string => {
    const catInfo = SUBSCRIPTION_CATEGORY_INFO[sub.category];
    return catInfo?.color || '#6b7280';
  };

  // Get category color for a debt
  const getCategoryColor = (debt: Debt): string => {
    // Check built-in categories
    if (debt.category in CATEGORY_INFO) {
      return CATEGORY_INFO[debt.category as keyof typeof CATEGORY_INFO].color;
    }
    // Check custom categories
    const customCat = customCategories.find((c) => c.id === debt.category);
    return customCat?.color || '#6b7280';
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Show calendar even if no debts, as long as there are income sources with paydays or cycle ends or subscriptions
  const hasPaydays = incomeSources.some((s) => s.nextPayDate);
  const hasCycleEnds = incomeSources.some((s) => s.payCycleEndDate);
  const hasSubscriptions = subscriptions.filter((s) => s.isActive).length > 0;

  if (debts.length === 0 && !hasPaydays && !hasCycleEnds && !hasSubscriptions) {
    return (
      <div className="card">
        <h3 className="text-sm text-gray-500 mb-3">BILL CALENDAR</h3>
        <div className="text-center py-6 text-gray-500 text-sm">
          Add debts or subscriptions to see your payment calendar
        </div>
      </div>
    );
  }

  return (
    <div className="card py-3 px-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs text-gray-500">BILL CALENDAR</h3>

        {/* Month navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} className="text-gray-500" />
          </button>

          <button
            onClick={goToCurrentMonth}
            className={`text-sm font-semibold px-2 py-0.5 rounded transition-colors ${
              isCurrentMonth
                ? 'text-gray-900'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
            title={isCurrentMonth ? undefined : 'Click to return to current month'}
          >
            {format(displayedMonth, 'MMM yyyy')}
          </button>

          <button
            onClick={goToNextMonth}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Calendar container - constrained width and centered */}
      <div className={isLarge ? 'w-full' : 'max-w-[280px] mx-auto'}>
        {/* Week day headers */}
        <div className={`grid grid-cols-7 ${isLarge ? 'gap-2' : 'gap-1'} mb-1`}>
          {weekDays.map((day) => (
            <div key={day} className={`text-center ${isLarge ? 'text-xs' : 'text-[10px]'} text-gray-400 font-medium`}>
              {isLarge ? day : day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={`grid grid-cols-7 ${isLarge ? 'gap-2' : 'gap-1'} justify-items-center`}>
        {calendarDays.map((date) => {
          const isInDisplayedMonth = isSameMonth(date, displayedMonth);
          const isToday = isSameDay(date, today);
          const debtsOnDay = getDebtsForDay(date);
          const paydaysOnDay = getPaydaysForDay(date);
          const cycleEndsOnDay = getCycleEndsForDay(date);
          const subsOnDay = getSubscriptionsForDay(date);
          const hasBills = debtsOnDay.length > 0;
          const hasPayday = paydaysOnDay.length > 0;
          const hasCycleEnd = cycleEndsOnDay.length > 0;
          const hasSubs = subsOnDay.length > 0;
          const isHovered = hoveredDay && isSameDay(date, hoveredDay);
          const hasContent = hasBills || hasPayday || hasCycleEnd || hasSubs;

          return (
            <div
              key={date.toISOString()}
              className={`relative ${isLarge ? 'w-full' : ''}`}
              onMouseEnter={() => hasContent && setHoveredDay(date)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Large calendar - show bills inline */}
              {isLarge ? (
                <div
                  className={`
                    w-full min-h-[70px] p-1 rounded-lg border transition-all duration-150
                    ${!isInDisplayedMonth ? 'bg-gray-50 border-gray-100' : 'border-gray-200'}
                    ${isToday ? 'ring-2 ring-primary-500 border-primary-300' : ''}
                    ${hasContent ? 'cursor-pointer hover:border-primary-300' : ''}
                  `}
                >
                  {/* Date number */}
                  <div className={`text-sm font-medium mb-1 ${!isInDisplayedMonth ? 'text-gray-300' : isToday ? 'text-primary-600' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  {/* Bills on this day */}
                  {isInDisplayedMonth && debtsOnDay.length > 0 && (
                    <div className="space-y-0.5">
                      {debtsOnDay.slice(0, 2).map((debt) => (
                        <div
                          key={debt.id}
                          className="text-[10px] px-1 py-0.5 rounded bg-primary-100 text-primary-700 truncate"
                        >
                          {debt.name}
                        </div>
                      ))}
                      {debtsOnDay.length > 2 && (
                        <div className="text-[9px] text-gray-400 px-1">
                          +{debtsOnDay.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                  {/* Payday indicator */}
                  {isInDisplayedMonth && hasPayday && (
                    <div className="text-[10px] px-1 py-0.5 rounded bg-green-100 text-green-700 truncate mt-0.5">
                      💰 Payday
                    </div>
                  )}
                  {/* Pay cycle end */}
                  {isInDisplayedMonth && hasCycleEnd && (
                    <div className="text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 truncate mt-0.5">
                      📅 Cycle ends
                    </div>
                  )}
                  {/* Subscriptions on this day */}
                  {isInDisplayedMonth && subsOnDay.length > 0 && (
                    <div className="space-y-0.5 mt-0.5">
                      {subsOnDay.slice(0, 2).map((sub) => (
                        <div
                          key={sub.id}
                          className="text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 truncate flex items-center gap-1"
                        >
                          <RefreshCw size={8} />
                          {sub.name}
                        </div>
                      ))}
                      {subsOnDay.length > 2 && (
                        <div className="text-[9px] text-gray-400 px-1">
                          +{subsOnDay.length - 2} more subs
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Small calendar - original compact view */
                <div
                  className={`
                    w-9 h-9 flex items-center justify-center text-sm rounded-md
                    transition-all duration-150
                    ${!isInDisplayedMonth ? 'text-gray-300' : ''}
                    ${isInDisplayedMonth && !hasBills && !hasSubs && !hasPayday && !hasCycleEnd && !isToday ? 'text-gray-600' : ''}
                    ${isToday && !hasBills && !hasSubs ? 'ring-1 ring-primary-500 text-gray-900 font-semibold' : ''}
                    ${(hasBills || hasSubs) && !isToday ? 'bg-primary-500 text-white font-semibold' : ''}
                    ${(hasBills || hasSubs) && isToday ? 'bg-primary-600 text-white font-bold ring-1 ring-primary-300' : ''}
                    ${hasContent ? 'cursor-pointer hover:opacity-90' : ''}
                  `}
                >
                  {date.getDate()}
                  {/* Bill + Sub count badge */}
                  {(debtsOnDay.length + subsOnDay.length) > 1 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                      {debtsOnDay.length + subsOnDay.length}
                    </span>
                  )}
                  {/* Subscription indicator - top left (only if has subs but no bills) */}
                  {hasSubs && !hasBills && (
                    <span className="absolute -top-0.5 -left-0.5 bg-purple-500 text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                      ↻
                    </span>
                  )}
                  {/* Pay cycle end indicator - left side */}
                  {hasCycleEnd && (
                    <span className="absolute -bottom-0.5 -left-0.5 bg-blue-500 text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                      |
                    </span>
                  )}
                  {/* Payday indicator - right side */}
                  {hasPayday && (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                      $
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip */}
              {isHovered && hasContent && (
                <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-[10px] rounded-md px-2 py-1.5 whitespace-nowrap shadow-lg">
                  {/* Bills section */}
                  {hasBills && (
                    <>
                      <div className="font-semibold mb-0.5">
                        Bills due {format(date, 'do')}:
                      </div>
                      {debtsOnDay.map((debt) => (
                        <div key={debt.id} className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCategoryColor(debt) }}
                          />
                          <span>{debt.name}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Paydays section */}
                  {hasPayday && (
                    <>
                      {hasBills && <div className="border-t border-gray-700 my-1" />}
                      <div className="font-semibold mb-0.5 text-green-400">
                        Payday:
                      </div>
                      {paydaysOnDay.map((source) => (
                        <div key={source.id} className="flex items-center gap-1.5">
                          <span className="text-green-400">$</span>
                          <span>{source.name}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Pay cycle ends section */}
                  {hasCycleEnd && (
                    <>
                      {(hasBills || hasPayday) && <div className="border-t border-gray-700 my-1" />}
                      <div className="font-semibold mb-0.5 text-blue-400">
                        Pay cycle ends:
                      </div>
                      {cycleEndsOnDay.map((source) => (
                        <div key={source.id} className="flex items-center gap-1.5">
                          <span className="text-blue-400">|</span>
                          <span>{source.name}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Subscriptions section */}
                  {hasSubs && (
                    <>
                      {(hasBills || hasPayday || hasCycleEnd) && <div className="border-t border-gray-700 my-1" />}
                      <div className="font-semibold mb-0.5 text-purple-400">
                        Subscriptions:
                      </div>
                      {subsOnDay.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getSubscriptionColor(sub) }}
                          />
                          <span>{sub.name}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-primary-500" />
          <span>Bill due</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded ring-1 ring-primary-500" />
          <span>Today</span>
        </div>
        {hasPaydays && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500 text-white text-[8px] flex items-center justify-center font-bold">$</div>
            <span>Payday</span>
          </div>
        )}
        {hasCycleEnds && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center font-bold">|</div>
            <span>Cycle ends</span>
          </div>
        )}
        {hasSubscriptions && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500 text-white text-[8px] flex items-center justify-center font-bold">↻</div>
            <span>Subscription</span>
          </div>
        )}
      </div>
    </div>
  );
}
