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
      {/* Progress track */}
      <div className="relative pt-6 pb-2">
        {/* Track background */}
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Fill */}
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, percentPaid)}%` }}
          />
        </div>

        {/* Milestone markers */}
        {milestones.map((milestone) => {
          const isNext = nextMilestone?.percent === milestone.percent;
          return (
            <div
              key={milestone.percent}
              className="absolute top-0"
              style={{ left: `${milestone.percent}%`, transform: 'translateX(-50%)' }}
            >
              {/* Marker circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-base
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
