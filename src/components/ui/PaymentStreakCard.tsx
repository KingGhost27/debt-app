/**
 * Payment Streak Card
 *
 * The on-time streak as a picket fence: one picket per month in a row (up to
 * ten) and a dashed "next" picket. Optional progress bar for this month's
 * payments and milestone badges. Same fence as the dashboard's streak.
 * Styled in pages/track.css (.psc-*) from the ranch tokens.
 */

import { Check, Flame, Trophy } from 'lucide-react';
import { Plank } from '../dashboard/RanchPanels';
import type { StreakData } from '../../lib/milestones';
import '../../pages/track.css';

interface PaymentStreakCardProps {
  streak: StreakData;
  /** This month's payments made vs expected; draws the progress bar. */
  progress?: { done: number; expected: number };
}

function getStreakMessage(months: number): string {
  if (months === 0) return 'Make your first payment to start!';
  if (months <= 2) return 'Keep it going!';
  if (months <= 5) return 'On fire!';
  return 'Unstoppable!';
}

const MILESTONES = [1, 3, 6, 12];

function Picket({ checked = false }: { checked?: boolean }) {
  return (
    <svg viewBox="0 0 22 44" aria-hidden="true">
      <path className="pk-b" d="M2 12 L11 2 L20 12 V42 H2 Z" />
      {checked && <path className="pk-c" d="M6 27 l4 4 7 -8" />}
    </svg>
  );
}

export function PaymentStreakCard({ streak, progress }: PaymentStreakCardProps) {
  const months = streak.consecutiveMonths;
  const pickets = Math.min(months, 10);
  const pct = progress && progress.expected > 0 ? Math.min(100, (progress.done / progress.expected) * 100) : 0;

  return (
    <section className="rui-card trk-mod psc">
      <div className="trk-mod-h">
        <Plank icon={<Flame size={18} aria-hidden="true" />}>Payment Streak</Plank>
        {streak.currentMonthOnTrack && (
          <span className="rui-badge ok"><Check size={13} aria-hidden="true" />On track</span>
        )}
      </div>

      <div className="psc-fence" role="img" aria-label={`${months} month${months === 1 ? '' : 's'} in a row`}>
        {Array.from({ length: pickets }, (_, i) => (
          <span key={i} className="psc-pk"><Picket checked /></span>
        ))}
        <span className="psc-pk is-next"><Picket /></span>
      </div>

      <p className="psc-line">
        {months > 0 ? (
          <><b className="num">{months}</b> month{months !== 1 ? 's' : ''} in a row. {getStreakMessage(months)}</>
        ) : (
          getStreakMessage(0)
        )}
      </p>
      <p className="psc-sub">
        {streak.totalCompletedPayments} payments total
        {streak.longestStreak > months ? ` · best ${streak.longestStreak} months` : ''}
      </p>

      {progress && (
        <div className="psc-prog">
          <div className="psc-prog-t">
            <span>This month's progress</span>
            <b className="num">{progress.done}/{progress.expected} payments</b>
          </div>
          <div className="trk-track" role="progressbar" aria-valuemin={0} aria-valuemax={progress.expected} aria-valuenow={progress.done} aria-label="This month's payments">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {months >= 1 && (
        <ul className="psc-miles">
          {MILESTONES.filter((m) => months >= m).map((m) => (
            <li key={m} className="rui-badge ok">
              <Trophy size={13} aria-hidden="true" />
              {m === 12 ? '1 Year!' : `${m} Month${m > 1 ? 's' : ''}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
