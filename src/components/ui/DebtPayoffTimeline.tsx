/**
 * Debt Payoff Timeline - ranch edition.
 *
 * Vertical timeline of when each debt clears: a ring per open debt, a check
 * for a paid one, joined by a line that turns the ok color once cleared.
 * Reads the ranch tokens, so it follows every theme and the night scenes.
 */

import { format, parseISO } from 'date-fns';
import { Check } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { formatCurrency } from '../../lib/calculations';
import type { DebtTimelineEntry } from '../../lib/milestones';

interface DebtPayoffTimelineProps {
  timeline: DebtTimelineEntry[];
}

export function DebtPayoffTimeline({ timeline }: DebtPayoffTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, color: 'var(--ranch-ink)' }}>
      {timeline.map((entry, index) => {
        const isLast = index === timeline.length - 1;
        const done = entry.isCompleted;
        return (
          <li key={entry.debtId} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', width: 32 }}>
              {done ? (
                <span
                  style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--ranch-ok-bg)', color: 'var(--ranch-ok-ink)' }}
                >
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                </span>
              ) : (
                <ProgressRing percentage={entry.percentPaid} size={32} strokeWidth={4} showLabel={false} />
              )}
              {!isLast && (
                <span style={{ width: 3, flex: 1, minHeight: 22, borderRadius: 2, background: done ? 'var(--ranch-ok-fill)' : 'var(--ranch-track)' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <h4
                    style={{
                      margin: 0, font: '600 16px/1.25 Fredoka, sans-serif',
                      color: done ? 'var(--ranch-ok-ink)' : 'var(--ranch-ink)',
                    }}
                  >
                    {entry.debtName}
                  </h4>
                  <p style={{ margin: '2px 0 0', font: '600 13.5px/1.35 Nunito, sans-serif', color: 'var(--ranch-ink2)' }}>
                    {done
                      ? 'Paid off!'
                      : entry.payoffDate
                        ? `${format(parseISO(entry.payoffDate), 'MMM yyyy')} · ${formatCurrency(entry.currentBalance)} left`
                        : `Plan stalls · ${formatCurrency(entry.currentBalance)} left`}
                  </p>
                </div>
                <span style={{ font: '700 13px/1 Quicksand, sans-serif', fontVariantNumeric: 'tabular-nums', color: done ? 'var(--ranch-ok-ink)' : 'var(--ranch-ink2)' }}>
                  {entry.percentPaid.toFixed(0)}%
                </span>
              </div>

              {!done && (
                <div style={{ marginTop: 8, height: 7, borderRadius: 999, background: 'var(--ranch-track)', overflow: 'hidden' }}>
                  <div style={{ width: `${entry.percentPaid}%`, height: '100%', borderRadius: 999, background: 'var(--ranch-fill)', transition: 'width .9s cubic-bezier(.16, 1, .3, 1)' }} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
