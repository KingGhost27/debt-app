/**
 * Payoff Steps Component - Kawaii Edition
 *
 * Displays the step-by-step payoff timeline with visual progress indicators.
 * Features cute styling, animations, and delightful interactions.
 */

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Sparkles, Target, Clock, PartyPopper } from 'lucide-react';
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
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-300/30">
          <Target size={20} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Step-by-Step Plan</h2>
      </div>

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
              <div className="card bg-white rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Step number indicator bar */}
                <div
                  className={`h-1.5 -mx-4 -mt-4 mb-4 ${
                    isLast
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                      : 'bg-gradient-to-r from-primary-400 to-primary-600'
                  }`}
                />

                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-bold shrink-0 shadow-lg ${
                      isLast
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-300/40'
                        : 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-primary-300/40'
                    }`}
                  >
                    <span className="text-[10px] font-semibold opacity-80">STEP</span>
                    <span className="text-xl">{step.stepNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">
                      Completes on {format(stepDate, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={12} />
                      {formatTimeUntil(stepDate)}
                    </p>
                  </div>
                </div>

                {/* Milestones (debts paid off in this step) */}
                {step.milestonesInStep.map((milestone) => (
                  <div
                    key={milestone.debtId}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl mb-3 border border-green-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-300/30">
                      <PartyPopper size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-700 flex items-center gap-1">
                        {milestone.debtName} Paid Off!
                        <Sparkles size={14} className="text-green-400 animate-kawaii-pulse" />
                      </p>
                      <p className="text-sm text-green-600">
                        {format(parseISO(milestone.payoffDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Debt receiving extra payments */}
                {debtGettingExtra && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 rounded-xl text-xs font-semibold">
                      Extra Payment
                    </span>
                    <span className="truncate font-medium">→ {debtGettingExtra.name}</span>
                  </div>
                )}

                {/* Debts paying minimum */}
                {step.debtsPayingMinimum.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium">
                      Minimum
                    </span>
                    <span>
                      {step.debtsPayingMinimum.length} account
                      {step.debtsPayingMinimum.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Progress visualization */}
                <div className="mt-5 pt-5 border-t border-gray-100">
                  {/* Balance decrease summary */}
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">Paid this step</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(stepProgress.paidThisStep)}
                    </span>
                  </div>

                  {/* Progress bar showing step completion */}
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isLast
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : 'bg-gradient-to-r from-primary-400 to-primary-600'
                      }`}
                      style={{ width: `${Math.min(100, stepPaydownPercent)}%` }}
                    />
                  </div>

                  {/* Journey progress indicator */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {formatCurrency(stepProgress.endingBalance)} remaining
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        isLast ? 'text-green-600' : 'text-primary-600'
                      }`}
                    >
                      <Sparkles size={10} />
                      {stepProgress.percentComplete.toFixed(0)}% of journey
                    </span>
                  </div>

                  {/* Step duration */}
                  {stepProgress.monthCount > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
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
