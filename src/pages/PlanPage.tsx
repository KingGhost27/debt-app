/**
 * Plan Page
 *
 * Unified page combining budget management and payoff plan visualization.
 * Shows the step-by-step payoff plan with inline budget controls.
 */

import { useMemo, useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Trophy,
  TrendingDown,
  DollarSign,
  Pencil,
  ChevronDown,
  Plus,
  Trash2,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { IncomeSourceModal } from '../components/ui/IncomeSourceModal';
import {
  generatePayoffPlan,
  formatCurrency,
  formatTimeUntil,
  sortDebtsByStrategy,
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

export function PlanPage() {
  const {
    debts,
    strategy,
    budget,
    updateStrategy,
    updateBudget,
    deleteIncomeSource,
  } = useApp();

  const [showBudgetDetails, setShowBudgetDetails] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [showStrategyInfo, setShowStrategyInfo] = useState(false);

  const plan = useMemo(
    () => generatePayoffPlan(debts, strategy),
    [debts, strategy]
  );

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

  const availableForDebt = Math.max(0, totalMonthlyIncome - budget.monthlyExpenses);

  const debtFreeDate = plan.debtFreeDate ? parseISO(plan.debtFreeDate) : null;

  // Auto-expand budget details if no allocation is set
  useEffect(() => {
    if (strategy.recurringFunding.amount === 0 && debts.length > 0) {
      setShowBudgetDetails(true);
    }
  }, []);

  const handleStrategyChange = (newStrategy: PayoffStrategy) => {
    updateStrategy({ strategy: newStrategy });
  };

  const handleEditSource = (source: IncomeSource) => {
    setEditingSource(source);
    setIsIncomeModalOpen(true);
  };

  const handleDeleteSource = (source: IncomeSource) => {
    if (window.confirm(`Delete income source "${source.name}"?`)) {
      deleteIncomeSource(source.id);
    }
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

  // No debts empty state
  if (debts.length === 0) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Payoff Plan" subtitle="Your budget and debt-free roadmap" />
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

  return (
    <div className="min-h-screen">
      <PageHeader title="Payoff Plan" subtitle="Your budget and debt-free roadmap" />

      <div className="px-4 py-6 space-y-6">
        {/* Plan Summary */}
        {strategy.recurringFunding.amount > 0 && (
          <>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Plan summary</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStrategyChange('avalanche')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      strategy.strategy === 'avalanche'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Avalanche
                  </button>
                  <button
                    onClick={() => handleStrategyChange('snowball')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      strategy.strategy === 'snowball'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Snowball
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy size={20} className="text-primary-600" />
                  </div>
                  <p className="text-xs text-gray-500">Payoff</p>
                  <p className="font-semibold text-sm">
                    {debtFreeDate ? formatTimeUntil(debtFreeDate) : 'N/A'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingDown size={20} className="text-red-600" />
                  </div>
                  <p className="text-xs text-gray-500">Total Interest</p>
                  <p className="font-semibold text-sm text-red-600">
                    {formatCurrency(plan.totalInterest)}
                  </p>
                </div>

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

            {/* Collapsible Budget Details */}
            <div className="card">
              <button
                onClick={() => setShowBudgetDetails(!showBudgetDetails)}
                className="w-full flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <h2 className="text-lg font-semibold">Budget Details</h2>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform duration-200 ${
                    showBudgetDetails ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Income - Minimums - Expenses = Available */}
              {totalMonthlyIncome > 0 && (
                <p className="text-xs text-gray-500 mt-3">
                  {formatCurrency(totalMonthlyIncome)} income − {formatCurrency(totalMinimums)} minimums − {formatCurrency(budget.monthlyExpenses)} expenses = {' '}
                  <span className={totalMonthlyIncome - totalMinimums - budget.monthlyExpenses > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {formatCurrency(Math.max(0, totalMonthlyIncome - totalMinimums - budget.monthlyExpenses))} available
                  </span>
                </p>
              )}

              {showBudgetDetails && (
                <div className="mt-4 space-y-6">
                  {/* Income Sources */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Income Sources</h3>
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
                        <p className="text-gray-500 text-sm mb-3">No income sources added yet</p>
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
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-medium text-gray-900">Monthly Expenses</h3>
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

                  {/* Available for Debt breakdown */}
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-3">Available for Debt</h3>
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
                          <span>{formatCurrency(Math.max(0, budget.debtAllocationAmount - totalMinimums))}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* One-time Fundings */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Gift size={20} className="text-amber-500" />
                      <h3 className="font-medium text-gray-900">One-time Fundings</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Bonus amounts you plan to put toward debt (tax refunds, bonuses, etc.)
                    </p>
                    <button className="w-full flex justify-between items-center py-3 text-gray-600">
                      <span>{strategy.oneTimeFundings.length} planned</span>
                      <ChevronRight size={20} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Strategy comparison */}
                  <div>
                    <button
                      onClick={() => setShowStrategyInfo(!showStrategyInfo)}
                      className="w-full text-primary-600 text-sm font-medium"
                    >
                      {showStrategyInfo ? 'Hide strategy comparison' : 'Compare strategies'}
                    </button>

                    {showStrategyInfo && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-xl text-sm space-y-3">
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
              )}
            </div>

            {/* Step-by-step Plan */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Step-by-step payoff plan</h2>

              <div className="space-y-4">
                {plan.steps.map((step, index) => {
                  const isLast = index === plan.steps.length - 1;
                  const stepDate = parseISO(step.completionDate);
                  const debtGettingExtra = sortedDebts.find(
                    (d) => d.id === step.debtReceivingExtra
                  );

                  return (
                    <div key={step.stepNumber} className="relative">
                      {!isLast && (
                        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
                      )}

                      <div className="card">
                        <div className="flex items-start gap-3 mb-4">
                          <div
                            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold ${
                              isLast ? 'bg-green-500' : 'bg-primary-500'
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

                        {debtGettingExtra && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                              Extra
                            </span>
                            <span>→ {debtGettingExtra.name}</span>
                          </div>
                        )}

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
            {debtFreeDate && (
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
          </>
        )}

        {/* No funding set message */}
        {strategy.recurringFunding.amount === 0 && (
          <div className="card text-center py-6">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign size={32} className="text-warning-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Set Your Monthly Contribution</h3>
            <p className="text-sm text-gray-500">
              Tap the pencil icon above or set your budget details below to generate a plan.
            </p>
          </div>
        )}
      </div>

      {/* Income Source Modal */}
      <IncomeSourceModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingSource(null);
        }}
        source={editingSource}
      />
    </div>
  );
}
