/**
 * DotGraphCard - the "Recurring costs" card: an animated figure over a
 * dot-matrix bar chart of what your subscriptions bill, with day and month
 * views.
 *
 * Adapted from the 21st.dev component "Dot Graph Card"
 * (21st id 44867, demo "Default", by aloksivastava1025, Cue Foundations cue174):
 * https://21st.dev/community/components/aloksivastava1025/dot-graph-card/default
 *
 * Kept from the original: a counter that eases to its value (easeOutQuart,
 * 1.2s), columns of round dots that pop in on a diagonal stagger, a lighter
 * set for the past and a darker set for what is still to come, hover that
 * dims the other columns and scales the active one, a tooltip, and the tab
 * switch. Changed for Cowculator: it is React-driven instead of DOM-built;
 * the data is the user's subscriptions (one dot is a fixed dollar amount, so
 * a column's height is what bills that day or month); Tailwind/inline styles
 * became ranch classes (.dgc-*, styled in pages/subscriptions.css from the
 * --ranch-* tokens); columns are keyboard operable (roving arrow keys, Home
 * and End, tooltip on focus). Under prefers-reduced-motion the dots and the
 * counter appear at once. No new dependencies.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  addDays, addMonths, addWeeks, addYears, endOfMonth, format, parseISO, startOfDay, startOfMonth,
} from 'date-fns';
import { Repeat } from 'lucide-react';
import { Plank } from '../dashboard/RanchPanels';
import type { Subscription, SubscriptionFrequency } from '../../types';
import '../../pages/subscriptions.css';
import { formatCurrency } from '../../lib/calculations';

type Tab = 'days' | 'months';
type Column = { key: string; label: string; short: string; amount: number; past: boolean; today: boolean };

const TABS: { id: Tab; label: string }[] = [
  { id: 'days', label: 'This month' },
  { id: 'months', label: 'Next 12 months' },
];
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
const MAX_DOTS = 9;

const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function step(date: Date, f: SubscriptionFrequency, dir: 1 | -1): Date {
  const n = f.value * dir;
  switch (f.unit) {
    case 'days': return addDays(date, n);
    case 'weeks': return addWeeks(date, n);
    case 'months': return addMonths(date, n);
    default: return addYears(date, n);
  }
}

/** Every billing date of a subscription inside [start, end], stepping both ways from its next billing date. */
function billingDates(sub: Subscription, start: Date, end: Date): Date[] {
  let d = startOfDay(parseISO(sub.nextBillingDate));
  let guard = 0;
  while (d >= start && guard++ < 1500) d = step(d, sub.frequency, -1);
  const out: Date[] = [];
  while (guard++ < 3000) {
    d = step(d, sub.frequency, 1);
    if (d > end) break;
    if (d >= start) out.push(d);
  }
  return out;
}

function buildColumns(subs: Subscription[], tab: Tab, today: Date): Column[] {
  const active = subs.filter((s) => s.isActive);
  if (tab === 'days') {
    const first = startOfMonth(today);
    const last = endOfMonth(today);
    const count = last.getDate();
    const totals = new Array<number>(count).fill(0);
    for (const sub of active) for (const d of billingDates(sub, first, last)) totals[d.getDate() - 1] += sub.amount;
    return totals.map((amount, i) => {
      const date = addDays(first, i);
      return {
        key: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE MMM d'), short: String(i + 1), amount,
        past: date < today, today: date.getTime() === today.getTime(),
      };
    });
  }
  const cols: Column[] = [];
  for (let m = 0; m < 12; m++) {
    const first = startOfMonth(addMonths(today, m));
    const last = endOfMonth(first);
    let amount = 0;
    for (const sub of active) amount += billingDates(sub, first, last).length * sub.amount;
    cols.push({ key: format(first, 'yyyy-MM'), label: format(first, 'MMMM yyyy'), short: format(first, 'MMM'), amount, past: false, today: m === 0 });
  }
  return cols;
}

function niceUnit(max: number) {
  const raw = max / MAX_DOTS;
  return STEPS.find((s) => s >= raw) ?? Math.ceil(raw / 1000) * 1000;
}

function useCounter(target: number) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  const reduced = prefersReduced();
  useEffect(() => {
    if (reduced) {
      from.current = target;
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 1200, 1);
      const v = start + (target - start) * easeOutQuart(p);
      from.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);
  return reduced ? target : value;
}

interface DotGraphCardProps {
  subscriptions: Subscription[];
  /** Monthly cost of the active subscriptions (the page already computes it). */
  monthlyTotal: number;
  title?: string;
  /** Extra rows under the graph (annual figure, active and paused counts). */
  footer?: ReactNode;
}

