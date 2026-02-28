/**
 * Budget Sidebar Component
 *
 * Displays income, expenses, and debt allocation controls.
 * Always visible (not collapsed) per user preference.
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, DollarSign, Gift, Calendar, ChevronDown } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { ExpenseTracker } from '../ui/ExpenseTracker';
import { format, parseISO } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { IncomeSourceModal } from '../ui/IncomeSourceModal';
import { OneTimeFundingModal } from '../ui/OneTimeFundingModal';
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
  const { confirm, dialogProps } = useConfirmDialog();

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

  return (
    <div className="space-y-4">
      {/* Income Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 ">Income</h3>
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {budget.incomeSources.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-3">No income sources yet</p>
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600"
            >
              <Plus size={16} />
              Add Income
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {budget.incomeSources.map((source) => {
              const netAmount = calculateNetMonthlyIncome(source);
              const grossAmount = calculateGrossMonthlyIncome(source);
              const hasDeductions = netAmount < grossAmount;

              return (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{source.name}</span>
                      <span className="text-xs text-gray-400">
                        {PAY_FREQUENCY_SHORT[source.payFrequency]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary-600 font-semibold">
                        {formatCurrency(netAmount)}/mo
                      </span>
                      {hasDeductions && (
                        <span className="text-xs text-gray-400">
                          (gross: {formatCurrency(grossAmount)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEditSource(source)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSource(source)}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium">Total Take-Home</span>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(totalMonthlyIncome)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Expenses */}
      {onBudgetChange ? (
        <ExpenseTracker budget={budget} onBudgetChange={onBudgetChange} />
      ) : (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Monthly Expenses</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Rent, utilities, groceries, etc.
          </p>
          <div className="relative">
            <DollarSign
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="number"
              value={budget.monthlyExpenses || ''}
              onChange={(e) => onExpenseChange(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Debt Payment Calculator */}
      <div className="card bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/30 dark:to-gray-800">
        <h3 className="font-semibold text-gray-900  mb-3">Debt Payment</h3>

        {/* Step 1: What's available */}
        <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">What you have</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Income</span>
              <span className="text-gray-900 ">{formatCurrency(totalMonthlyIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expenses</span>
              <span className="text-gray-500">-{formatCurrency(budget.monthlyExpenses)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-100 font-medium">
              <span className="text-gray-700">Available</span>
              <span className={availableForDebt > 0 ? 'text-green-600' : 'text-red-500'}>
                {formatCurrency(availableForDebt)}
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Required minimums (not editable) */}
        <div className="flex justify-between items-center py-2 px-3 bg-gray-100/60 dark:bg-gray-700/60 rounded-lg mb-3">
          <div>
            <span className="text-sm text-gray-700">Minimum payments</span>
            <p className="text-xs text-gray-500">Required each month</p>
          </div>
          <span className="font-semibold text-gray-900 ">{formatCurrency(totalMinimums)}</span>
        </div>

        {/* Step 3: Extra payment input (the ONE thing user controls) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Extra payment (accelerates payoff)
          </label>
          <div className="relative">
            <DollarSign
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"
            />
            <input
              type="number"
              value={Math.max(0, budget.debtAllocationAmount - totalMinimums) || ''}
              onChange={(e) => onExtraChange(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2.5 border-2 border-primary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-primary-700 bg-white"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This goes to your focus debt each month
          </p>
        </div>

        {/* Step 4: Total result */}
        <div className="flex justify-between items-center p-3 bg-primary-100 dark:bg-primary-900/40 rounded-xl">
          <span className="font-medium text-primary-800">Total monthly payment</span>
          <span className="text-xl font-bold text-primary-700">
            {formatCurrency(budget.debtAllocationAmount || totalMinimums)}
          </span>
        </div>
      </div>

      {/* Windfalls (One-time Fundings) — collapsed by default */}
      <div className="card">
        <button
          type="button"
          onClick={() => setWindfallsOpen((v) => !v)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-amber-500" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-sm">Windfalls 🎁</h3>
              <p className="text-xs text-gray-500">Tax refunds, bonuses, lump sums</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {strategy.oneTimeFundings.filter((f) => !f.isApplied).length > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                {strategy.oneTimeFundings.filter((f) => !f.isApplied).length}
              </span>
            )}
            <ChevronDown
              size={16}
              className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${windfallsOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {windfallsOpen && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setIsFundingModalOpen(true)}
                className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

        {strategy.oneTimeFundings.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-2">No windfalls planned</p>
            <p className="text-xs text-gray-400">
              Add tax refunds, bonuses, or unexpected money
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {strategy.oneTimeFundings.map((funding) => (
              <div
                key={funding.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  funding.isApplied ? 'bg-gray-100 opacity-60' : 'bg-amber-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{funding.name}</span>
                    {funding.isApplied && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        Applied
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>{format(parseISO(funding.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-600">
                    {formatCurrency(funding.amount)}
                  </span>
                  {!funding.isApplied && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditFunding(funding)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteFunding(funding)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Total upcoming */}
            {totalUpcomingFundings > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Total upcoming</span>
                <span className="font-semibold text-amber-600">
                  {formatCurrency(totalUpcomingFundings)}
                </span>
              </div>
            )}
          </div>
        )}
          </div>
        )}
      </div>

      {/* Income Source Modal */}
      <IncomeSourceModal
        isOpen={isIncomeModalOpen}
        onClose={handleCloseModal}
        source={editingSource}
      />

      {/* One-time Funding Modal */}
      <OneTimeFundingModal
        isOpen={isFundingModalOpen}
        onClose={handleCloseFundingModal}
        onSave={handleSaveFunding}
        onUpdate={updateOneTimeFunding}
        funding={editingFunding}
      />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
