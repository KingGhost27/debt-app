/**
 * Plan Page - the ranch.
 *
 * The payoff plan with its budget controls. The debt-free countdown leads,
 * then the strategy comparison; below, what-if and the step-by-step plan sit
 * beside the budget (on phones the budget folds above the steps, closed).
 * Ranch cards, planks and badges throughout; plan.css reads only --ranch-* tokens.
 */

import { useMemo, useRef, useState } from 'react';
import { parseISO, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Trophy, DollarSign, Clock, PartyPopper, ChevronDown, X, Coins, TriangleAlert, Plus } from 'lucide-react';
import { formatTimeUntil, formatCurrency } from '../lib/calculations';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { PlanSummary, PayoffSteps, BudgetSidebar, WhatIfScenario } from '../components/plan';
import './plan.css';
import {
  generatePayoffPlan,
  sortDebtsByStrategy,
  calculateTotalMonthlyIncome,
} from '../lib/calculations';
import type { PayoffPlan, PayoffStrategy } from '../types';

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
  const showStalledPlanWarning = plan.neverPaysOff && plan.stalledDebts.length > 0;
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
      <div className="pl animate-page-enter">
        <PageHeader title="Payoff Plan" subtitle="Your debt-free roadmap" />
        <div className="pl-emptywrap">
          <div className="rui-card pl-emptycard">
            <span className="big"><Trophy size={38} aria-hidden="true" /></span>
            <h2>No Debts to Plan</h2>
            <p>Add your debts to see your personalized payoff plan.</p>
            <Link to="/debts" className="pl-btn">
              <Plus size={18} aria-hidden="true" />
              Add Debts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stalled = showStalledPlanWarning ? <StalledPlanWarning stalledDebts={plan.stalledDebts} /> : null;

  return (
    <div className="pl animate-page-enter">
      <PageHeader title="Payoff Plan" subtitle="Your debt-free roadmap" />

      <div className="pl-body">
        {/* Debt-Free Countdown leads */}
        {stalled ? (
          stalled
        ) : debtFreeDate ? (
          <section className="rui-card pl-hero" aria-label="Debt-free countdown">
            <div className="pl-hero-main">
              <span className="pl-chip"><Clock size={20} aria-hidden="true" /></span>
              <div>
                <p className="pl-hero-t">{formatTimeUntil(debtFreeDate)}</p>
                <p className="pl-hero-d">{format(debtFreeDate, 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="pl-hero-r">
              <span className="num">{formatCurrency(plan.totalInterest)}</span>
              <span>in interest</span>
            </div>
          </section>
        ) : null}

        {/* Plan Summary with comparison */}
        <PlanSummary
          avalanchePlan={avalanchePlan}
          snowballPlan={snowballPlan}
          strategy={strategy.strategy}
          onStrategyChange={handleStrategyChange}
        />

        {/* Soft nudge when no extra payment is set yet */}
        {isMinimumOnly && (
          <div className="pl-nudge">
            <span className="pl-chip"><Coins size={20} aria-hidden="true" /></span>
            <div>
              <strong>Minimums-only plan</strong>
              <span>Add extra payment below to pay off faster</span>
            </div>
            <button type="button" onClick={() => setExtraModalOpen(true)} className="pl-link">
              Set up →
            </button>
          </div>
        )}

        {/* Mobile: the budget folds in first (configure, then see the result). Desktop: plan left, budget right. */}
        <div className="pl-grid">
          <div ref={budgetRef} className="pl-side">
            <button
              type="button"
              onClick={() => setBudgetOpen((v) => !v)}
              aria-expanded={budgetOpen}
              aria-controls="pl-budget"
              className="rui-card pl-toggle"
            >
              <span>Budget &amp; Income</span>
              <ChevronDown size={20} aria-hidden="true" />
            </button>
            <div id="pl-budget" className={`pl-side-body${budgetOpen ? ' is-open' : ''}`}>
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

          <div className="pl-main">
            <WhatIfScenario debts={debts} strategy={strategy} />

            <PayoffSteps plan={plan} sortedDebts={sortedDebts} />

            {/* Debt-free celebration */}
            {stalled ? (
              <StalledPlanWarning stalledDebts={plan.stalledDebts} />
            ) : debtFreeDate ? (
              <section className="rui-card pl-finish">
                <span className="big"><PartyPopper size={32} aria-hidden="true" /></span>
                <h3>Debt-Free!</h3>
                <p>{format(debtFreeDate, 'MMMM d, yyyy')}</p>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {/* Extra Payment Quick-Setup Modal */}
      {extraModalOpen && (
        <div className="pl-scrim" onClick={() => setExtraModalOpen(false)}>
          <div
            className="rui-card pl-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pl-extra-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') setExtraModalOpen(false); }}
          >
            <button type="button" onClick={() => setExtraModalOpen(false)} className="pl-icon-btn pl-x" aria-label="Close">
              <X size={18} aria-hidden="true" />
            </button>

            <div className="pl-dialog-h">
              <span className="pl-chip"><DollarSign size={20} aria-hidden="true" /></span>
              <div>
                <h3 id="pl-extra-title">Extra Payment</h3>
                <p>Added on top of your minimums each month</p>
              </div>
            </div>

            <div className="pl-field">
              <span className="pl-cur" aria-hidden="true">$</span>
              <input
                type="number"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleExtraModalSave(); }}
                placeholder="0.00"
                step="0.01"
                min="0"
                autoFocus
                className="pl-input strong"
                aria-label="Extra payment per month"
              />
            </div>
            <p className="pl-help">Minimums ({formatCurrency(totalMinimums)}/mo) are already included</p>

            <div className="pl-dialog-act">
              <button type="button" onClick={() => setExtraModalOpen(false)} className="pl-ghost">Cancel</button>
              <button type="button" onClick={handleExtraModalSave} className="pl-btn">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StalledPlanWarning({
  stalledDebts,
}: {
  stalledDebts: PayoffPlan['stalledDebts'];
}) {
  const rankedDebts = [...stalledDebts].sort((a, b) => b.minimumNeeded - a.minimumNeeded);

  return (
    <div role="alert" className="rui-card pl-warn">
      <span className="pl-chip"><TriangleAlert size={20} aria-hidden="true" /></span>
      <div style={{ minWidth: 0 }}>
        <strong>This payment plan never pays off.</strong>
        {rankedDebts.map((debt) => (
          <p key={debt.debtId}>
            <b>{debt.debtName}</b> charges <b>{formatCurrency(debt.minimumNeeded)}/mo</b> in interest alone — you have to pay more than that before the balance moves at all.
          </p>
        ))}
      </div>
    </div>
  );
}
