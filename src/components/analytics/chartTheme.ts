/**
 * Chart theme: Recharts props read from the ranch tokens (--ranch-*), so
 * every chart restyles with the active theme and the night scenes. The values
 * are CSS var() strings; Recharts passes them through to SVG attributes and
 * inline styles, which both resolve custom properties.
 */

import type { CSSProperties } from 'react';

export const CHART_FONT = 'Quicksand, sans-serif';

export const chartGrid = {
  stroke: 'var(--ranch-line)',
  strokeDasharray: '2 5',
  vertical: false,
} as const;

export const chartTick = {
  fontSize: 12,
  fontFamily: CHART_FONT,
  fontWeight: 700,
  fill: 'var(--ranch-ink2)',
} as const;

export const chartAxisLine = { stroke: 'var(--ranch-line)' } as const;

export const chartTooltip: {
  contentStyle: CSSProperties;
  labelStyle: CSSProperties;
  itemStyle: CSSProperties;
  cursor: { stroke: string; strokeDasharray: string };
} = {
  contentStyle: {
    background: 'var(--ranch-page)',
    color: 'var(--ranch-ink)',
    border: 0,
    borderRadius: 14,
    padding: '8px 12px',
    boxShadow: '0 1px 2px var(--ranch-sh), 0 14px 28px -12px var(--ranch-sh)',
    fontFamily: CHART_FONT,
    fontWeight: 700,
    fontSize: 13,
  },
  labelStyle: { color: 'var(--ranch-ink)', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: 'var(--ranch-ink2)', padding: 0 },
  cursor: { stroke: 'var(--ranch-line)', strokeDasharray: '3 4' },
};

/** `$1.2k` style tick for money axes. */
export const moneyTick = (value: number) =>
  `$${value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : value}`;

/** Categorical series colors built from ranch tokens (twelve distinct steps). */
const BASE = [
  'var(--ranch-fill)',
  'var(--ranch-ok-fill)',
  'var(--ranch-focus)',
  'var(--ranch-soon-ink)',
  'var(--ranch-plank)',
  'var(--ranch-ink2)',
];
export const SERIES_COLORS = [
  ...BASE,
  ...BASE.map((c) => `color-mix(in srgb, ${c} 55%, var(--ranch-page))`),
];
