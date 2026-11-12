/**
 * ActivityHeatmap - a year of days as squares that fly into weekday rows and
 * month columns.
 *
 * Adapted from the 21st.dev component "Activity Heatmap Calendar"
 * (21st id 36571, demo "Default", by dhxwhy):
 * https://21st.dev/community/components/dhxwhy/activity-heatmap/default
 *
 * Kept from the original: the three views (calendar, weekdays, months) with the
 * same square-rearranging layout math, the stats (total, months with a payment,
 * biggest month), tooltips, arrow-key navigation across squares,
 * a radio-group view switch with Home/End, and the "fit the whole year to any
 * width" rule. Changed for Cowculator: Tailwind/shadcn classes became ranch
 * classes (.ahm-*, styled in pages/track.css from the --ranch-* tokens), the
 * auto-cycling showcase mode was dropped, and the shadcn color resolver was
 * replaced by a plain CSS color prop. No new dependencies. Under
 * prefers-reduced-motion the squares jump to their place with no transition.
 */

import * as React from 'react';
import { BarChart3, CalendarDays, Rows3 } from 'lucide-react';

export interface ActivityDatum {
  /** Local calendar date, YYYY-MM-DD. Duplicate dates use the last value. */
  date: string;
  value: number;
}

export type ActivityHeatmapView = 'calendar' | 'weekdays' | 'months';

interface ActivityHeatmapProps {
  data: ActivityDatum[];
  /** Number of calendar days ending at endDate. */
  days?: number;
  endDate?: string | Date;
  /** Maximum square edge in px (at least 6). */
  cellSize?: number;
  /** CSS color for the squares. Defaults to the ranch "paid" green. */
  color?: string;
  formatValue?: (value: number) => string;
  /** Singular noun for a day with activity, used in the insight line. */
  activeNoun?: string;
  /** Labels for the four stat tiles. */
  labels?: { total: string; months: string; best: string };
  className?: string;
}

type Cell = { date: string; value: number; day: number; week: number; month: string; label: string };
type Month = { key: string; label: string; cells: Cell[]; firstWeek: number };
type Tip = { cell: Cell; left: number; top: number; right: number; bottom: number };

const VIEWS: ActivityHeatmapView[] = ['calendar', 'weekdays', 'months'];
const VIEW_NAMES: Record<ActivityHeatmapView, string> = { calendar: 'Calendar', weekdays: 'Weekdays', months: 'Months' };
const VIEW_ICONS = { calendar: CalendarDays, weekdays: Rows3, months: BarChart3 } as const;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LEVEL_MIX = [0, 28, 48, 72, 100];
const PLOT_HEIGHT = 256;
const LEFT = 58;
const BASELINE = 230;
const DATE_LABEL = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const END_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const MONTH_LABEL = new Intl.DateTimeFormat('en-US', { month: 'short' });
const DEFAULT_LABELS = { total: 'Total', months: 'Months with activity', best: 'Biggest month' };

function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fromKey(key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year = 0, month = 0, day = 0] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return toKey(date) === key ? date : null;
}

function compact(value: number) {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

function buildDays(data: ActivityDatum[], days: number, endKey: string | null) {
  const end = endKey ? fromKey(endKey) : null;
  if (!end) return [] as Cell[];
  const count = Number.isFinite(days) ? Math.max(1, Math.floor(days)) : 365;
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - count + 1);
  const offset = start.getDay();
  const byDate = new Map(data.map((entry) => [entry.date, Number.isFinite(entry.value) ? Math.max(0, entry.value) : 0] as const));
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const key = toKey(date);
    return { date: key, value: byDate.get(key) ?? 0, day: date.getDay(), week: Math.floor((index + offset) / 7), month: key.slice(0, 7), label: DATE_LABEL.format(date) };
  });
}

function strongestFirst(a: Cell, b: Cell) {
  return b.value - a.value || a.date.localeCompare(b.date);
}

