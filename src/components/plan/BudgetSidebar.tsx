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
  onAllocationChange: (value: string) => void;
}

export function BudgetSidebar({
  budget,
  strategy,
  totalMonthlyIncome,
  totalMinimums,
  onExpenseChange,
  onAllocationChange,
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

      {/* Available for Debt */}
      <div className="card bg-gradient-to-br from-primary-50 to-white">
        <h3 className="font-semibold text-gray-900 mb-3">Debt Budget</h3>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Take-home income</span>
            <span>{formatCurrency(totalMonthlyIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly expenses</span>
            <span className="text-red-500">-{formatCurrency(budget.monthlyExpenses)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 font-medium">
            <span>Available</span>
            <span className={availableForDebt > 0 ? 'text-green-600' : 'text-red-500'}>
              {formatCurrency(availableForDebt)}
            </span>
          </div>
        </div>

        {/* Debt allocation input */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly debt payment
        </label>
        <div className="relative">
          <DollarSign
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="number"
            value={budget.debtAllocationAmount || ''}
            onChange={(e) => onAllocationChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            max={availableForDebt}
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
          />
        </div>

        {budget.debtAllocationAmount > 0 && (
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Minimum payments</span>
              <span>{formatCurrency(totalMinimums)}</span>
            </div>
            <div className="flex justify-between text-primary-600 font-medium">
              <span>Extra for payoff</span>
              <span>
                {formatCurrency(Math.max(0, budget.debtAllocationAmount - totalMinimums))}
              </span>
            </div>
          </div>
        )}
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
