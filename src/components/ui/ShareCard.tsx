/**
 * ShareCard
 *
 * Screenshottable card for milestone celebrations.
 * Forwarded ref so parent can capture it with html-to-image.
 * Contains stats, headline, and cowculator.net branding.
 */

import { forwardRef } from 'react';
import type { MilestoneEvent, CelebrationStats } from '../../types/celebrations';

interface ShareCardProps {
  event: MilestoneEvent;
  stats: CelebrationStats;
  themePrimary?: string;
  /** Emojis to display in the card header — 2 for small milestones, 10 for full herd */
  animalEmojis?: string[];
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ event, stats, themePrimary = '#a855f7', animalEmojis = ['🐄'] }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '100%',
          background: 'white',
          borderRadius: 24,
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header gradient */}
        <div
          style={{
            background: `linear-gradient(135deg, ${themePrimary}cc, ${themePrimary}88)`,
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
            marginBottom: 6,
            lineHeight: 1,
            fontSize: animalEmojis.length > 2 ? 28 : 44,
          }}>
            {animalEmojis.map((emoji, i) => (
              <span key={i}>{emoji}</span>
            ))}
          </div>
          {/* Money emoji row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 8, fontSize: 13, opacity: 0.85 }}>
            {['💰', '🪙', '💵', '💸', '🪙', '💰'].map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
          <h2
            style={{
              margin: '12px 0 4px',
              fontSize: 20,
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.2,
              textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {event.headline}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
            {event.subtext}
          </p>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: '#f3f4f6',
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
                background: 'white',
                padding: '14px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: themePrimary }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
            🐄 cowculator.net
          </span>
          <span style={{ fontSize: 11, color: '#d1d5db' }}>
            Track your debt freedom journey
          </span>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = 'ShareCard';