function arrange(cells: Cell[], width: number, maxCell: number) {
  const usable = Math.max(7, width - LEFT - 8);
  const totalWeeks = (cells.at(-1)?.week ?? 0) + 1;
  const capacity = Math.max(1, Math.floor((usable + 1) / 7));
  const firstWeek = Math.max(0, totalWeeks - capacity);
  const shown = cells.filter((cell) => cell.week >= firstWeek);
  const weeks = Math.max(1, totalWeeks - firstWeek);
  const weekdays = Array.from({ length: 7 }, () => [] as Cell[]);
  const months: Month[] = [];
  for (const cell of shown) {
    let month = months.find((entry) => entry.key === cell.month);
    if (!month) {
      month = { key: cell.month, label: MONTH_LABEL.format(fromKey(cell.date)!), cells: [], firstWeek: cell.week };
      months.push(month);
    }
    if (cell.value > 0) {
      weekdays[cell.day]!.push(cell);
      month.cells.push(cell);
    }
  }
  weekdays.forEach((group) => group.sort(strongestFirst));
  months.forEach((month) => month.cells.sort(strongestFirst));
  const weekdayRanks = new Map(weekdays.flatMap((group) => group.map((cell, rank) => [cell.date, rank] as const)));
  const monthRanks = new Map(months.flatMap((month, column) => month.cells.map((cell, rank) => [cell.date, { rank, column }] as const)));
  const maxMonth = Math.max(1, ...months.map((month) => month.cells.length));
  const maxWeekday = Math.max(1, ...weekdays.map((group) => group.length));
  const edge = Math.max(6, Math.min(maxCell, 16, usable / weeks - 1, (BASELINE - 24) / maxMonth - 0.5));
  const weekdayStep = Math.min(edge + 2, (usable - edge) / Math.max(1, maxWeekday - 1));
  const monthStep = Math.min(edge + 1, (BASELINE - 24) / maxMonth);
  const calendarStep = usable / weeks;
  const monthColumn = usable / Math.max(1, months.length);
  let total = 0;
  let active = 0;
  for (const cell of shown) {
    total += cell.value;
    if (cell.value > 0) active += 1;
  }
  const monthTotals = months.map((month) => month.cells.reduce((sum, cell) => sum + cell.value, 0));
  const activeMonths = months.filter((month) => month.cells.length > 0).length;
  const biggestMonth = Math.max(0, ...monthTotals);
  const bestWeekday = weekdays.findIndex((group) => group.length === maxWeekday);
  const bestMonth = months.findIndex((month) => month.cells.length === maxMonth);
  return { shown, weeks, firstWeek, weekdays, months, weekdayRanks, monthRanks, edge, weekdayStep, monthStep, calendarStep, monthColumn, total, active, activeMonths, biggestMonth, bestWeekday, bestMonth };
}

const EMPTY_LAYOUT = arrange([], 660, 10);
type Layout = typeof EMPTY_LAYOUT;

function position(cell: Cell, view: ActivityHeatmapView, layout: Layout) {
  const calendar = { x: LEFT + (cell.week - layout.firstWeek) * layout.calendarStep, y: 52 + cell.day * 24 };
  if (view === 'calendar' || cell.value <= 0) return calendar;
  if (view === 'weekdays') return { x: LEFT + (layout.weekdayRanks.get(cell.date) ?? 0) * layout.weekdayStep, y: calendar.y };
  const at = layout.monthRanks.get(cell.date)!;
  return { x: LEFT + (at.column + 0.5) * layout.monthColumn - layout.edge / 2, y: BASELINE - layout.edge - at.rank * layout.monthStep };
}

