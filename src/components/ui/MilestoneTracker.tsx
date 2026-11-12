/**
 * Milestone Tracker: ranch edition.
 *
 * A fence-rail progress track with a marker at each milestone (25 / 50 / 75 /
 * 100%). Reached milestones are filled with a check, the next one is ringed.
 */

import { format, parseISO } from 'date-fns';
import { Check } from 'lucide-react';
import { formatCurrency } from '../../lib/calculations';
import type { OverallMilestone } from '../../lib/milestones';
import './modal.css';

interface MilestoneTrackerProps {
  milestones: OverallMilestone[];
  percentPaid: number;
}

export function MilestoneTracker({ milestones, percentPaid }: MilestoneTrackerProps) {
  const nextMilestone = milestones.find((m) => !m.isReached);

  return (
    <div className="ms">
      {/* Track is inset 18px on the right so the 100% marker (36px) stays inside;
          marker left = percent% minus percent*18/100 px keeps it in sync with the fill. */}
      <div className="ms-wrap">
        <div className="ms-track">
          <i style={{ width: `${Math.min(100, percentPaid)}%` }} />
        </div>

        {milestones.map((milestone) => {
          const isNext = nextMilestone?.percent === milestone.percent;
          const offset = -(milestone.percent * 18) / 100;
          return (
            <div key={milestone.percent} className="ms-mk" style={{ left: `calc(${milestone.percent}% + ${offset}px)` }}>
              <span className={`ms-dot${milestone.isReached ? ' is-on' : isNext ? ' is-next' : ''}`}>
                {milestone.isReached && <Check size={18} strokeWidth={3} />}
              </span>
              <span className={`ms-pct${milestone.isReached ? ' is-on' : ''}`}>{milestone.percent}%</span>
            </div>
          );
        })}
      </div>

      {nextMilestone && (
        <div className="ms-next">
          <span>
            <b>Next: {nextMilestone.label}</b>
            <span className="ms-togo">
              {formatCurrency(nextMilestone.amountAtMilestone - (nextMilestone.amountAtMilestone * percentPaid / nextMilestone.percent))} to go
            </span>
          </span>
          {nextMilestone.estimatedDate && (
            <span className="ms-date">~{format(parseISO(nextMilestone.estimatedDate), 'MMM yyyy')}</span>
          )}
        </div>
      )}

      {!nextMilestone && percentPaid >= 100 && (
        <div className="ms-done">You did it! All milestones reached!</div>
      )}
    </div>
  );
}
