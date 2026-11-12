/**
 * ShareCard
 *
 * Screenshottable card for milestone celebrations.
 * Forwarded ref so parent can capture it with html-to-image.
 * Contains stats, headline, and cowculator.net branding.
 * Ranch palette: colors come from the active scene via `palette`. Inline styles only and
 * system fonts, because html-to-image captures it with webfonts skipped; the animals are
 * emoji because SVG art taints the canvas in Firefox.
 */

import { forwardRef } from 'react';
import type { MilestoneEvent, CelebrationStats } from '../../types/celebrations';

interface ShareCardProps {
  event: MilestoneEvent;
  stats: CelebrationStats;
  themePrimary?: string;
  /** Emojis to display in the card header — 2 for small milestones, 10 for full herd */
  animalEmojis?: string[];
  palette?: { accent: string; accentInk: string; ink: string; ink2: string; page: string; page2: string; line: string };
}

const DEFAULT_PALETTE = { accent: '#3a2a66', accentInk: '#ffffff', ink: '#2a1f4d', ink2: '#5d4f86', page: '#fdfbff', page2: '#f3edfb', line: '#e2d8f3' };

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ event, stats, animalEmojis = ['🐄'], palette }, ref) => {
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
          {/* Animal parade — emoji only (SVGs taint canvas in Firefox) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: animalEmojis.length > 2 ? 4 : 8,
            marginBottom: 10,
            lineHeight: 1,
            fontSize: animalEmojis.length > 2 ? 28 : 44,
          }}>
            {animalEmojis.map((emoji, i) => (
              <span key={i}>{emoji}</span>
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
          <span style={{ fontSize: 14, fontWeight: 700, color: pal.ink }}>
            🐄 cowculator.net
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
