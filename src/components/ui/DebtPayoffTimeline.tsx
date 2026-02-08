/**
 * Debt Payoff Timeline - Kawaii Edition
 *
 * Vertical timeline showing when each debt will be paid off,
 * with progress indicators and celebration states.
 */

import { format, parseISO } from 'date-fns';
import { Check, PartyPopper } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { formatCurrency } from '../../lib/calculations';
import type { DebtTimelineEntry } from '../../lib/milestones';

interface DebtPayoffTimelineProps {
  timeline: DebtTimelineEntry[];
}

export function DebtPayoffTimeline({ timeline }: DebtPayoffTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <div className="space-y-1">
      {timeline.map((entry, index) => {
        const isLast = index === timeline.length - 1;

        return (
          <div key={entry.debtId} className="flex gap-3">
            {/* Timeline line + node */}
            <div className="flex flex-col items-center">
              {/* Node */}
              {entry.isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/30 animate-pop-in">
                  <Check size={16} className="text-white" strokeWidth={3} />
                </div>
              ) : (
                <ProgressRing
                  percentage={entry.percentPaid}
                  size={32}
                  strokeWidth={3}
                  showLabel={false}
                  showSparkle={false}
                />
              )}
              {/* Connecting line */}
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${entry.isCompleted ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-semibold text-sm ${entry.isCompleted ? 'text-green-600 dark:text-green-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                    {entry.debtName}
                    {entry.isCompleted && (
                      <PartyPopper size={14} className="inline ml-1.5 text-green-500" />
                    )}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.isCompleted
                      ? 'Paid off!'
                      : `${format(parseISO(entry.payoffDate), 'MMM yyyy')} · ${formatCurrency(entry.currentBalance)} left`
                    }
                  </p>
                </div>
                <span className={`text-xs font-bold tabular-nums ${entry.isCompleted ? 'text-green-500' : 'text-primary-500 dark:text-primary-400'}`}>
                  {entry.percentPaid.toFixed(0)}%
                </span>
              </div>

              {/* Mini progress bar */}
              {!entry.isCompleted && (
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-700"
                    style={{ width: `${entry.percentPaid}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
