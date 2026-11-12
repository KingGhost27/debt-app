/**
 * Mini Calendar Component
 *
 * Visual monthly calendar showing bill due dates, paydays, pay-cycle ends and
 * subscription renewals. Bills read as pink-red, paydays as green, cycle ends
 * as ink and subscriptions as amber, each with its own icon so color is never
 * the only cue. Supports navigation to previous/future months. Styled in
 * pages/track.css (.cal-*) from the ranch tokens; no card of its own, so it
 * sits inside a ranch card on Track and on the dashboard.
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
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Repeat, Wallet } from 'lucide-react';
import { Plank } from '../dashboard/RanchPanels';
import type { Debt, IncomeSource, Subscription } from '../../types';
import { CATEGORY_INFO, SUBSCRIPTION_CATEGORY_INFO } from '../../types';
import { getPaydaysInMonth, getPayCycleEndsInMonth } from '../../lib/calculations';
import '../../pages/track.css';

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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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
      <div className={`cal${isLarge ? '' : ' is-small rui-card'}`}>
        <p className="cal-empty">Add debts or subscriptions to see your payment calendar</p>
      </div>
    );
  }

  return (
    <div className={`cal ${isLarge ? 'is-large' : 'is-small rui-card'}`}>
      <div className="cal-head">
        {isLarge ? (
          <h3 className="cal-title">Bill calendar</h3>
        ) : (
          <Plank icon={<CalendarDays size={18} aria-hidden="true" />}>Bill Calendar</Plank>
        )}

        {/* Month navigation */}
        <div className="cal-nav">
          <button type="button" onClick={goToPreviousMonth} className="cal-nav-btn" aria-label="Previous month">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToCurrentMonth}
            className={`cal-month${isCurrentMonth ? '' : ' is-away'}`}
            title={isCurrentMonth ? undefined : 'Click to return to current month'}
          >
            {format(displayedMonth, 'MMM yyyy')}
          </button>
          <button type="button" onClick={goToNextMonth} className="cal-nav-btn" aria-label="Next month">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="cal-wrap">
        {/* Week day headers */}
        <div className="cal-dow" aria-hidden="true">
          {weekDays.map((day) => (
            <span key={day}>{isLarge ? day : day.charAt(0)}</span>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="cal-grid">
          {calendarDays.map((date, dayIndex) => {
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
            const isSelected = !!selectedDay && isSameDay(selectedDay, date);
            const hasContent = hasBills || hasPayday || hasCycleEnd || hasSubs;

            // Tooltip edge-aware positioning
            const col = dayIndex % 7;
            const isFirstRow = Math.floor(dayIndex / 7) === 0;
            const tipV = isFirstRow ? 'is-below' : 'is-above';
            const tipH = col === 6 ? 'is-end' : col === 0 ? 'is-start' : 'is-mid';
            const summary = [
              hasBills && `${debtsOnDay.length} bill${debtsOnDay.length > 1 ? 's' : ''} due`,
              hasPayday && 'payday',
              hasCycleEnd && 'pay cycle ends',
              hasSubs && `${subsOnDay.length} subscription${subsOnDay.length > 1 ? 's' : ''}`,
            ].filter(Boolean).join(', ');
            const label = `${format(date, 'MMMM d')}${summary ? `: ${summary}` : ''}`;

            const cellClass = [
              'cal-cell',
              !isInDisplayedMonth && 'is-out',
              isToday && 'is-today',
              isSelected && 'is-selected',
              hasContent && isInDisplayedMonth && 'has-content',
              isInDisplayedMonth && (hasBills || hasSubs) && 'has-bill',
            ].filter(Boolean).join(' ');

            const body = isLarge ? (
              <>
                <span className="cal-num num">{date.getDate()}</span>

                {/* Phones: one dot per kind of event */}
                {isInDisplayedMonth && hasContent && (
                  <span className="cal-dots" aria-hidden="true">
                    {hasBills && <i className="k-bill" />}
                    {hasPayday && <i className="k-pay" />}
                    {hasCycleEnd && <i className="k-cycle" />}
                    {hasSubs && <i className="k-sub" />}
                  </span>
                )}

                {/* Wider screens: named pills */}
                {isInDisplayedMonth && hasContent && (
                  <span className="cal-pills" aria-hidden="true">
                    {debtsOnDay.slice(0, 2).map((debt) => (
                      <span key={debt.id} className="cal-pill k-bill"><CreditCard size={12} />{debt.name}</span>
                    ))}
                    {debtsOnDay.length > 2 && <span className="cal-more">+{debtsOnDay.length - 2} more</span>}
                    {hasPayday && <span className="cal-pill k-pay"><Wallet size={12} />Payday</span>}
                    {hasCycleEnd && <span className="cal-pill k-cycle"><CalendarClock size={12} />Cycle ends</span>}
                    {subsOnDay.slice(0, 2).map((sub) => (
                      <span key={sub.id} className="cal-pill k-sub"><Repeat size={12} />{sub.name}</span>
                    ))}
                    {subsOnDay.length > 2 && <span className="cal-more">+{subsOnDay.length - 2} more</span>}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="num">{date.getDate()}</span>
                {isInDisplayedMonth && debtsOnDay.length + subsOnDay.length > 1 && (
                  <span className="cal-count num">{debtsOnDay.length + subsOnDay.length}</span>
                )}
                {isInDisplayedMonth && hasSubs && !hasBills && <span className="cal-mark m-sub"><Repeat size={9} aria-hidden="true" /></span>}
                {isInDisplayedMonth && hasCycleEnd && <span className="cal-mark m-cycle"><CalendarClock size={9} aria-hidden="true" /></span>}
                {isInDisplayedMonth && hasPayday && <span className="cal-mark m-pay"><Wallet size={9} aria-hidden="true" /></span>}
              </>
            );

            return (
              <div
                key={date.toISOString()}
                className="cal-slot"
                onMouseEnter={() => hasContent && setHoveredDay(date)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {hasContent && isInDisplayedMonth ? (
                  <button
                    type="button"
                    className={cellClass}
                    aria-label={label}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDay(isSelected ? null : date)}
                    onFocus={() => setHoveredDay(date)}
                    onBlur={() => setHoveredDay(null)}
                  >
                    {body}
                  </button>
                ) : (
                  <div className={cellClass} aria-label={isToday ? `Today, ${label}` : undefined}>{body}</div>
                )}

                {/* Tooltip */}
                {isHovered && hasContent && isInDisplayedMonth && (
                  <div className={`cal-tip ${tipV} ${tipH}`} role="presentation">
                    {hasBills && (
                      <>
                        <b>Bills due {format(date, 'do')}</b>
                        {debtsOnDay.map((debt) => (
                          <span key={debt.id} className="cal-tip-row">
                            <i style={{ background: getCategoryColor(debt) }} />
                            {debt.name}
                          </span>
                        ))}
                      </>
                    )}
                    {hasPayday && (
                      <>
                        <b>Payday</b>
                        {paydaysOnDay.map((source) => (
                          <span key={source.id} className="cal-tip-row"><Wallet size={12} />{source.name}</span>
                        ))}
                      </>
                    )}
                    {hasCycleEnd && (
                      <>
                        <b>Pay cycle ends</b>
                        {cycleEndsOnDay.map((source) => (
                          <span key={source.id} className="cal-tip-row"><CalendarClock size={12} />{source.name}</span>
                        ))}
                      </>
                    )}
                    {hasSubs && (
                      <>
                        <b>Subscriptions</b>
                        {subsOnDay.map((sub) => (
                          <span key={sub.id} className="cal-tip-row">
                            <i style={{ background: getSubscriptionColor(sub) }} />
                            {sub.name}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tap-to-see details panel (phones; wider screens show names in the cells) */}
      {isLarge && selectedDay && (
        <div className="cal-detail">
          <p className="cal-detail-h">{format(selectedDay, 'MMMM d, yyyy')}</p>
          {getDebtsForDay(selectedDay).map((debt) => (
            <div key={debt.id} className="cal-detail-row k-bill">
              <CreditCard size={15} aria-hidden="true" />
              <span>{debt.name}</span>
              <em>Bill due</em>
            </div>
          ))}
          {getPaydaysForDay(selectedDay).map((source) => (
            <div key={source.id} className="cal-detail-row k-pay">
              <Wallet size={15} aria-hidden="true" />
              <span>{source.name}</span>
              <em>Payday</em>
            </div>
          ))}
          {getCycleEndsForDay(selectedDay).map((source) => (
            <div key={source.id} className="cal-detail-row k-cycle">
              <CalendarClock size={15} aria-hidden="true" />
              <span>{source.name}</span>
              <em>Cycle ends</em>
            </div>
          ))}
          {getSubscriptionsForDay(selectedDay).map((sub) => (
            <div key={sub.id} className="cal-detail-row k-sub">
              <Repeat size={15} aria-hidden="true" />
              <span>{sub.name}</span>
              <em>Subscription</em>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <ul className="cal-legend">
        <li className="k-bill"><i /><span>Bill due</span></li>
        <li className="k-today"><i /><span>Today</span></li>
        {hasPaydays && <li className="k-pay"><i /><span>Payday</span></li>}
        {hasCycleEnds && <li className="k-cycle"><i /><span>Cycle ends</span></li>}
        {hasSubscriptions && <li className="k-sub"><i /><span>Subscription</span></li>}
      </ul>
    </div>
  );
}
