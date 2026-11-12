/**
 * Sparkline - a compact inline trend chart (line, area or column) with a
 * hover and keyboard readout.
 *
 * Adapted from the 21st.dev component "Sparkline" (21st id 34510, by
 * appica-dev): https://21st.dev/community/components/appica-dev/sparkline/columns
 * Keeps the original's parts and props: <Sparkline data labels color format>,
 * <SparklineChart variant curve fill baseline height strokeWidth indicator
 * tooltip>, <SparklineValue> and <SparklineLabel>. The geometry (smoothed
 * line path, area to a baseline, column bars) is the same; the Tailwind
 * utilities and the shadcn helper imports are replaced by plain CSS in
 * plan-widgets.css that reads the ranch tokens. Additions: the chart is a
 * focusable image whose points move with the arrow keys, and the transitions
 * stop under prefers-reduced-motion.
 */

import { createContext, useContext, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import './plan-widgets.css';

type Variant = 'line' | 'area' | 'column';
export interface SparklinePoint { index: number; value: number; label?: string }

interface Ctx {
  data: number[];
  labels?: string[];
  active: number | null;
  setActive: (i: number | null) => void;
  format?: Intl.NumberFormatOptions;
}
const SparkCtx = createContext<Ctx | null>(null);
function useSpark() {
  const c = useContext(SparkCtx);
  if (!c) throw new Error('Sparkline parts must be rendered inside <Sparkline>.');
  return c;
}

const round = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const fmt = (v: number, f?: Intl.NumberFormatOptions) => (Number.isFinite(v) ? new Intl.NumberFormat('en-US', f).format(v) : '');

export function Sparkline({
  data, labels, color, format, className = '', style, children,
}: {
  data: number[]; labels?: string[]; color?: string; format?: Intl.NumberFormatOptions;
  className?: string; style?: CSSProperties; children: ReactNode;
}) {
  const [active, setActive] = useState<number | null>(null);
  const value = useMemo<Ctx>(() => ({ data, labels, active, setActive, format }), [data, labels, active, format]);
  return (
    <SparkCtx.Provider value={value}>
      <div className={`spk ${className}`.trim()} style={{ ...style, '--spk-color': color ?? 'var(--ranch-fill)' } as CSSProperties}>
        {children}
      </div>
    </SparkCtx.Provider>
  );
}

function linePath(pts: { x: number; y: number }[], smoothing: number) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1], p0 = pts[i - 1] ?? p1, p3 = pts[i + 2] ?? p2;
    d += ` C ${round(p1.x + ((p2.x - p0.x) / 6) * smoothing)} ${round(p1.y + ((p2.y - p0.y) / 6) * smoothing)}, ${round(p2.x - ((p3.x - p1.x) / 6) * smoothing)} ${round(p2.y - ((p3.y - p1.y) / 6) * smoothing)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function SparklineChart({
  variant = 'line', curve = 0.5, fill = false, baseline = 0, height = 48, strokeWidth = 2.5,
  indicator = true, tooltip = false, 'aria-label': ariaLabel,
}: {
  variant?: Variant; curve?: number; fill?: boolean; baseline?: number; height?: number; strokeWidth?: number;
  indicator?: boolean; tooltip?: boolean; 'aria-label'?: string;
}) {
  const { data, labels, active, setActive, format } = useSpark();
  const n = data.length;
  const ref = useRef<HTMLDivElement>(null);

  const geom = useMemo(() => {
    if (variant === 'column' || n === 0) return null;
    const area = variant === 'area';
    const min = Math.min(...data), max = Math.max(...data);
    const lo = area ? Math.min(baseline, min) : min;
    const hi = area ? Math.max(baseline, max) : max;
    const span = hi - lo || 1;
    const inset = strokeWidth + 1;
    const yOf = (v: number) => inset + (1 - (v - lo) / span) * (height - inset * 2);
    const pts = data.map((v, i) => {
      const frac = n === 1 ? 0.5 : i / (n - 1);
      const y = yOf(v);
      return { x: round(frac * 100), y: round(y), left: frac, top: y / height };
    });
    const d = linePath(pts, clamp01(curve));
    const foot = area ? round(yOf(baseline)) : height;
    return { d, pts, fillPath: `${d} L ${pts[n - 1].x} ${foot} L ${pts[0].x} ${foot} Z` };
  }, [data, variant, curve, height, strokeWidth, baseline, n]);

  const cols = useMemo(() => {
    if (variant !== 'column' || n === 0) return null;
    const lo = Math.min(baseline, ...data), hi = Math.max(baseline, ...data);
    const span = hi - lo || 1;
    const baseFrac = (hi - baseline) / span;
    return {
      baseFrac,
      bars: data.map((v, i) => {
        const vf = (hi - v) / span;
        return { top: round(Math.min(vf, baseFrac) * 100), size: Math.max(2, round(Math.abs(vf - baseFrac) * 100)), left: (i + 0.5) / n, topFrac: vf };
      }),
    };
  }, [data, variant, baseline, n]);

  if (n === 0) return null;
  const showFill = geom && (variant === 'area' || fill);
  const marker = active === null ? null : geom ? geom.pts[active] : cols!.bars[active];
  const hit = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const t = clamp01((e.clientX - r.left) / r.width);
    setActive(variant === 'column' ? Math.min(n - 1, Math.floor(t * n)) : Math.round(t * (n - 1)));
  };
  const key = (e: KeyboardEvent) => {
    const cur = active ?? n - 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setActive(Math.min(n - 1, cur + 1));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setActive(Math.max(0, cur - 1));
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(n - 1);
    else if (e.key === 'Escape') setActive(null);
    else return;
    e.preventDefault();
  };
  const left = marker ? ('left' in marker ? marker.left : 0) : 0;
  const top = marker ? ('topFrac' in marker ? marker.topFrac : (marker as { top: number }).top) : 0;

  return (
    <div
      ref={ref}
      className="spk-chart"
      style={{ height }}
      role="img"
      tabIndex={0}
      aria-label={`${ariaLabel ?? `${variant} chart`}. Use the arrow keys to read each point.`}
      onPointerDown={hit}
      onPointerMove={hit}
      onPointerLeave={() => setActive(null)}
      onPointerUp={(e) => { if (e.pointerType !== 'mouse') setActive(null); }}
      onKeyDown={key}
      onBlur={() => setActive(null)}
    >
      {geom ? (
        <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {showFill && <path d={geom.fillPath} fill="var(--spk-color)" fillOpacity={0.16} />}
          <path d={geom.d} fill="none" stroke="var(--spk-color)" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        <>
          <div className="spk-cols">
            {cols!.bars.map((b, i) => (
              <div key={i} className={`spk-col${indicator && active === i ? ' is-on' : ''}`}>
                <i style={{ top: `${b.top}%`, height: `${b.size}%` }} />
              </div>
            ))}
          </div>
          <span className="spk-base" aria-hidden="true" style={{ top: `${round(cols!.baseFrac * 100)}%` }} />
        </>
      )}
      {marker && indicator && geom && (
        <>
          <span className="spk-guide" aria-hidden="true" style={{ left: `${left * 100}%` }} />
          <span className="spk-dot" aria-hidden="true" style={{ left: `${left * 100}%`, top: `${top * 100}%` }} />
        </>
      )}
      {marker && tooltip && active !== null && (
        <div className="spk-tip" aria-hidden="true" style={{ left: `${Math.min(88, Math.max(12, left * 100))}%`, top: `${top * 100}%` }}>
          {labels?.[active] && <span>{labels[active]}</span>}
          <b>{fmt(data[active], format)}</b>
        </div>
      )}
    </div>
  );
}

export function SparklineValue({ className = '', children }: { className?: string; children?: (formatted: string, value: number) => ReactNode }) {
  const { data, active, format } = useSpark();
  const v = data[active ?? data.length - 1] ?? NaN;
  const f = fmt(v, format);
  return <span className={`spk-value ${className}`.trim()}>{children ? children(f, v) : f}</span>;
}

export function SparklineLabel({ className = '' }: { className?: string }) {
  const { data, labels, active } = useSpark();
  if (!labels) return null;
  return <span className={`spk-label ${className}`.trim()}>{labels[active ?? data.length - 1] ?? ''}</span>;
}
