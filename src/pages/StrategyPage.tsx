/**
 * Strategy Page
 *
 * Configure payoff strategy: funding amount, payment priority.
 */

import { useState } from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';
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
    <div className="min-h-screen">
      <PageHeader
        title="Strategy"
        subtitle="Optimize your payoff plan"
      />

      <div className="px-4 py-6 space-y-6">
        {/* Recurring Funding */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💰</span>
            <h2 className="text-lg font-semibold">Recurring funding</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Amount to use for making payments each cycle
          </p>

          {/* Frequency */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">FREQUENCY</p>
            <button className="w-full flex justify-between items-center py-3 border-b border-gray-100">
              <span>Once per month on the {getOrdinal(strategy.recurringFunding.dayOfMonth)}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <p className="text-sm text-gray-500">AMOUNT</p>

            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <span>Total Monthly Budget</span>
                <button className="text-gray-400">
                  <HelpCircle size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={strategy.recurringFunding.amount || ''}
                  onChange={(e) => handleFundingChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-24 text-right font-semibold border-b border-gray-200 focus:border-primary-500 focus:outline-none py-1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center py-2 text-gray-500">
              <span>Minimum payments</span>
              <span>{formatCurrency(totalMinimums)}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span>Extra (for payoff)</span>
              <span className="font-semibold text-primary-600">
                {formatCurrency(extraAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-t border-gray-200 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(strategy.recurringFunding.amount)}</span>
            </div>
          </div>
        </div>

        {/* One-time Fundings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎁</span>
            <h2 className="text-lg font-semibold">One-time fundings</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Bonus amounts for making payments
          </p>

          <button className="w-full flex justify-between items-center py-3">
            <span>{strategy.oneTimeFundings.length} upcoming</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Extra Payment Priority */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-semibold">Extra payment priority</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Which debts get extra payments first
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

          {/* Strategy Comparison */}
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
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
