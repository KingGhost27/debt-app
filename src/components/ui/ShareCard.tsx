/**
 * ShareCard
 *
 * Screenshottable card for milestone celebrations.
 * Forwarded ref so parent can capture it with html-to-image.
 * Contains stats, headline, and cowculator.net branding.
 * Ranch palette: colors come from the active scene via `palette`. Inline styles only and
 * system fonts, because html-to-image captures it with webfonts skipped. The animals are
 * the drawn mascot SVGs, inline (never <img src=svg>, which taints the canvas).
 */

import { forwardRef, type ReactNode } from 'react';
import { DebtsyCow } from './DebtsyCow';
import type { MilestoneEvent, CelebrationStats } from '../../types/celebrations';

interface ShareCardProps {
  event: MilestoneEvent;
  stats: CelebrationStats;
  themePrimary?: string;
  /** Drawn mascots for the card header: 2 for small milestones, 10 for the full herd. */
  animals?: ReactNode[];
  /** Sample figures from Settings: the card says so and is not meant to be shared. */
  preview?: boolean;
  palette?: { accent: string; accentInk: string; ink: string; ink2: string; page: string; page2: string; line: string };
}

const DEFAULT_PALETTE = { accent: '#3a2a66', accentInk: '#ffffff', ink: '#2a1f4d', ink2: '#5d4f86', page: '#fdfbff', page2: '#f3edfb', line: '#e2d8f3' };

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ event, stats, animals = [], palette, preview = false }, ref) => {
    const pal = palette ?? DEFAULT_PALETTE;
    return (
      <div
        ref={ref}
        style={{
          width: '100%',
          background: pal.page,
          borderRadius: 24,
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: `inset 0 0 0 2px ${pal.line}`,
        }}
      >
        {/* Header gradient */}
        <div
          style={{
            background: pal.accent,
            padding: '28px 24px 20px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {preview && (
            <span style={{ position: 'absolute', top: 12, right: 14, padding: '3px 10px', borderRadius: 999, background: pal.page, color: pal.ink, fontSize: 12, fontWeight: 800, letterSpacing: '.02em' }}>
              Preview
            </span>
          )}
          {/* Animal parade: the inline mascot SVGs */}
          {/* Large herds split into balanced rows (5 + 5) so no animal wraps alone. */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginBottom: 10 }}>
            {(animals.length > 4
              ? [animals.slice(0, Math.ceil(animals.length / 2)), animals.slice(Math.ceil(animals.length / 2))]
              : [animals]
            ).map((row, r) => (
              <div key={r} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: animals.length > 2 ? 2 : 8, lineHeight: 0 }}>
                {row.map((animal, i) => (
                  <span key={i} style={{ display: 'inline-block', lineHeight: 0 }}>{animal}</span>
                ))}
              </div>
            ))}
          </div>
          <h2
            style={{
              margin: '12px 0 4px',
              fontSize: 20,
              fontWeight: 800,
              color: pal.accentInk,
              lineHeight: 1.2,
            }}
          >
            {event.headline}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: pal.accentInk, opacity: 0.9 }}>
            {event.subtext}
          </p>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: pal.line,
          }}
        >
          {[
            { label: 'Paid Off', value: formatCurrency(stats.totalPaid) },
            { label: 'Progress', value: `${Math.round(stats.percentPaid)}%` },
            { label: 'Interest Saved', value: formatCurrency(stats.interestSaved) },
            { label: 'Debt-Free Date', value: stats.debtFreeDate ? new Date(stats.debtFreeDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: pal.page,
                padding: '14px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: pal.ink }}>
                {item.value}
              </div>
              <div style={{ fontSize: 12, color: pal.ink2, marginTop: 2, fontWeight: 600 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            background: pal.page2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: pal.ink }}>
            <DebtsyCow size={24} animated={false} /> cowculator.net
          </span>
          <span style={{ fontSize: 12, color: pal.ink2 }}>
            Track your debt freedom journey
          </span>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = 'ShareCard';
