/**
 * Plan Page
 *
 * Shows the step-by-step payoff plan based on current debts and strategy.
 */

import { useMemo, useState, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { Trophy, TrendingDown, DollarSign, Pencil, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import {
  generatePayoffPlan,
  formatCurrency,
  formatTimeUntil,
  sortDebtsByStrategy,
} from '../lib/calculations';

export function PlanPage() {
  const { debts, strategy, updateStrategy } = useApp();
  const [isEditingFunding, setIsEditingFunding] = useState(false);
  const [fundingInput, setFundingInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const plan = useMemo(
    () => generatePayoffPlan(debts, strategy),
    [debts, strategy]
  );

  const sortedDebts = useMemo(
    () => sortDebtsByStrategy(debts, strategy.strategy),
    [debts, strategy.strategy]
  );

  const debtFreeDate = plan.debtFreeDate ? parseISO(plan.debtFreeDate) : null;

  if (debts.length === 0) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Payoff Plan" subtitle="The step-by-step plan to your debt-free future" />
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={40} className="text-primary-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Debts to Plan</h2>
          <p className="text-gray-600 mb-6">
            Add your debts to see your personalized payoff plan.
          </p>
          <a
            href="/debts"
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            Add Debts
          </a>
        </div>
      </div>
    );
  }

  if (strategy.recurringFunding.amount === 0) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Payoff Plan" subtitle="The step-by-step plan to your debt-free future" />
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign size={40} className="text-warning-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Set Your Budget</h2>
          <p className="text-gray-600 mb-6">
            Configure your monthly funding amount to generate a payoff plan.
          </p>
          <a
            href="/strategy"
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            Set Strategy
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Payoff Plan" subtitle="The step-by-step plan to your debt-free future" />

      <div className="px-4 py-6 space-y-6">
        {/* Monthly Contribution */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Extra monthly contribution</p>
              {isEditingFunding ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = parseFloat(fundingInput) || 0;
                    updateStrategy({
                      recurringFunding: { ...strategy.recurringFunding, amount: val },
                    });
                    setIsEditingFunding(false);
                  }}
                  className="flex items-center gap-2 mt-1"
                >
                  <span className="text-lg font-bold">$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={fundingInput}
                    onChange={(e) => setFundingInput(e.target.value)}
                    className="w-28 text-lg font-bold border-b-2 border-primary-500 outline-none bg-transparent"
                    autoFocus
                  />
                  <button type="submit" className="p-1 text-green-600 hover:text-green-800">
                    <Check size={20} />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold">{formatCurrency(strategy.recurringFunding.amount)}</span>
                  <button
                    onClick={() => {
                      setFundingInput(String(strategy.recurringFunding.amount || ''));
                      setIsEditingFunding(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Strategy</p>
              <p className="text-sm font-semibold mt-1 capitalize">{strategy.strategy}</p>
            </div>
          </div>
        </div>

        {/* Plan Summary */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Plan summary</h2>

          <div className="grid grid-cols-3 gap-4">
            {/* Payoff */}
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy size={20} className="text-primary-600" />
              </div>
              <p className="text-xs text-gray-500">Payoff</p>
              <p className="font-semibold text-sm">
                {debtFreeDate ? formatTimeUntil(debtFreeDate) : 'N/A'}
              </p>
            </div>

            {/* Interest */}
            <div className="text-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingDown size={20} className="text-red-600" />
              </div>
              <p className="text-xs text-gray-500">Total Interest</p>
              <p className="font-semibold text-sm text-red-600">
                {formatCurrency(plan.totalInterest)}
              </p>
            </div>

            {/* Payments */}
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <p className="text-xs text-gray-500">Total Payments</p>
              <p className="font-semibold text-sm">
                {formatCurrency(plan.totalPayments)}
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-step Plan */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Step-by-step payoff plan</h2>

          <div className="space-y-4">
            {plan.steps.map((step, index) => {
              const isLastStep = index === plan.steps.length - 1;
              const stepDate = parseISO(step.completionDate);
              const debtGettingExtra = sortedDebts.find(
                (d) => d.id === step.debtReceivingExtra
              );

              return (
                <div key={step.stepNumber} className="relative">
                  {/* Timeline connector */}
                  {!isLastStep && (
                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  <div className="card">
                    {/* Step Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold ${
                          isLastStep ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                      >
                        <span className="text-xs">STEP</span>
                        <span>{step.stepNumber}</span>
                      </div>
                      <div className="flex-1">
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
                            {milestone.debtName} Payoff
                          </p>
                          <p className="text-sm text-green-600">
                            {format(parseISO(milestone.payoffDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Extra payments info */}
                    {debtGettingExtra && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          Extra
                        </span>
                        <span>→ {debtGettingExtra.name}</span>
                      </div>
                    )}

                    {/* Accounts on minimum */}
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

        {/* Debt-free celebration */}
        {isLastStep && debtFreeDate && (
          <div className="card bg-gradient-to-br from-green-50 to-primary-50 border-green-200">
            <div className="text-center py-4">
              <span className="text-4xl mb-2 block">🎊</span>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Debt-Free!</h3>
              <p className="text-gray-600">
                {format(debtFreeDate, 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to check if last step
const isLastStep = false; // This gets set dynamically in the map