export function ActivityHeatmap({
  data,
  days = 365,
  endDate,
  cellSize = 12,
  color = 'var(--ranch-ok-fill)',
  formatValue = compact,
  activeNoun = 'active days',
  labels = DEFAULT_LABELS,
  className = '',
}: ActivityHeatmapProps) {
  const [today] = React.useState<string | null>(() => toKey(new Date()));
  const [view, setView] = React.useState<ActivityHeatmapView>('calendar');
  const [width, setWidth] = React.useState(0);
  const [reduced, setReduced] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [focusedDate, setFocusedDate] = React.useState('');
  const [tooltip, setTooltip] = React.useState<Tip | null>(null);
  const host = React.useRef<HTMLDivElement | null>(null);
  const tipRef = React.useRef<HTMLDivElement | null>(null);
  const plotRef = React.useRef<HTMLDivElement | null>(null);
  const descriptionId = React.useId();
  const tooltipId = React.useId();

  const endKey = endDate instanceof Date ? (Number.isNaN(endDate.getTime()) ? null : toKey(endDate)) : endDate ?? today;
  const cells = React.useMemo(() => buildDays(data, days, endKey), [data, days, endKey]);
  const maxCell = Number.isFinite(cellSize) ? Math.max(6, cellSize) : 12;
  const layout = React.useMemo(() => (cells.length ? arrange(cells, width || 660, maxCell) : EMPTY_LAYOUT), [cells, width, maxCell]);
  const ready = width > 0 && !!endKey;
  const truncated = layout.shown.length < cells.length;
  const visibleCells = view === 'calendar' ? layout.shown : layout.shown.filter((cell) => cell.value > 0);
  const tabDate = visibleCells.some((cell) => cell.date === focusedDate) ? focusedDate : visibleCells[0]?.date;
  const maxValue = Math.max(1, ...layout.shown.map((cell) => cell.value));
  const bestDay = layout.weekdays[layout.bestWeekday];
  const bestMonth = layout.months[layout.bestMonth];
  const levelOf = (value: number) => (value <= 0 ? 0 : Math.min(4, Math.ceil((value / maxValue) * 4)));
  const levelColor = (level: number) => (level === 0 ? undefined : `color-mix(in srgb, ${color} ${LEVEL_MIX[level]}%, var(--ranch-page))`);

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  React.useEffect(() => {
    const node = host.current;
    if (!node) return;
    const resize = () => {
      setWidth(node.getBoundingClientRect().width);
      setTooltip(null);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const clear = () => setTooltip(null);
    window.addEventListener('scroll', clear, true);
    return () => window.removeEventListener('scroll', clear, true);
  }, []);

  React.useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!tip || !tooltip) return;
    const bounds = tip.getBoundingClientRect();
    const left = (tooltip.left + tooltip.right - bounds.width) / 2;
    const top = tooltip.top - bounds.height - 8 >= 8 ? tooltip.top - bounds.height - 8 : tooltip.bottom + 8;
    tip.style.left = `${Math.max(8, Math.min(innerWidth - bounds.width - 8, left))}px`;
    tip.style.top = `${Math.max(8, Math.min(innerHeight - bounds.height - 8, top))}px`;
  }, [tooltip]);

  const changeView = (next: ActivityHeatmapView) => {
    setTooltip(null);
    setView(next);
  };

  const showTooltip = (cell: Cell, target: HTMLElement) => {
    const { left, top, right, bottom } = target.getBoundingClientRect();
    setTooltip({ cell, left, top, right, bottom });
  };

  const navigateDay = (event: React.KeyboardEvent, cell: Cell) => {
    if (event.key === 'Escape') {
      setTooltip(null);
      return;
    }
    const directions = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    const direction = directions[event.key as keyof typeof directions];
    if (!direction && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    let next = event.key === 'Home' ? visibleCells[0] : event.key === 'End' ? visibleCells.at(-1) : undefined;
    if (direction) {
      const here = position(cell, view, layout);
      const candidates = visibleCells
        .map((candidate) => {
          const at = position(candidate, view, layout);
          const dx = at.x - here.x;
          const dy = at.y - here.y;
          const forward = dx * direction[0]! + dy * direction[1]!;
          const sideways = Math.abs(dx * direction[1]! - dy * direction[0]!);
          return { cell: candidate, forward, distance: forward + sideways * 20 };
        })
        .filter((candidate) => candidate.forward > 0.5)
        .sort((a, b) => a.distance - b.distance);
      next = candidates[0]?.cell;
    }
    if (next) (plotRef.current?.querySelector(`[data-date="${next.date}"]`) as HTMLButtonElement | null)?.focus();
  };

  const first = layout.shown[0];
  const last = layout.shown.at(-1);
  const rangeLabel = first && last ? `${SHORT_DATE.format(fromKey(first.date)!)} to ${END_DATE.format(fromKey(last.date)!)}` : 'Preparing calendar';
  const insight = !layout.active
    ? `No ${activeNoun} in this range`
    : view === 'weekdays' && bestDay
      ? `${WEEKDAYS[layout.bestWeekday]} leads with ${bestDay.length} ${activeNoun}`
      : view === 'months' && bestMonth
        ? `${bestMonth.label} leads with ${bestMonth.cells.length} ${activeNoun}`
        : `Paid in ${layout.activeMonths} of the last ${layout.months.length} months.`;

  const stats = [
    { key: 'total', label: labels.total, value: formatValue(layout.total) },
    { key: 'months', label: labels.months, value: `${layout.activeMonths} of ${layout.months.length}` },
    { key: 'best', label: labels.best, value: formatValue(layout.biggestMonth) },
  ];

  return (
    <div className={`ahm ${className}`} data-view={view} data-ready={ready} style={{ '--ahm-color': color } as React.CSSProperties} onMouseLeave={() => setTooltip(null)}>
      <div ref={host} className="ahm-host">
        <dl className="ahm-stats">
          {stats.map((stat) => (
            <div key={stat.key}>
              <dt>{stat.label}</dt>
              <dd data-stat={stat.key} className="num" title={stat.value}>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="ahm-bar">
          <div
            role="radiogroup"
            aria-label="Heatmap layout"
            className="ahm-seg"
            onKeyDown={(event) => {
              let next = -1;
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (VIEWS.indexOf(view) + 1) % 3;
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (VIEWS.indexOf(view) + 2) % 3;
              if (event.key === 'Home') next = 0;
              if (event.key === 'End') next = 2;
              if (next < 0) return;
              event.preventDefault();
              changeView(VIEWS[next]!);
              (event.currentTarget.querySelector(`[data-view-option="${VIEWS[next]}"]`) as HTMLButtonElement | null)?.focus();
            }}
          >
            {VIEWS.map((option) => {
              const Icon = VIEW_ICONS[option];
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  data-view-option={option}
                  aria-checked={view === option}
                  tabIndex={view === option ? 0 : -1}
                  onClick={() => changeView(option)}
                  className={view === option ? 'is-on' : ''}
                >
                  <Icon size={15} aria-hidden="true" />
                  {VIEW_NAMES[option]}
                </button>
              );
            })}
          </div>
          <p data-insight className="ahm-insight" aria-live="polite" aria-atomic="true">{insight}</p>
        </div>

        <p id={descriptionId} className={truncated ? 'ahm-note' : 'ranch-sr'}>
          {truncated ? `Showing the most recent ${layout.weeks} weeks (${layout.shown.length} of ${cells.length} days). Figures cover these days.` : `${rangeLabel}. Each square is one day.`} Use the arrow keys to explore dates.
        </p>

        <div
          ref={plotRef}
          role="group"
          aria-label={`${VIEW_NAMES[view]} activity`}
          aria-describedby={descriptionId}
          aria-busy={!ready}
          className="ahm-plot"
          style={{ height: PLOT_HEIGHT, visibility: ready ? 'visible' : 'hidden' }}
        >
          <div aria-hidden="true" className="ahm-axes">
            {WEEKDAYS.map((day, index) => (
              <div key={day} className="ahm-row" style={{ top: 52 + index * 24, height: layout.edge, opacity: view === 'months' ? 0 : 1 }}>
                <i style={{ left: LEFT }} />
                <span className={view === 'weekdays' && index === layout.bestWeekday ? 'is-peak' : ''}>
                  <b>{day}</b>
                  {view === 'weekdays' && <em className="num">{layout.weekdays[index]!.length}</em>}
                </span>
              </div>
            ))}
            {layout.months.map((month, index) => {
              const isBar = view === 'months';
              const x = isBar ? LEFT + (index + 0.5) * layout.monthColumn : LEFT + (month.firstWeek - layout.firstWeek) * layout.calendarStep;
              const countY = BASELINE - (month.cells.length ? layout.edge + (month.cells.length - 1) * layout.monthStep : 0) - 17;
              const peak = isBar && index === layout.bestMonth;
              const next = layout.months[index + 1];
              // calendar view: a partial first month would collide with the next label
              if (!isBar && next && (next.firstWeek - month.firstWeek) * layout.calendarStep < 30) return null;
              return (
                <React.Fragment key={month.key}>
                  <span
                    className={`ahm-mo${peak ? ' is-peak' : ''}`}
                    style={{ left: x, top: isBar ? BASELINE + 9 : 25, transform: isBar ? 'translateX(-50%)' : undefined, opacity: view === 'weekdays' ? 0 : 1 }}
                  >
                    {month.label}
                  </span>
                  {isBar && (
                    <span className={`ahm-mo num${peak ? ' is-peak' : ''}`} style={{ left: x, top: countY, transform: 'translateX(-50%)' }}>
                      {month.cells.length}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {layout.shown.map((cell, index) => {
            const at = position(cell, view, layout);
            const visible = view === 'calendar' || cell.value > 0;
            const level = levelOf(cell.value);
            return (
              <button
                key={cell.date}
                type="button"
                data-date={cell.date}
                data-level={level}
                aria-label={`${cell.label}: ${formatValue(cell.value)}`}
                aria-describedby={tooltip?.cell.date === cell.date ? tooltipId : undefined}
                aria-hidden={!visible}
                disabled={!visible}
                tabIndex={visible && cell.date === tabDate ? 0 : -1}
                className="ahm-cell"
                style={{
                  width: layout.edge,
                  height: layout.edge,
                  transform: `translate(${at.x}px, ${at.y}px)`,
                  opacity: visible ? 1 : 0,
                  pointerEvents: visible ? 'auto' : 'none',
                  backgroundColor: levelColor(level),
                  transitionDuration: reduced ? '0ms' : '620ms',
                  transitionDelay: reduced ? '0ms' : `${(index % 13) * 12}ms`,
                }}
                onPointerEnter={(event) => showTooltip(cell, event.currentTarget)}
                onPointerLeave={() => setTooltip(null)}
                onFocus={(event) => {
                  setFocusedDate(cell.date);
                  showTooltip(cell, event.currentTarget);
                }}
                onBlur={() => setTooltip(null)}
                onKeyDown={(event) => navigateDay(event, cell)}
              />
            );
          })}
        </div>

        <div className="ahm-foot">
          <span>{rangeLabel}</span>
          <div className="ahm-legend" aria-label="Color intensity: less to more activity">
            <span>Less</span>
            {LEVEL_MIX.map((_, level) => (
              <i key={level} style={{ backgroundColor: levelColor(level) }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
      {tooltip && (
        <div ref={tipRef} id={tooltipId} role="tooltip" className="ahm-tip" style={{ left: 8, top: 8 }}>
          <p>{tooltip.cell.label}</p>
          <b className="num">
            {formatValue(tooltip.cell.value)}
            {tooltip.cell.value === 0 ? ' · No activity' : ''}
          </b>
        </div>
      )}
    </div>
  );
}

export default ActivityHeatmap;