export function DotGraphCard({ subscriptions, monthlyTotal, title = 'Recurring costs', footer }: DotGraphCardProps) {
  const [tab, setTab] = useState<Tab>('days');
  const [active, setActive] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState(() => Math.max(0, new Date().getDate() - 1));
  const colRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const counter = useCounter(monthlyTotal);

  const today = useMemo(() => startOfDay(new Date()), []);
  const columns = useMemo(() => buildColumns(subscriptions, tab, today), [subscriptions, tab, today]);
  const max = Math.max(0, ...columns.map((c) => c.amount));
  const unit = niceUnit(max || 1);
  const rows = Math.max(1, ...columns.map((c) => Math.ceil(c.amount / unit)));
  const billed = columns.filter((c) => c.past).reduce((s, c) => s + c.amount, 0);
  const ahead = columns.filter((c) => !c.past).reduce((s, c) => s + c.amount, 0);

  const selectTab = (next: Tab) => {
    setTab(next);
    setActive(null);
    setFocusIdx(next === 'days' ? Math.max(0, today.getDate() - 1) : 0);
  };

  const moveFocus = (next: number) => {
    const i = Math.max(0, Math.min(columns.length - 1, next));
    setFocusIdx(i);
    setActive(i);
    colRefs.current[i]?.focus();
  };

  const tabKeys = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % TABS.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + TABS.length - 1) % TABS.length;
    if (n < 0) return;
    e.preventDefault();
    selectTab(TABS[n]!.id);
    (e.currentTarget.querySelector(`[data-tab="${TABS[n]!.id}"]`) as HTMLButtonElement | null)?.focus();
  };

  const activeCol = active === null ? null : columns[active];
  const leftPct = active === null ? 0 : ((active + 0.5) / columns.length) * 100;
  const tipShift = leftPct < 14 ? '0%' : leftPct > 86 ? '-100%' : '-50%';

  return (
    <section className="rui-card dgc" aria-label={title}>
      <header className="dgc-head">
        <div>
          <h2 className="dgc-title"><Plank icon={<Repeat size={18} aria-hidden="true" />}>{title}</Plank></h2>
          <p className="dgc-fig num" aria-label={`${formatCurrency(monthlyTotal)} a month`}>
            <span aria-hidden="true">{formatCurrency(counter)}</span>
            <small aria-hidden="true">a month</small>
          </p>
        </div>
        <div role="tablist" aria-label="Chart range" className="dgc-tabs" onKeyDown={tabKeys}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              data-tab={t.id}
              aria-selected={tab === t.id}
              tabIndex={tab === t.id ? 0 : -1}
              className={tab === t.id ? 'is-on' : ''}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="dgc-body">
        <div className="dgc-tipwrap">
          {activeCol && (
            <div className="dgc-tip" style={{ left: `${leftPct}%`, transform: `translateX(${tipShift})` }} role="status">
              {activeCol.label} <b className="num">{activeCol.amount > 0 ? formatCurrency(activeCol.amount) : 'Nothing bills'}</b>
            </div>
          )}
        </div>
        <div
          key={tab}
          className={`dgc-graph${active !== null ? ' has-active' : ''}`}
          role="group"
          aria-label={tab === 'days' ? 'Billing by day this month' : 'Billing by month'}
          style={{ '--dgc-rows': rows } as React.CSSProperties}
          onMouseLeave={() => setActive(null)}
        >
          {columns.map((c, i) => {
            const dots = c.amount > 0 ? Math.ceil(c.amount / unit) : 0;
            return (
              <button
                key={c.key}
                ref={(el) => { colRefs.current[i] = el; }}
                type="button"
                tabIndex={i === focusIdx ? 0 : -1}
                className={`dgc-col${active === i ? ' is-active' : ''}${c.today ? ' is-today' : ''}`}
                aria-label={`${c.label}: ${c.amount > 0 ? formatCurrency(c.amount) : 'nothing bills'}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => { setFocusIdx(i); setActive(i); }}
                onBlur={() => setActive(null)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(i + 1); }
                  else if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(i - 1); }
                  else if (e.key === 'Home') { e.preventDefault(); moveFocus(0); }
                  else if (e.key === 'End') { e.preventDefault(); moveFocus(columns.length - 1); }
                  else if (e.key === 'Escape') setActive(null);
                }}
              >
                {dots === 0 && <i className="dgc-dot is-empty" style={{ animationDelay: `${i * 0.02}s` }} />}
                {Array.from({ length: dots }, (_, d) => (
                  <i key={d} className={`dgc-dot ${c.past ? 'is-past' : 'is-next'}`} style={{ animationDelay: `${i * 0.02 + d * 0.04}s` }} />
                ))}
              </button>
            );
          })}
        </div>
        <div className="dgc-axis" aria-hidden="true">
          {tab === 'days' ? (
            <>
              <span>1</span>
              <span>{format(today, 'MMM')}</span>
              <span>{columns.length}</span>
            </>
          ) : (
            <>
              <span>{columns[0]?.short}</span>
              <span>{columns[columns.length - 1]?.short}</span>
            </>
          )}
        </div>
      </div>

      <div className="dgc-sum">
        {tab === 'days' && (
          <>
            <span><i className="dgc-key is-past" />Billed so far <b className="num">{formatCurrency(billed)}</b></span>
            <span><i className="dgc-key is-next" />Still to come <b className="num">{formatCurrency(ahead)}</b></span>
          </>
        )}
        {tab === 'months' && (
          <span><i className="dgc-key is-next" />Billed over the next year <b className="num">{formatCurrency(ahead)}</b></span>
        )}
        <span className="dgc-unit">One dot is {formatCurrency(unit)}</span>
      </div>
      {footer}
    </section>
  );
}
