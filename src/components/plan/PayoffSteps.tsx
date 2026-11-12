/**
 * Payoff Steps - ranch edition.
 *
 * The step-by-step payoff plan: one ranch card per step with its number,
 * completion date, the debt paid off, who gets the extra payment and a
 * progress bar. The last step takes the ok colors.
 */

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Sparkles, Target, Clock, PartyPopper } from 'lucide-react';
import { Plank } from '../dashboard/RanchPanels';
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
  avgMonthlyPayment: number;
  stepPrincipal: number;
  stepInterest: number;
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

  const totalStepPayment = stepMonths.reduce((sum, m) => sum + m.totalPayment, 0);
  const stepPrincipal = stepMonths.reduce((sum, m) => sum + m.totalPrincipal, 0);
  const stepInterest = stepMonths.reduce((sum, m) => sum + m.totalInterest, 0);
  const avgMonthlyPayment = stepMonths.length > 0 ? totalStepPayment / stepMonths.length : 0;

  return {
    stepNumber: currentStep.stepNumber,
    startingBalance,
    endingBalance,
    paidThisStep,
    percentComplete,
    monthCount: stepMonths.length,
    avgMonthlyPayment,
    stepPrincipal,
    stepInterest,
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
    <section>
      <div className="pl-h"><Plank icon={<Target size={18} aria-hidden="true" />}>Step-by-Step Plan</Plank></div>

      <ol className="pl-steps">
        {plan.steps.map((step, index) => {
          const isLast = index === plan.steps.length - 1;
          const stepDate = parseISO(step.completionDate);
          const debtGettingExtra = sortedDebts.find((d) => d.id === step.debtReceivingExtra);
          const stepProgress = stepProgressMap.get(step.stepNumber)!;

          // what percent of THIS step's starting balance was paid down
          const stepPaydownPercent =
            stepProgress.startingBalance > 0 ? (stepProgress.paidThisStep / stepProgress.startingBalance) * 100 : 0;

          return (
            <li key={step.stepNumber} className={`rui-card pl-step${isLast ? ' is-last' : ''}`}>
              <div className="pl-step-top">
                <span className="pl-step-n" aria-hidden="true"><small>Step</small>{step.stepNumber}</span>
                <div className="pl-step-t">
                  <h3><span className="sr-only">Step {step.stepNumber}: </span>Completes on {format(stepDate, 'MMM d, yyyy')}</h3>
                  <p><Clock size={13} aria-hidden="true" />{formatTimeUntil(stepDate)}</p>
                </div>
                {stepProgress.avgMonthlyPayment > 0 && (
                  <div className="pl-step-mo">
                    <span className="num">{formatCurrency(stepProgress.avgMonthlyPayment)}</span>
                    <span>/mo this step</span>
                  </div>
                )}
              </div>

              {step.milestonesInStep.map((milestone) => (
                <div key={milestone.debtId} className="pl-paid">
                  <PartyPopper size={22} aria-hidden="true" />
                  <div>
                    <strong>{milestone.debtName} Paid Off!</strong>
                    <span>{format(parseISO(milestone.payoffDate), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))}

              {(debtGettingExtra || step.debtsPayingMinimum.length > 0) && (
                <div className="pl-tags">
                  {debtGettingExtra && (
                    <div className="pl-tag">
                      <span className="rui-badge focus"><Sparkles size={13} aria-hidden="true" />Extra Payment</span>
                      <span>→ {debtGettingExtra.name}</span>
                    </div>
                  )}
                  {step.debtsPayingMinimum.length > 0 && (
                    <div className="pl-tag min">
                      <span className="rui-badge soon">Minimum</span>
                      <span>
                        {step.debtsPayingMinimum.length} account{step.debtsPayingMinimum.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="pl-prog">
                <div className="pl-prog-row">
                  <span>Paid this step</span>
                  <span className="num">{formatCurrency(stepProgress.paidThisStep)}</span>
                </div>
                {stepProgress.stepPrincipal > 0 && (
                  <p className="pl-split">
                    {formatCurrency(stepProgress.stepPrincipal)} principal · <b>{formatCurrency(stepProgress.stepInterest)}</b> interest
                  </p>
                )}
                <span className="pl-track" role="img" aria-label={`${Math.round(Math.min(100, stepPaydownPercent))}% of this step's balance paid`}>
                  <i style={{ width: `${Math.min(100, stepPaydownPercent)}%` }} />
                </span>
                <div className="pl-prog-foot">
                  <span><b>{formatCurrency(stepProgress.endingBalance)}</b> remaining</span>
                  <span className="j"><Sparkles size={13} aria-hidden="true" />{stepProgress.percentComplete.toFixed(0)}% of journey</span>
                </div>
                {stepProgress.monthCount > 0 && (
                  <p className="pl-dur">
                    {stepProgress.monthCount} month{stepProgress.monthCount !== 1 ? 's' : ''} in this step
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
