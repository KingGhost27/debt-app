/**
 * Progress Ring - ranch edition.
 *
 * A circular progress indicator on the ranch tokens: the track is the ranch
 * track color and the arc is the ranch fill unless a color is passed (the
 * debt pages pass the category color). The arc eases to new values (the global
 * reduced-motion rule stops the ease). At 25/50/75/100% an optional sparkle
 * and a short cheer appear.
 */

import { Sparkles } from 'lucide-react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  showSparkle?: boolean;
  className?: string;
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 8,
  color,
  backgroundColor,
  showLabel = true,
  showSparkle = false,
  className = '',
}: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;
  const isMilestone = showSparkle && [25, 50, 75, 100].some((m) => Math.abs(pct - m) < 2);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ color: 'var(--ranch-ink)' }}>
      <svg width={size} height={size} role="img" aria-label={`${pct.toFixed(0)}% paid`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={backgroundColor || 'var(--ranch-track)'} strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color || 'var(--ranch-fill)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.16, 1, .3, 1)' }}
            className="rr-arc"
          />
        </g>
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: 'Quicksand, sans-serif' }}>
          <span style={{ fontWeight: 700, fontSize: Math.max(11, size * 0.21), fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {pct.toFixed(0)}%
          </span>
          {isMilestone && (
            <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--ranch-ok-ink)' }}>{pct >= 100 ? 'Done!' : 'Nice!'}</span>
          )}
        </div>
      )}

      {isMilestone && (
        <Sparkles size={12} aria-hidden="true" className="absolute -top-1 -right-1" style={{ color: 'var(--ranch-focus)' }} />
      )}
    </div>
  );
}
