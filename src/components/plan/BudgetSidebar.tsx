/**
 * Budget Sidebar - ranch edition.
 *
 * Income, monthly expenses, the debt-payment calculator and windfalls, each on
 * a ranch card. Always visible on desktop (the Plan page folds it on phones).
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, DollarSign, Gift, Calendar, ChevronDown, Lock, Wallet, Calculator } from 'lucide-react';
import { Plank } from '../dashboard/RanchPanels';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { ExpenseTracker } from '../ui/ExpenseTracker';
import { format, parseISO } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { IncomeSourceModal } from '../ui/IncomeSourceModal';
import { OneTimeFundingModal } from '../ui/OneTimeFundingModal';
import { UpgradeModal } from '../ui/UpgradeModal';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { FREE_LIMITS } from '../../lib/tierLimits';
import {
  formatCurrency,
  calculateNetMonthlyIncome,
  calculateGrossMonthlyIncome,
} from '../../lib/calculations';
import type { IncomeSource, BudgetSettings, StrategySettings, OneTimeFunding } from '../../types';

const PAY_FREQUENCY_SHORT: Record<string, string> = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  'semi-monthly': '2x/month',
  monthly: 'Monthly',
};

interface BudgetSidebarProps {
  budget: BudgetSettings;
  strategy: StrategySettings;
  totalMonthlyIncome: number;
  totalMinimums: number;
  onExpenseChange: (value: string) => void;
  onBudgetChange?: (updates: Partial<BudgetSettings>) => void;
  onAllocationChange?: (value: string) => void; // kept for compatibility
  onExtraChange: (value: string) => void;
}

export function BudgetSidebar({
  budget,
  strategy,
  totalMonthlyIncome,
  totalMinimums,
  onExpenseChange,
  onBudgetChange,
  onExtraChange,
}: BudgetSidebarProps) {
  const { deleteIncomeSource, addOneTimeFunding, updateOneTimeFunding, deleteOneTimeFunding } = useApp();
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [editingFunding, setEditingFunding] = useState<OneTimeFunding | null>(null);
  const [windfallsOpen, setWindfallsOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();
  const { canAddIncomeSource, isPro } = useFeatureGate();

  const handleAddIncomeClick = () => {
    if (!canAddIncomeSource) {
      setShowUpgrade(true);
      return;
    }
    setIsIncomeModalOpen(true);
  };

  const availableForDebt = Math.max(0, totalMonthlyIncome - budget.monthlyExpenses);

  // Calculate total upcoming fundings
  const totalUpcomingFundings = strategy.oneTimeFundings
    .filter((f) => !f.isApplied)
    .reduce((sum, f) => sum + f.amount, 0);

  const handleEditSource = (source: IncomeSource) => {
    setEditingSource(source);
    setIsIncomeModalOpen(true);
  };

  const handleDeleteSource = (source: IncomeSource) => {
    confirm({
      title: 'Delete Income Source',
      message: `Are you sure you want to delete "${source.name}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteIncomeSource(source.id),
    });
  };

  const handleCloseModal = () => {
    setIsIncomeModalOpen(false);
    setEditingSource(null);
  };

  const handleEditFunding = (funding: OneTimeFunding) => {
    setEditingFunding(funding);
    setIsFundingModalOpen(true);
  };

  const handleDeleteFunding = (funding: OneTimeFunding) => {
    confirm({
      title: 'Delete Funding',
      message: `Are you sure you want to delete "${funding.name}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteOneTimeFunding(funding.id),
    });
  };

  const handleCloseFundingModal = () => {
    setIsFundingModalOpen(false);
    setEditingFunding(null);
  };

  const handleSaveFunding = (fundingData: Omit<OneTimeFunding, 'id' | 'isApplied'>) => {
    addOneTimeFunding(fundingData);
  };

  const upcomingCount = strategy.oneTimeFundings.filter((f) => !f.isApplied).length;

  return (
    <div className="pl-stack">
      {/* Income Summary */}
      <section className="rui-card pl-b">
        <div className="pl-b-h">
          <Plank icon={<Wallet size={18} aria-hidden="true" />}>Income</Plank>
          <button
            type="button"
            onClick={handleAddIncomeClick}
            className="pl-link"
            title={
              !canAddIncomeSource
                ? `Free plan is limited to ${FREE_LIMITS.INCOME_SOURCES} income sources`
                : 'Add an income source'
            }
          >
            {!isPro && !canAddIncomeSource ? <Lock size={15} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
            Add
          </button>
        </div>

        {budget.incomeSources.length === 0 ? (
          <div className="pl-none">
            <p>No income sources yet</p>
            <button type="button" onClick={handleAddIncomeClick} className="pl-btn">
              <Plus size={18} aria-hidden="true" />
              Add Income
            </button>
          </div>
        ) : (
          <div className="pl-rows">
            {budget.incomeSources.map((source) => {
              const netAmount = calculateNetMonthlyIncome(source);
              const grossAmount = calculateGrossMonthlyIncome(source);
              const hasDeductions = netAmount < grossAmount;

              return (
                <div key={source.id} className="pl-src">
                  <div className="pl-src-t">
                    <b>
                      <span>{source.name}</span>
                      <small>{PAY_FREQUENCY_SHORT[source.payFrequency]}</small>
                    </b>
                    <p>
                      <b className="num">{formatCurrency(netAmount)}/mo</b>
                      {hasDeductions && <> (gross: {formatCurrency(grossAmount)})</>}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleEditSource(source)} className="pl-icon-btn" aria-label={`Edit ${source.name}`}>
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => handleDeleteSource(source)} className="pl-icon-btn danger" aria-label={`Delete ${source.name}`}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              );
            })}

            <div className="pl-total">
              <span>Total Take-Home</span>
              <span className="num">{formatCurrency(totalMonthlyIncome)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Monthly Expenses */}
      {onBudgetChange ? (
        <ExpenseTracker budget={budget} onBudgetChange={onBudgetChange} />
      ) : (
        <section className="rui-card pl-b">
          <div className="pl-b-h"><Plank>Monthly Expenses</Plank></div>
          <p className="pl-help" style={{ marginTop: 0, marginBottom: 12 }}>Rent, utilities, groceries, etc.</p>
          <div className="pl-field">
            <DollarSign size={17} aria-hidden="true" />
            <input
              type="number"
              value={budget.monthlyExpenses || ''}
              onChange={(e) => onExpenseChange(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="pl-input"
              aria-label="Monthly expenses"
            />
          </div>
        </section>
      )}

      {/* Debt Payment Calculator */}
      <section className="rui-card pl-b">
        <div className="pl-b-h"><Plank icon={<Calculator size={18} aria-hidden="true" />}>Debt Payment</Plank></div>

        {/* What's available */}
        <div className="pl-calc-box">
          <div>
            <span>Income</span>
            <span className="num">{formatCurrency(totalMonthlyIncome)}</span>
          </div>
          <div>
            <span>Expenses</span>
            <span className="num">-{formatCurrency(budget.monthlyExpenses)}</span>
          </div>
          <div>
            <span>Available</span>
            <span className={`num ${availableForDebt > 0 ? 'good' : 'bad'}`}>{formatCurrency(availableForDebt)}</span>
          </div>
        </div>

        {/* Required minimums (not editable) */}
        <div className="pl-min">
          <div>
            <b>Minimum payments</b>
            <span>Required each month</span>
          </div>
          <span className="num" style={{ fontSize: 18 }}>{formatCurrency(totalMinimums)}</span>
        </div>

        {/* Extra payment input (the ONE thing the user controls) */}
        <div>
          <label className="pl-label" htmlFor="pl-extra">Extra payment (accelerates payoff)</label>
          <div className="pl-field">
            <DollarSign size={17} aria-hidden="true" />
            <input
              id="pl-extra"
              type="number"
              value={Math.max(0, budget.debtAllocationAmount - totalMinimums) || ''}
              onChange={(e) => onExtraChange(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="pl-input strong"
            />
          </div>
          <p className="pl-help">This goes to your focus debt each month</p>
        </div>

        {/* Total result */}
        <div className="pl-grand">
          <span>Total monthly payment</span>
          <span className="num">{formatCurrency(budget.debtAllocationAmount || totalMinimums)}</span>
        </div>
      </section>

      {/* Windfalls (one-time fundings), collapsed by default */}
      <section className="rui-card pl-b">
        <button type="button" onClick={() => setWindfallsOpen((v) => !v)} aria-expanded={windfallsOpen} className="pl-wf-btn">
          <span className="l">
            <span className="pl-chip"><Gift size={18} aria-hidden="true" /></span>
            <span>
              <b>Windfalls</b>
              <span>Tax refunds, bonuses, lump sums</span>
            </span>
          </span>
          <span className="r">
            {upcomingCount > 0 && <span className="rui-badge soon">{upcomingCount}</span>}
            <ChevronDown size={18} aria-hidden="true" />
          </span>
        </button>

        {windfallsOpen && (
          <div className="pl-wf-body">
            <div className="pl-b-h">
              <button type="button" onClick={() => setIsFundingModalOpen(true)} className="pl-link">
                <Plus size={17} aria-hidden="true" />
                Add
              </button>
            </div>

            {strategy.oneTimeFundings.length === 0 ? (
              <div className="pl-none">
                <p>No windfalls planned<br />Add tax refunds, bonuses, or unexpected money</p>
              </div>
            ) : (
              <div className="pl-rows">
                {strategy.oneTimeFundings.map((funding) => (
                  <div key={funding.id} className={`pl-src pl-wf${funding.isApplied ? ' is-done' : ''}`}>
                    <div className="pl-src-t">
                      <b>
                        <span>{funding.name}</span>
                        {funding.isApplied && <span className="rui-badge ok">Applied</span>}
                      </b>
                      <div className="pl-wf-meta">
                        <Calendar size={13} aria-hidden="true" />
                        <span>{format(parseISO(funding.date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <span className="num pl-wf-amt">{formatCurrency(funding.amount)}</span>
                    {!funding.isApplied && (
                      <>
                        <button type="button" onClick={() => handleEditFunding(funding)} className="pl-icon-btn" aria-label={`Edit ${funding.name}`}>
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => handleDeleteFunding(funding)} className="pl-icon-btn danger" aria-label={`Delete ${funding.name}`}>
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {totalUpcomingFundings > 0 && (
                  <div className="pl-total">
                    <span>Total upcoming</span>
                    <span className="num">{formatCurrency(totalUpcomingFundings)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Income Source Modal */}
      <IncomeSourceModal isOpen={isIncomeModalOpen} onClose={handleCloseModal} source={editingSource} />

      {/* One-time Funding Modal */}
      <OneTimeFundingModal
        isOpen={isFundingModalOpen}
        onClose={handleCloseFundingModal}
        onSave={handleSaveFunding}
        onUpdate={updateOneTimeFunding}
        funding={editingFunding}
      />

      <ConfirmDialog {...dialogProps} />

      {showUpgrade && <UpgradeModal onDismiss={() => setShowUpgrade(false)} />}
    </div>
  );
}
