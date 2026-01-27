/**
 * Budget Page
 *
 * Manage income sources, expenses, and debt allocation.
 * Replaces the original Strategy page with more comprehensive income tracking.
 */

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, DollarSign, Gift } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { IncomeSourceModal } from '../components/ui/IncomeSourceModal';
import {
  formatCurrency,
  calculateMonthlyIncome,
  calculateTotalMonthlyIncome,
} from '../lib/calculations';
import type { IncomeSource, PayoffStrategy } from '../types';

const PAY_FREQUENCY_SHORT: Record<string, string> = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  'semi-monthly': '2x/month',
  monthly: 'Monthly',
};

export function BudgetPage() {
  const {
    budget,
    strategy,
    debts,
    updateBudget,
    updateStrategy,
    deleteIncomeSource,
  } = useApp();

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [showStrategyInfo, setShowStrategyInfo] = useState(false);

  // Calculate totals
  const totalMonthlyIncome = useMemo(
    () => calculateTotalMonthlyIncome(budget.incomeSources),
    [budget.incomeSources]
  );

  const totalMinimums = useMemo(
    () => debts.reduce((sum, d) => sum + d.minimumPayment, 0),
    [debts]
  );

  const availableForDebt = Math.max(0, totalMonthlyIncome - budget.monthlyExpenses);
  const extraAfterMinimums = Math.max(0, budget.debtAllocationAmount - totalMinimums);

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

  const handleExpenseChange = (value: string) => {
    updateBudget({ monthlyExpenses: parseFloat(value) || 0 });
  };

  const handleAllocationChange = (value: string) => {
    updateBudget({ debtAllocationAmount: parseFloat(value) || 0 });
  };

  const handleStrategyChange = (newStrategy: PayoffStrategy) => {
    updateStrategy({ strategy: newStrategy });
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Budget"
        subtitle="Manage your income and debt allocation"
      />

      <div className="px-4 py-6 space-y-6">
        {/* Income Sources */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <h2 className="text-lg font-semibold">Income Sources</h2>
            </div>
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {budget.incomeSources.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">No income sources added yet</p>
              <button
                onClick={() => setIsIncomeModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600"
              >
                <Plus size={16} />
                Add Income Source
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {budget.incomeSources.map((source) => {
                const monthlyAmount = calculateMonthlyIncome(source);
                return (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{source.name}</span>
                        <span className="text-xs text-gray-400">
                          {source.type === 'hourly' ? '⏰' : '💼'}{' '}
                          {source.type === 'hourly'
                            ? `$${source.hourlyRate}/hr`
                            : PAY_FREQUENCY_SHORT[source.payFrequency]}
                        </span>
                      </div>
                      <p className="text-sm text-primary-600 font-semibold">
                        {formatCurrency(monthlyAmount)}/mo
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditSource(source)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-medium">Total Monthly Income</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(totalMonthlyIncome)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Expenses */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏠</span>
            <h2 className="text-lg font-semibold">Monthly Expenses</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Your regular monthly expenses (rent, utilities, groceries, etc.)
          </p>
          <div className="relative">
            <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              value={budget.monthlyExpenses || ''}
              onChange={(e) => handleExpenseChange(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
            />
          </div>
        </div>

        {/* Available for Debt */}
        <div className="card bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💸</span>
            <h2 className="text-lg font-semibold">Available for Debt</h2>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Income</span>
              <span>{formatCurrency(totalMonthlyIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Expenses</span>
              <span className="text-red-500">-{formatCurrency(budget.monthlyExpenses)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
              <span>Available</span>
              <span className={availableForDebt > 0 ? 'text-green-600' : 'text-red-500'}>
                {formatCurrency(availableForDebt)}
              </span>
            </div>
          </div>

          {/* Debt allocation input */}
          <div className="p-4 bg-white rounded-xl border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to put toward debt monthly
            </label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={budget.debtAllocationAmount || ''}
                onChange={(e) => handleAllocationChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={availableForDebt}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg font-semibold"
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
                  <span>{formatCurrency(extraAfterMinimums)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* One-time Fundings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={20} className="text-amber-500" />
            <h2 className="text-lg font-semibold">One-time Fundings</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Bonus amounts you plan to put toward debt (tax refunds, bonuses, etc.)
          </p>

          <button className="w-full flex justify-between items-center py-3 text-gray-600">
            <span>{strategy.oneTimeFundings.length} planned</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Payoff Strategy */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-semibold">Payoff Strategy</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Which debts get your extra payments first
          </p>

          <div className="space-y-3">
            {/* Avalanche Option */}
            <button
              onClick={() => handleStrategyChange('avalanche')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                strategy.strategy === 'avalanche'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">Debt Avalanche</span>
                {strategy.strategy === 'avalanche' && (
                  <span className="text-xs bg-primary-500 text-white px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Pay highest APR first. Saves the most money on interest.
              </p>
            </button>

            {/* Snowball Option */}
            <button
              onClick={() => handleStrategyChange('snowball')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                strategy.strategy === 'snowball'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">Debt Snowball</span>
                {strategy.strategy === 'snowball' && (
                  <span className="text-xs bg-primary-500 text-white px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Pay lowest balance first. Builds momentum with quick wins.
              </p>
            </button>
          </div>

          <button
            onClick={() => setShowStrategyInfo(!showStrategyInfo)}
            className="w-full mt-4 text-primary-600 text-sm font-medium"
          >
            {showStrategyInfo ? 'Hide comparison' : 'Compare strategies'}
          </button>

          {showStrategyInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm space-y-3">
              <div>
                <p className="font-semibold text-gray-900">Avalanche (Recommended)</p>
                <p className="text-gray-600">
                  Mathematically optimal. Targets high-interest debt first,
                  minimizing total interest paid over time.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Snowball</p>
                <p className="text-gray-600">
                  Psychologically motivating. Quick wins from paying off small
                  balances can help maintain motivation.
                </p>
              </div>
            </div>
          )}
        </div>
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
