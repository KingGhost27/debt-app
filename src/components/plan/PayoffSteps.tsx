/**
 * Payoff Steps Component
 *
 * Displays the step-by-step payoff timeline with collapsible monthly details.
 */

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, Calendar } from 'lucide-react';
import { formatTimeUntil, formatCurrency } from '../../lib/calculations';
import type { PayoffPlan, PayoffStep, MonthlyPayment, Debt } from '../../types';

interface PayoffStepsProps {
  plan: PayoffPlan;
  sortedDebts: Debt[];
}

/**
 * Get the months that belong to a specific step based on date ranges
 */
function getMonthsForStep(
  stepIndex: number,
  steps: PayoffStep[],
  monthlyBreakdown: MonthlyPayment[]
): MonthlyPayment[] {
  if (monthlyBreakdown.length === 0) return [];

  const currentStep = steps[stepIndex];
  const previousStep = stepIndex > 0 ? steps[stepIndex - 1] : null;

  // Step starts after previous step's completion month (or from beginning)
  const stepStartMonth = previousStep
    ? format(parseISO(previousStep.completionDate), 'yyyy-MM')
    : monthlyBreakdown[0]?.month;

  // Step ends at its completion month
  const stepEndMonth = format(parseISO(currentStep.completionDate), 'yyyy-MM');

  // Filter months: after previous step's end month, up to and including this step's end month
  return monthlyBreakdown.filter(m => {
    if (previousStep) {
      return m.month > stepStartMonth && m.month <= stepEndMonth;
    }
    return m.month <= stepEndMonth;
  });
}

export function PayoffSteps({ plan, sortedDebts }: PayoffStepsProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  // Pre-compute months for each step
  const stepMonthsMap = useMemo(() => {
    const map = new Map<number, MonthlyPayment[]>();
    plan.steps.forEach((step, index) => {
      map.set(step.stepNumber, getMonthsForStep(index, plan.steps, plan.monthlyBreakdown));
    });
    return map;
  }, [plan.steps, plan.monthlyBreakdown]);
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
          const stepMonths = stepMonthsMap.get(step.stepNumber) || [];

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

                {/* Collapsible Monthly Details */}
                {stepMonths.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleStep(step.stepNumber)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span>
                          {stepMonths.length} month{stepMonths.length !== 1 ? 's' : ''} · {formatCurrency(stepMonths.reduce((sum, m) => sum + m.totalPayment, 0))} total
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform duration-200 ${
                          expandedSteps.has(step.stepNumber) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Expanded Monthly Details */}
                    {expandedSteps.has(step.stepNumber) && (
                      <div className="mt-3 space-y-3">
                        {stepMonths.map((month) => {
                          const monthDate = parseISO(`${month.month}-01`);
                          return (
                            <div key={month.month} className="bg-gray-100 rounded-xl overflow-hidden">
                              {/* Month Header */}
                              <div className="flex justify-between items-center px-4 py-2 bg-gray-200">
                                <span className="font-medium text-sm text-gray-800">
                                  {format(monthDate, 'MMMM yyyy')}
                                </span>
                                <span className="text-sm font-semibold text-gray-700">
                                  {formatCurrency(month.totalPayment)}
                                </span>
                              </div>

                              {/* Payment Rows */}
                              <div className="divide-y divide-gray-200">
                                {month.payments.map((payment) => (
                                  <div key={payment.debtId} className="p-3 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">{payment.debtName}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          payment.type === 'extra'
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {payment.type === 'extra' ? 'Extra' : 'Min'}
                                        </span>
                                      </div>
                                      <span className="font-semibold text-sm">{formatCurrency(payment.amount)}</span>
                                    </div>

                                    {/* Principal/Interest/Balance breakdown */}
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <span className="text-gray-500">Principal</span>
                                        <span className="block text-gray-900 font-medium">{formatCurrency(payment.principal)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Interest</span>
                                        <span className="block text-red-500 font-medium">{formatCurrency(payment.interest)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Balance</span>
                                        <span className="block text-gray-900 font-medium">{formatCurrency(payment.remainingBalance)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
