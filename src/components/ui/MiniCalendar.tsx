/**
 * Mini Calendar Component
 *
 * Visual monthly calendar showing bill due dates and paydays.
 * Highlights days with bills (pink) and paydays (green $).
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
} from 'date-fns';
import type { Debt, IncomeSource } from '../../types';
import { CATEGORY_INFO } from '../../types';
import { getPaydaysInMonth } from '../../lib/calculations';

interface MiniCalendarProps {
  debts: Debt[];
  incomeSources?: IncomeSource[];
  customCategories?: { id: string; name: string; color: string }[];
}

export function MiniCalendar({ debts, incomeSources = [], customCategories = [] }: MiniCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  // Build a map of day -> income sources with paydays that day
  const paydayMap = useMemo(() => {
    const map = new Map<number, IncomeSource[]>();
    incomeSources.forEach((source) => {
      const paydays = getPaydaysInMonth(source, today);
      paydays.forEach((payday) => {
        const day = payday.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)!.push(source);
      });
    });
    return map;
  }, [incomeSources, today]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [today]);

  // Get debts due on a specific day of month
  const getDebtsForDay = (date: Date): Debt[] => {
    if (!isSameMonth(date, today)) return [];
    return dueDateMap.get(date.getDate()) || [];
  };

  // Get paydays for a specific day of month
  const getPaydaysForDay = (date: Date): IncomeSource[] => {
    if (!isSameMonth(date, today)) return [];
    return paydayMap.get(date.getDate()) || [];
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

  // Show calendar even if no debts, as long as there are income sources with paydays
  const hasPaydays = incomeSources.some((s) => s.nextPayDate);

  if (debts.length === 0 && !hasPaydays) {
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
        <p className="text-sm font-semibold text-gray-900">
          {format(today, 'MMM yyyy')}
        </p>
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
          const isCurrentMonth = isSameMonth(date, today);
          const isToday = isSameDay(date, today);
          const debtsOnDay = getDebtsForDay(date);
          const paydaysOnDay = getPaydaysForDay(date);
          const hasBills = debtsOnDay.length > 0;
          const hasPayday = paydaysOnDay.length > 0;
          const isHovered = hoveredDay && isSameDay(date, hoveredDay);
          const hasContent = hasBills || hasPayday;

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
                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                  ${isCurrentMonth && !hasBills && !hasPayday && !isToday ? 'text-gray-600' : ''}
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
                {/* Payday indicator */}
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
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-center gap-3 text-[10px] text-gray-500">
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
      </div>
    </div>
  );
}
