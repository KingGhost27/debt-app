/**
 * Budget Sidebar Component
 *
 * Displays income, expenses, and debt allocation controls.
 * Always visible (not collapsed) per user preference.
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, DollarSign, Gift, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IncomeSourceModal } from '../ui/IncomeSourceModal';
import {
  formatCurrency,
  calculateNetMonthlyIncome,
  calculateGrossMonthlyIncome,
} from '../../lib/calculations';
import type { IncomeSource, BudgetSettings, StrategySettings } from '../../types';

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
  onAllocationChange?: (value: string) => void; // kept for compatibility
  onExtraChange: (value: string) => void;
}

export function BudgetSidebar({
  budget,
  strategy,
  totalMonthlyIncome,
  totalMinimums,
  onExpenseChange,
  onExtraChange,
}: BudgetSidebarProps) {
  const { deleteIncomeSource } = useApp();
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

  const availableForDebt = Math.max(0, totalMonthlyIncome - budget.monthlyExpenses);

  const handleEditSource = (source: IncomeSource) => {
    setEditingSource(source);
    setIsIncomeModalOpen(true);
  };

  const handleDeleteSource = (source: IncomeSource) => {
    if (window.confirm(`Delete income source "${source.name}"?`)) {
      deleteIncomeSource(source.id);
    }
  };

  const handleCloseModal = () => {
    setIsIncomeModalOpen(false);
    setEditingSource(null);
  };

  return (
    <div className="space-y-4">
      {/* Income Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Income</h3>
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
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-2">Monthly Expenses</h3>
        <p className="text-xs text-gray-500 mb-3">
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
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Debt Payment Calculator */}
      <div className="card bg-gradient-to-br from-primary-50 to-white">
        <h3 className="font-semibold text-gray-900 mb-3">Debt Payment</h3>

        {/* Step 1: What's available */}
        <div className="p-3 bg-white rounded-xl border border-gray-200 mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">What you have</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Income</span>
              <span className="text-gray-900">{formatCurrency(totalMonthlyIncome)}</span>
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
        <div className="flex justify-between items-center py-2 px-3 bg-gray-100 rounded-lg mb-3">
          <div>
            <span className="text-sm text-gray-700">Minimum payments</span>
            <p className="text-xs text-gray-500">Required each month</p>
          </div>
          <span className="font-semibold text-gray-900">{formatCurrency(totalMinimums)}</span>
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
        <div className="flex justify-between items-center p-3 bg-primary-100 rounded-xl">
          <span className="font-medium text-primary-800">Total monthly payment</span>
          <span className="text-xl font-bold text-primary-700">
            {formatCurrency(budget.debtAllocationAmount || totalMinimums)}
          </span>
        </div>
      </div>

      {/* One-time Fundings */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Gift size={18} className="text-amber-500" />
          <h3 className="font-semibold text-gray-900">One-time Fundings</h3>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Tax refunds, bonuses, etc.
        </p>
        <button className="w-full flex justify-between items-center py-2 text-gray-600 text-sm">
          <span>{strategy.oneTimeFundings.length} planned</span>
          <ChevronRight size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Income Source Modal */}
      <IncomeSourceModal
        isOpen={isIncomeModalOpen}
        onClose={handleCloseModal}
        source={editingSource}
      />
    </div>
  );
}
