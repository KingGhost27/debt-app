/**
 * Strategy Page - Kawaii Edition
 *
 * Configure payoff strategy: funding amount, payment priority.
 * Features cute styling, animations, and delightful interactions.
 */

import { useState } from 'react';
import { ChevronRight, HelpCircle, Sparkles, Mountain, Snowflake, DollarSign, Gift, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { formatCurrency } from '../lib/calculations';
import type { PayoffStrategy, RecurringFunding } from '../types';

export function StrategyPage() {
  const { strategy, updateStrategy, debts } = useApp();
  const [showStrategyInfo, setShowStrategyInfo] = useState(false);

  const totalMinimums = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const extraAmount = Math.max(0, strategy.recurringFunding.amount - totalMinimums);

  const handleFundingChange = (field: keyof RecurringFunding, value: number) => {
    updateStrategy({
      recurringFunding: {
        ...strategy.recurringFunding,
        [field]: value,
        extraAmount: field === 'amount'
          ? Math.max(0, value - totalMinimums)
          : strategy.recurringFunding.extraAmount,
      },
    });
  };

  const handleStrategyChange = (newStrategy: PayoffStrategy) => {
    updateStrategy({ strategy: newStrategy });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        title="Strategy"
        subtitle="Optimize your payoff plan"
        emoji="⚡"
      />

      <div className="px-4 py-6 space-y-6">
        {/* Recurring Funding */}
        <div className="card bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-300/40 dark:shadow-green-900/40">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recurring funding</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Amount to use for making payments each cycle
              </p>
            </div>
          </div>

          {/* Frequency */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Frequency</p>
            <div className="text-gray-700 dark:text-gray-300 font-medium">
              Once per month on the {getOrdinal(strategy.recurringFunding.dayOfMonth)}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Amount</p>

            <div className="flex justify-between items-center py-3 px-4 bg-primary-50 dark:bg-primary-900/30 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Monthly Budget</span>
                <button className="text-gray-400 hover:text-primary-500 transition-colors">
                  <HelpCircle size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">$</span>
                <input
                  type="number"
                  value={strategy.recurringFunding.amount || ''}
                  onChange={(e) => handleFundingChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-28 text-right font-bold text-lg border-b-2 border-primary-500 focus:border-primary-600 focus:outline-none py-1 bg-transparent text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center py-2 px-4 text-gray-500 dark:text-gray-400">
              <span>Minimum payments</span>
              <span className="font-medium">{formatCurrency(totalMinimums)}</span>
            </div>

            <div className="flex justify-between items-center py-2 px-4">
              <span className="text-gray-700 dark:text-gray-300">Extra (for payoff)</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(extraAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 px-4 border-t-2 border-gray-100 dark:border-gray-700 font-bold">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-gray-900 dark:text-white text-lg">{formatCurrency(strategy.recurringFunding.amount)}</span>
            </div>
          </div>
        </div>

        {/* One-time Fundings */}
        <div className="card bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-300/40 dark:shadow-purple-900/40">
              <Gift size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">One-time fundings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bonus amounts for making payments
              </p>
            </div>
          </div>

          <a
            href="/plan"
            className="w-full flex justify-between items-center py-4 px-4 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all group"
          >
            <span className="font-medium">{strategy.oneTimeFundings.length} planned → Manage in Plan</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Extra Payment Priority */}
        <div className="card bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-300/40 dark:shadow-primary-900/40">
              <Target size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Extra payment priority</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Which debts get extra payments first
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Avalanche Option */}
            <button
              onClick={() => handleStrategyChange('avalanche')}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                strategy.strategy === 'avalanche'
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-600 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/50'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Mountain size={20} className={strategy.strategy === 'avalanche' ? 'text-blue-500' : 'text-gray-400'} />
                  <span className={`font-bold ${strategy.strategy === 'avalanche' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                    Debt Avalanche
                  </span>
                </div>
                {strategy.strategy === 'avalanche' && (
                  <span className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Sparkles size={12} />
                    Selected
                  </span>
                )}
              </div>
              <p className={`text-sm ${strategy.strategy === 'avalanche' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                Pay highest APR first. Saves the most money on interest.
              </p>
            </button>

            {/* Snowball Option */}
            <button
              onClick={() => handleStrategyChange('snowball')}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                strategy.strategy === 'snowball'
                  ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 dark:border-purple-600 shadow-lg shadow-purple-200/50 dark:shadow-purple-900/50'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Snowflake size={20} className={strategy.strategy === 'snowball' ? 'text-purple-500' : 'text-gray-400'} />
                  <span className={`font-bold ${strategy.strategy === 'snowball' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                    Debt Snowball
                  </span>
                </div>
                {strategy.strategy === 'snowball' && (
                  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Sparkles size={12} />
                    Selected
                  </span>
                )}
              </div>
              <p className={`text-sm ${strategy.strategy === 'snowball' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                Pay lowest balance first. Builds momentum with quick wins.
              </p>
            </button>
          </div>

          {/* Strategy Comparison */}
          <button
            onClick={() => setShowStrategyInfo(!showStrategyInfo)}
            className="w-full mt-4 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center justify-center gap-1"
          >
            <Sparkles size={14} />
            {showStrategyInfo ? 'Hide comparison' : 'Compare strategies'}
          </button>

          {showStrategyInfo && (
            <div className="mt-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl text-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <Mountain size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Avalanche (Recommended)</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Mathematically optimal. Targets high-interest debt first,
                    minimizing total interest paid over time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                  <Snowflake size={16} className="text-purple-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Snowball</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Psychologically motivating. Quick wins from paying off small
                    balances can help maintain motivation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
