/**
 * Milestone Tracker - Kawaii Edition
 *
 * Horizontal progress track with milestone markers at 25%, 50%, 75%, 100%.
 * Celebrates reached milestones with animations.
 */

import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../lib/calculations';
import type { OverallMilestone } from '../../lib/milestones';

interface MilestoneTrackerProps {
  milestones: OverallMilestone[];
  percentPaid: number;
}

export function MilestoneTracker({ milestones, percentPaid }: MilestoneTrackerProps) {
  // Find the next upcoming milestone
  const nextMilestone = milestones.find((m) => !m.isReached);

  return (
    <div className="space-y-4">
      {/* Progress track
            Circle size = w-9 = 36px, half = 18px.
            Track has mx-[18px] so it starts/ends exactly under the edge markers.
            Marker left = calc(percent% + 18*(1 - 2*percent/100)px) keeps
            markers perfectly aligned with the fill bar at every position. */}
      <div className="relative pt-6 pb-5">
        {/* Track background — inset by half-circle on each side */}
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mx-[18px]">
          {/* Fill */}
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, percentPaid)}%` }}
          />
        </div>

        {/* Milestone markers */}
        {milestones.map((milestone) => {
          const isNext = nextMilestone?.percent === milestone.percent;
          // offset = 18 * (1 - 2*p/100) aligns center exactly with track fill position
          const offset = 18 * (1 - 2 * milestone.percent / 100);
          return (
            <div
              key={milestone.percent}
              className="absolute top-0"
              style={{
                left: `calc(${milestone.percent}% + ${offset}px)`,
                transform: 'translateX(-50%)',
              }}
            >
              {/* Marker circle */}
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm
                  transition-all duration-500 border-2
                  ${
                    milestone.isReached
                      ? 'bg-gradient-to-br from-primary-400 to-primary-600 border-primary-300 shadow-lg shadow-primary-500/30 animate-kawaii-pulse'
                      : isNext
                        ? 'bg-white dark:bg-gray-700 border-primary-300 dark:border-primary-600 shadow-md animate-kawaii-sparkle'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                  }
                `}
              >
                <span className={milestone.isReached || isNext ? '' : 'grayscale opacity-50'}>
                  {milestone.emoji}
                </span>
              </div>

              {/* Percent label */}
              <div
                className={`text-center mt-1 text-xs font-semibold ${
                  milestone.isReached
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {milestone.percent}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Next milestone info */}
      {nextMilestone && (
        <div className="flex items-center justify-between text-sm bg-primary-50 dark:bg-primary-900/20 rounded-2xl px-4 py-3">
          <div>
            <span className="font-semibold text-primary-700 dark:text-primary-300">
              Next: {nextMilestone.label}
            </span>
            <span className="text-primary-500 dark:text-primary-400 ml-2">
              {formatCurrency(nextMilestone.amountAtMilestone - (nextMilestone.amountAtMilestone * percentPaid / nextMilestone.percent))} to go
            </span>
          </div>
          {nextMilestone.estimatedDate && (
            <span className="text-xs text-primary-400 dark:text-primary-500">
              ~{format(parseISO(nextMilestone.estimatedDate), 'MMM yyyy')}
            </span>
          )}
        </div>
      )}

      {/* All milestones reached! */}
      {!nextMilestone && percentPaid >= 100 && (
        <div className="text-center py-2 text-primary-600 dark:text-primary-400 font-bold animate-heartbeat">
          You did it! All milestones reached! 🎉
        </div>
      )}
    </div>
  );
}
