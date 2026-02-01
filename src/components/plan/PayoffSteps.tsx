/**
 * Payoff Steps Component
 *
 * Displays the step-by-step payoff timeline with visual progress indicators.
 */

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { formatTimeUntil, formatCurrency } from '../../lib/calculations';
import type { PayoffPlan, PayoffStep, MonthlyPayment, Debt } from '../../types';

interface PayoffStepsProps {
  plan: PayoffPlan;
  sortedDebts: Debt[];
}

interface StepProgressData {
  stepNumber: number;
  startingBalance: number;
  endingBalance: number;
  paidThisStep: number;
  percentComplete: number;
  monthCount: number;
}

/**
 * Calculate progress data for a specific step
 */
function calculateStepProgress(
  stepIndex: number,
  steps: PayoffStep[],
  monthlyBreakdown: MonthlyPayment[],
  initialTotalBalance: number
): StepProgressData {
  const currentStep = steps[stepIndex];
  const previousStep = stepIndex > 0 ? steps[stepIndex - 1] : null;

  // Find months in this step
  const stepStartMonth = previousStep
    ? format(parseISO(previousStep.completionDate), 'yyyy-MM')
    : null;
  const stepEndMonth = format(parseISO(currentStep.completionDate), 'yyyy-MM');

  const stepMonths = monthlyBreakdown.filter((m) => {
    if (previousStep && stepStartMonth) {
      return m.month > stepStartMonth && m.month <= stepEndMonth;
    }
    return m.month <= stepEndMonth;
  });

  // Get ending balance (sum of remaining balances in final month of this step)
  const lastMonth = stepMonths[stepMonths.length - 1];
  const endingBalance = lastMonth
    ? lastMonth.payments.reduce((sum, p) => sum + p.remainingBalance, 0)
    : 0;

  // Get starting balance
  let startingBalance: number;
  if (previousStep && stepIndex > 0) {
    const prevStepEndMonth = format(parseISO(previousStep.completionDate), 'yyyy-MM');
    const prevMonth = monthlyBreakdown.find((m) => m.month === prevStepEndMonth);
    startingBalance = prevMonth
      ? prevMonth.payments.reduce((sum, p) => sum + p.remainingBalance, 0)
      : initialTotalBalance;
  } else {
    startingBalance = initialTotalBalance;
  }

  const paidThisStep = startingBalance - endingBalance;
  const percentComplete =
    initialTotalBalance > 0
      ? ((initialTotalBalance - endingBalance) / initialTotalBalance) * 100
      : 0;

  return {
    stepNumber: currentStep.stepNumber,
    startingBalance,
    endingBalance,
    paidThisStep,
    percentComplete,
    monthCount: stepMonths.length,
  };
}

export function PayoffSteps({ plan, sortedDebts }: PayoffStepsProps) {
  // Calculate initial total balance from debts
  const initialTotalBalance = useMemo(
    () => sortedDebts.reduce((sum, d) => sum + d.originalBalance, 0),
    [sortedDebts]
  );

  // Pre-compute progress data for each step
  const stepProgressMap = useMemo(() => {
    const map = new Map<number, StepProgressData>();
    plan.steps.forEach((step, index) => {
      map.set(
        step.stepNumber,
        calculateStepProgress(index, plan.steps, plan.monthlyBreakdown, initialTotalBalance)
      );
    });
    return map;
  }, [plan.steps, plan.monthlyBreakdown, initialTotalBalance]);

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
          const stepProgress = stepProgressMap.get(step.stepNumber)!;

          // Calculate what percent of THIS step's paydown this represents
          const stepPaydownPercent =
            stepProgress.startingBalance > 0
              ? (stepProgress.paidThisStep / stepProgress.startingBalance) * 100
              : 0;

          return (
            <div key={step.stepNumber}>
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

                {/* Progress visualization */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {/* Balance decrease summary */}
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Paid this step</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(stepProgress.paidThisStep)}
                    </span>
                  </div>

                  {/* Progress bar showing step completion */}
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isLast ? 'bg-green-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(100, stepPaydownPercent)}%` }}
                    />
                  </div>

                  {/* Journey progress indicator */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatCurrency(stepProgress.endingBalance)} remaining
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isLast ? 'text-green-600' : 'text-primary-600'
                      }`}
                    >
                      {stepProgress.percentComplete.toFixed(0)}% of journey
                    </span>
                  </div>

                  {/* Step duration */}
                  {stepProgress.monthCount > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {stepProgress.monthCount} month
                      {stepProgress.monthCount !== 1 ? 's' : ''} in this step
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
