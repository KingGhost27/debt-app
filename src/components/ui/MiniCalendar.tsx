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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Debt, IncomeSource } from '../../types';
import { CATEGORY_INFO } from '../../types';
import { getPaydaysInMonth, getPayCycleEndsInMonth } from '../../lib/calculations';

interface MiniCalendarProps {
  debts: Debt[];
  incomeSources?: IncomeSource[];
  customCategories?: { id: string; name: string; color: string }[];
}

export function MiniCalendar({ debts, incomeSources = [], customCategories = [] }: MiniCalendarProps) {
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

  // Show calendar even if no debts, as long as there are income sources with paydays or cycle ends
  const hasPaydays = incomeSources.some((s) => s.nextPayDate);
  const hasCycleEnds = incomeSources.some((s) => s.payCycleEndDate);

  if (debts.length === 0 && !hasPaydays && !hasCycleEnds) {
    return (
      <div className="card">
        <h3 className="text-sm text-gray-500 mb-3">BILL CALENDAR</h3>
        <div className="text-center py-6 text-gray-500 text-sm">
          Add debts to see your payment calendar
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
      <div className="max-w-[280px] mx-auto">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-[10px] text-gray-400 font-medium">
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 justify-items-center">
        {calendarDays.map((date) => {
          const isInDisplayedMonth = isSameMonth(date, displayedMonth);
          const isToday = isSameDay(date, today);
          const debtsOnDay = getDebtsForDay(date);
          const paydaysOnDay = getPaydaysForDay(date);
          const cycleEndsOnDay = getCycleEndsForDay(date);
          const hasBills = debtsOnDay.length > 0;
          const hasPayday = paydaysOnDay.length > 0;
          const hasCycleEnd = cycleEndsOnDay.length > 0;
          const isHovered = hoveredDay && isSameDay(date, hoveredDay);
          const hasContent = hasBills || hasPayday || hasCycleEnd;

          return (
            <div
              key={date.toISOString()}
              className="relative"
              onMouseEnter={() => hasContent && setHoveredDay(date)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={`
                  w-9 h-9 flex items-center justify-center text-sm rounded-md
                  transition-all duration-150
                  ${!isInDisplayedMonth ? 'text-gray-300' : ''}
                  ${isInDisplayedMonth && !hasBills && !hasPayday && !hasCycleEnd && !isToday ? 'text-gray-600' : ''}
                  ${isToday && !hasBills ? 'ring-1 ring-primary-500 text-gray-900 font-semibold' : ''}
                  ${hasBills && !isToday ? 'bg-primary-500 text-white font-semibold' : ''}
                  ${hasBills && isToday ? 'bg-primary-600 text-white font-bold ring-1 ring-primary-300' : ''}
                  ${hasContent ? 'cursor-pointer hover:opacity-90' : ''}
                `}
              >
                {date.getDate()}
                {/* Bill count badge */}
                {debtsOnDay.length > 1 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                    {debtsOnDay.length}
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
      </div>
    </div>
  );
}
