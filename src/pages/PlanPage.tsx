/**
 * Plan Page - Kawaii Edition
 *
 * Unified page for viewing the payoff plan with budget controls.
 * Layout: Plan-first with budget sidebar (always visible).
 * Features cute animations, soft gradients, and delightful interactions.
 */

import { useMemo, useRef, useState } from 'react';
import { parseISO, format } from 'date-fns';
import { Trophy, DollarSign, Clock, Sparkles, PartyPopper, ChevronDown, X } from 'lucide-react';
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

  const totalMonthlyIncome = useMemo(
    () => calculateTotalMonthlyIncome(budget.incomeSources),
    [budget.incomeSources]
  );

  const totalMinimums = useMemo(
    () => debts.reduce((sum, d) => sum + d.minimumPayment, 0),
    [debts]
  );

  // Always show a plan — floor funding at minimums so the page is never blank.
  // isMinimumOnly drives the nudge banner.
  const isMinimumOnly = strategy.recurringFunding.amount === 0;

  // Generate both plans for comparison, using at least the minimum payments
  const avalanchePlan = useMemo(() => {
    const effectiveAmount = Math.max(totalMinimums, strategy.recurringFunding.amount);
    return generatePayoffPlan(debts, {
      ...strategy,
      strategy: 'avalanche',
      recurringFunding: { ...strategy.recurringFunding, amount: effectiveAmount },
    });
  }, [debts, strategy.recurringFunding, strategy.oneTimeFundings, totalMinimums]);

  const snowballPlan = useMemo(() => {
    const effectiveAmount = Math.max(totalMinimums, strategy.recurringFunding.amount);
    return generatePayoffPlan(debts, {
      ...strategy,
      strategy: 'snowball',
      recurringFunding: { ...strategy.recurringFunding, amount: effectiveAmount },
    });
  }, [debts, strategy.recurringFunding, strategy.oneTimeFundings, totalMinimums]);

  // Use the selected strategy's plan for the step-by-step view
  const plan = strategy.strategy === 'avalanche' ? avalanchePlan : snowballPlan;

  const sortedDebts = useMemo(
    () => sortDebtsByStrategy(debts, strategy.strategy),
    [debts, strategy.strategy]
  );

  const debtFreeDate = plan.debtFreeDate ? parseISO(plan.debtFreeDate) : null;
  const [budgetOpen, setBudgetOpen] = useState(false);
  const budgetRef = useRef<HTMLDivElement>(null);
  const [extraModalOpen, setExtraModalOpen] = useState(false);
  const [extraInput, setExtraInput] = useState('');

  const handleExtraModalSave = () => {
    if (extraInput) handleExtraChange(extraInput);
    setExtraModalOpen(false);
    setExtraInput('');
  };

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

        {/* Soft nudge when no extra payment is set yet */}
        {isMinimumOnly && (
          <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-3xl px-4 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-300/30">
              <DollarSign size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Minimums-only plan</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Add extra payment below to pay off faster</p>
            </div>
            <button
              onClick={() => setExtraModalOpen(true)}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 transition-colors flex-shrink-0"
            >
              Set up →
            </button>
          </div>
        )}

        {/* Debt-Free Countdown */}
        {debtFreeDate && (
          <div className="card bg-gradient-to-r from-primary-600 to-primary-500 text-white mb-6 rounded-3xl shadow-lg shadow-primary-400/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Clock size={18} className="text-primary-200 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-lg leading-tight truncate">{formatTimeUntil(debtFreeDate)}</p>
                <p className="text-primary-200 text-xs">{format(debtFreeDate, 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-base">{formatCurrency(plan.totalInterest)}</p>
              <p className="text-primary-200 text-xs">in interest</p>
            </div>
          </div>
        )}

        {/* Main content: Budget sidebar + Plan steps */}
        {/* Mobile: Budget toggle first (configure → see result flow), then steps */}
        {/* Desktop: 3-col grid — steps on left (col-span-2), sidebar on right */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">

          {/* Budget sidebar — DOM-first so it's above steps on mobile */}
          {/* lg:order-last keeps it visually on the right on desktop */}
          <div ref={budgetRef} className="lg:col-span-1 lg:order-last mb-6 lg:mb-0">
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

          {/* Main plan content - takes 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* What-If Scenario Tool */}
            <WhatIfScenario debts={debts} strategy={strategy} />

            {/* Step-by-step Plan */}
            <PayoffSteps plan={plan} sortedDebts={sortedDebts} />

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
        </div>
      </div>

      {/* Extra Payment Quick-Setup Modal */}
      {extraModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setExtraModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 animate-kawaii-bounce"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setExtraModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Icon + title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-300/30">
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Extra Payment</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Added on top of your minimums each month
                </p>
              </div>
            </div>

            {/* Input */}
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
              <input
                type="number"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleExtraModalSave(); }}
                placeholder="0.00"
                step="0.01"
                min="0"
                autoFocus
                className="w-full pl-8 pr-4 py-3 border-2 border-primary-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-xl text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-700"
              />
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Minimums ({formatCurrency(totalMinimums)}/mo) are already included
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setExtraModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtraModalSave}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/30 hover:from-primary-600 hover:to-primary-700 transition-all hover:scale-105 active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
