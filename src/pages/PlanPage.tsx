/**
 * Plan Page - Kawaii Edition
 *
 * Unified page for viewing the payoff plan with budget controls.
 * Layout: Plan-first with budget sidebar (always visible).
 * Features cute animations, soft gradients, and delightful interactions.
 */

import { useMemo, useState } from 'react';
import { parseISO, format } from 'date-fns';
import { Trophy, DollarSign, Clock, Sparkles, Calendar, PartyPopper, ChevronDown } from 'lucide-react';
import { formatTimeUntil, formatCurrency } from '../lib/calculations';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { PlanSummary, PayoffSteps, BudgetSidebar, WhatIfScenario } from '../components/plan';
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
  const [budgetOpen, setBudgetOpen] = useState(false);

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
      <div className="min-h-screen bg-gray-50 animate-page-enter">
        <PageHeader title="Payoff Plan" subtitle="Your debt-free roadmap" emoji="📋" />
        <div className="px-4 py-12 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl rotate-6 opacity-20" />
            <div className="relative w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 rounded-3xl flex items-center justify-center shadow-lg">
              <Trophy size={40} className="text-primary-500" />
            </div>
            <Sparkles size={16} className="absolute -top-2 -right-2 text-primary-400 animate-kawaii-pulse" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Debts to Plan</h2>
          <p className="text-gray-600 mb-6">
            Add your debts to see your personalized payoff plan.
          </p>
          <a
            href="/debts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:scale-105 active:scale-95"
          >
            <Sparkles size={18} />
            Add Debts
          </a>
        </div>
      </div>
    );
  }

  // No funding set - show setup prompt
  if (strategy.recurringFunding.amount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 animate-page-enter">
        <PageHeader title="Payoff Plan" subtitle="Your debt-free roadmap" emoji="📋" />
        <div className="px-4 py-6">
          {/* Setup prompt */}
          <div className="card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border border-amber-100 text-center py-8 mb-6 rounded-3xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Sparkles size={14} className="absolute top-4 left-8 text-amber-300 animate-kawaii-pulse" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-300/40">
                <DollarSign size={36} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Set Your Monthly Payment</h3>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">
                Configure your income and set how much you can put toward debt each month.
              </p>
            </div>
          </div>

          {/* Budget sidebar for setup */}
          <BudgetSidebar
            budget={budget}
            strategy={strategy}
            totalMonthlyIncome={totalMonthlyIncome}
            totalMinimums={totalMinimums}
            onExpenseChange={handleExpenseChange}
            onBudgetChange={updateBudget}
            onAllocationChange={handleAllocationChange}
            onExtraChange={handleExtraChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-page-enter">
      <PageHeader title="Payoff Plan" subtitle="Your debt-free roadmap" emoji="📋" />

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

        {/* Debt-Free Countdown */}
        {debtFreeDate && (
          <div className="relative card bg-gradient-to-r from-primary-600 to-primary-500 text-white mb-6 rounded-3xl overflow-hidden shadow-lg shadow-primary-400/30">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <Sparkles size={16} className="absolute top-4 right-16 text-white/30 animate-kawaii-pulse" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Clock size={26} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={14} className="text-primary-200" />
                  <p className="text-primary-200 text-xs font-semibold tracking-wider uppercase">Debt-Free Countdown</p>
                </div>
                <p className="text-2xl font-bold">{formatTimeUntil(debtFreeDate)}</p>
                <p className="text-primary-200 text-sm flex items-center gap-1">
                  <Sparkles size={12} className="animate-kawaii-pulse" />
                  {format(debtFreeDate, 'MMMM d, yyyy')}
                </p>
              </div>
              <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                <p className="text-primary-200 text-xs font-medium">Total Interest</p>
                <p className="text-xl font-bold">{formatCurrency(plan.totalInterest)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main content: Plan + Budget sidebar */}
        {/* On mobile: stacked (plan first, then budget) */}
        {/* On desktop: side-by-side grid */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Main plan content - takes 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step-by-step Plan */}
            <PayoffSteps plan={plan} sortedDebts={sortedDebts} />

            {/* What-If Scenario Tool */}
            <WhatIfScenario debts={debts} strategy={strategy} />

            {/* Debt-free celebration */}
            {debtFreeDate && (
              <div className="card bg-gradient-to-br from-green-50 to-primary-50 dark:from-green-900/30 dark:to-primary-900/20 border border-green-200 rounded-3xl relative overflow-hidden">
                {/* Decorative sparkles */}
                <Sparkles size={14} className="absolute top-4 right-6 text-green-300 animate-kawaii-pulse" />
                <Sparkles size={10} className="absolute bottom-6 left-8 text-primary-300 animate-kawaii-pulse" style={{ animationDelay: '0.3s' }} />

                <div className="text-center py-6 relative z-10">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-300/40">
                    <PartyPopper size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                    <span className="animate-kawaii-bounce">🎊</span>
                    Debt-Free!
                    <span className="animate-kawaii-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
                  </h3>
                  <p className="text-gray-600">{format(debtFreeDate, 'MMMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Budget sidebar - takes 1 column on desktop */}
          {/* On mobile: collapsible toggle; on desktop: always visible sidebar */}
          <div className="mt-6 lg:mt-0">
            {/* Mobile toggle header — hidden on lg+ */}
            <button
              type="button"
              onClick={() => setBudgetOpen((v) => !v)}
              className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-primary-100 shadow-sm mb-3"
            >
              <span className="font-semibold text-gray-700 text-sm">Budget & Income</span>
              <ChevronDown
                size={18}
                className={`text-primary-400 transition-transform duration-200 ${budgetOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Content: always visible on desktop, toggled on mobile */}
            <div className={`lg:block ${budgetOpen ? 'block' : 'hidden'}`}>
              <BudgetSidebar
                budget={budget}
                strategy={strategy}
                totalMonthlyIncome={totalMonthlyIncome}
                totalMinimums={totalMinimums}
                onExpenseChange={handleExpenseChange}
                onBudgetChange={updateBudget}
                onAllocationChange={handleAllocationChange}
                onExtraChange={handleExtraChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
