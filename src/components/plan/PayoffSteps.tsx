/**
 * Payoff Steps Component
 *
 * Displays the step-by-step payoff timeline.
 */

import { format, parseISO } from 'date-fns';
import { formatTimeUntil } from '../../lib/calculations';
import type { PayoffPlan, Debt } from '../../types';

interface PayoffStepsProps {
  plan: PayoffPlan;
  sortedDebts: Debt[];
}

export function PayoffSteps({ plan, sortedDebts }: PayoffStepsProps) {
  if (plan.steps.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step-by-Step Plan</h2>

      <div className="space-y-4">
        {plan.steps.map((step, index) => {
          const isLast = index === plan.steps.length - 1;
          const stepDate = parseISO(step.completionDate);
          const debtGettingExtra = sortedDebts.find(
            (d) => d.id === step.debtReceivingExtra
          );

          return (
            <div key={step.stepNumber} className="relative">
              {/* Timeline connector */}
              {!isLast && (
                <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
              )}

              <div className="card">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold shrink-0 ${
                      isLast ? 'bg-green-500' : 'bg-primary-500'
                    }`}
                  >
                    <span className="text-xs">STEP</span>
                    <span>{step.stepNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">
                      Completes on {format(stepDate, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimeUntil(stepDate)}
                    </p>
                  </div>
                </div>

                {/* Milestones (debts paid off in this step) */}
                {step.milestonesInStep.map((milestone) => (
                  <div
                    key={milestone.debtId}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-xl mb-3"
                  >
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="font-semibold text-green-800">
                        {milestone.debtName} Paid Off!
                      </p>
                      <p className="text-sm text-green-600">
                        {format(parseISO(milestone.payoffDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Debt receiving extra payments */}
                {debtGettingExtra && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                      Extra
                    </span>
                    <span className="truncate">→ {debtGettingExtra.name}</span>
                  </div>
                )}

                {/* Debts paying minimum */}
                {step.debtsPayingMinimum.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      Minimum
                    </span>
                    <span>
                      {step.debtsPayingMinimum.length} account
                      {step.debtsPayingMinimum.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
