/**
 * Plan Page
 *
 * Unified page for viewing the payoff plan with budget controls.
 * Layout: Plan-first with budget sidebar (always visible).
 */

import { useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import { Trophy, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { PlanSummary, PayoffSteps, BudgetSidebar } from '../components/plan';
import {
  generatePayoffPlan,
  sortDebtsByStrategy,
  calculateTotalMonthlyIncome,
} from '../lib/calculations';
import type { PayoffStrategy } from '../types';

export function PlanPage() {
  const { debts, strategy, budget, updateStrategy, updateBudget } = useApp();

  // Generate both plans for comparison
  const avalanchePlan = useMemo(
    () => generatePayoffPlan(debts, { ...strategy, strategy: 'avalanche' }),
    [debts, strategy.recurringFunding, strategy.oneTimeFundings]
  );

  const snowballPlan = useMemo(
    () => generatePayoffPlan(debts, { ...strategy, strategy: 'snowball' }),
    [debts, strategy.recurringFunding, strategy.oneTimeFundings]
  );

  // Use the selected strategy's plan for the step-by-step view
  const plan = strategy.strategy === 'avalanche' ? avalanchePlan : snowballPlan;

  const sortedDebts = useMemo(
    () => sortDebtsByStrategy(debts, strategy.strategy),
    [debts, strategy.strategy]
  );

  const totalMonthlyIncome = useMemo(
    () => calculateTotalMonthlyIncome(budget.incomeSources),
    [budget.incomeSources]
  );

  const totalMinimums = useMemo(
    () => debts.reduce((sum, d) => sum + d.minimumPayment, 0),
    [debts]
  );

  const debtFreeDate = plan.debtFreeDate ? parseISO(plan.debtFreeDate) : null;

  const handleStrategyChange = (newStrategy: PayoffStrategy) => {
    updateStrategy({ strategy: newStrategy });
  };

  const handleExpenseChange = (value: string) => {
    updateBudget({ monthlyExpenses: parseFloat(value) || 0 });
  };

  const handleAllocationChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    updateBudget({ debtAllocationAmount: amount });
    updateStrategy({
      recurringFunding: { ...strategy.recurringFunding, amount },
    });
  };

  const handleExtraChange = (value: string) => {
    const extra = parseFloat(value) || 0;
    const total = totalMinimums + extra;
    updateBudget({ debtAllocationAmount: total });
    updateStrategy({
      recurringFunding: { ...strategy.recurringFunding, amount: total },
    });
  };

  // No debts empty state
  if (debts.length === 0) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Payoff Plan" subtitle="Your debt-free roadmap" />
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

  // No funding set - show setup prompt
  if (strategy.recurringFunding.amount === 0) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Payoff Plan" subtitle="Your debt-free roadmap" />
        <div className="px-4 py-6">
          {/* Setup prompt */}
          <div className="card text-center py-6 mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign size={32} className="text-amber-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Set Your Monthly Payment</h3>
            <p className="text-sm text-gray-500 mb-4">
              Configure your income and set how much you can put toward debt each month.
            </p>
          </div>

          {/* Budget sidebar for setup */}
          <BudgetSidebar
            budget={budget}
            strategy={strategy}
            totalMonthlyIncome={totalMonthlyIncome}
            totalMinimums={totalMinimums}
            onExpenseChange={handleExpenseChange}
            onAllocationChange={handleAllocationChange}
            onExtraChange={handleExtraChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Payoff Plan" subtitle="Your debt-free roadmap" />

      <div className="px-4 py-6">
        {/* Plan Summary with comparison - always at top */}
        <div className="mb-6">
          <PlanSummary
            avalanchePlan={avalanchePlan}
            snowballPlan={snowballPlan}
            strategy={strategy.strategy}
            onStrategyChange={handleStrategyChange}
          />
        </div>

        {/* Main content: Plan + Budget sidebar */}
        {/* On mobile: stacked (plan first, then budget) */}
        {/* On desktop: side-by-side grid */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Main plan content - takes 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step-by-step Plan */}
            <PayoffSteps plan={plan} sortedDebts={sortedDebts} />

            {/* Debt-free celebration */}
            {debtFreeDate && (
              <div className="card bg-gradient-to-br from-green-50 to-primary-50 border-green-200">
                <div className="text-center py-4">
                  <span className="text-4xl mb-2 block">🎊</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Debt-Free!</h3>
                  <p className="text-gray-600">{format(debtFreeDate, 'MMMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Budget sidebar - takes 1 column on desktop */}
          {/* On mobile, this appears after the plan */}
          <div className="mt-6 lg:mt-0">
            <BudgetSidebar
              budget={budget}
              strategy={strategy}
              totalMonthlyIncome={totalMonthlyIncome}
              totalMinimums={totalMinimums}
              onExpenseChange={handleExpenseChange}
              onAllocationChange={handleAllocationChange}
              onExtraChange={handleExtraChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
