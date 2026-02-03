/**
 * Plan Summary Component - Kawaii Edition
 *
 * Displays payoff plan statistics with strategy comparison.
 * Features cute styling and delightful interactions.
 */

import { parseISO } from 'date-fns';
import { Trophy, TrendingDown, DollarSign, Check, Sparkles, Mountain, Snowflake } from 'lucide-react';
import { formatCurrency, formatTimeUntil } from '../../lib/calculations';
import type { PayoffPlan, PayoffStrategy } from '../../types';

interface PlanSummaryProps {
  avalanchePlan: PayoffPlan;
  snowballPlan: PayoffPlan;
  strategy: PayoffStrategy;
  onStrategyChange: (strategy: PayoffStrategy) => void;
}

export function PlanSummary({
  avalanchePlan,
  snowballPlan,
  strategy,
  onStrategyChange,
}: PlanSummaryProps) {
  const avalancheDate = avalanchePlan.debtFreeDate
    ? parseISO(avalanchePlan.debtFreeDate)
    : null;
  const snowballDate = snowballPlan.debtFreeDate
    ? parseISO(snowballPlan.debtFreeDate)
    : null;

  // Determine which is better for each metric (lower is better)
  const betterTime =
    avalanchePlan.debtFreeDate <= snowballPlan.debtFreeDate ? 'avalanche' : 'snowball';
  const betterInterest =
    avalanchePlan.totalInterest <= snowballPlan.totalInterest ? 'avalanche' : 'snowball';
  const betterTotal =
    avalanchePlan.totalPayments <= snowballPlan.totalPayments ? 'avalanche' : 'snowball';

  // Calculate interest savings between strategies
  const interestSavings = Math.abs(
    avalanchePlan.totalInterest - snowballPlan.totalInterest
  );

  return (
    <div className="card bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-300/30">
          <Sparkles size={20} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Strategy Comparison</h2>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 pr-2 font-medium text-gray-500 dark:text-gray-400"></th>
              <th className="text-center py-3 px-2">
                <button
                  onClick={() => onStrategyChange('avalanche')}
                  className={`w-full px-4 py-2.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    strategy === 'avalanche'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-300/40 dark:shadow-blue-900/40'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Mountain size={16} />
                  Avalanche
                </button>
              </th>
              <th className="text-center py-3 px-2">
                <button
                  onClick={() => onStrategyChange('snowball')}
                  className={`w-full px-4 py-2.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    strategy === 'snowball'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-300/40 dark:shadow-purple-900/40'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Snowflake size={16} />
                  Snowball
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Debt-Free Date */}
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-4 pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                    <Trophy size={16} className="text-primary-500" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Debt-Free</span>
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterTime === 'avalanche' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {avalancheDate ? formatTimeUntil(avalancheDate) : 'N/A'}
                  </span>
                  {betterTime === 'avalanche' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Check size={12} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterTime === 'snowball' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {snowballDate ? formatTimeUntil(snowballDate) : 'N/A'}
                  </span>
                  {betterTime === 'snowball' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Check size={12} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
              </td>
            </tr>

            {/* Total Interest */}
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-4 pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <TrendingDown size={16} className="text-red-500" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Interest</span>
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterInterest === 'avalanche'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(avalanchePlan.totalInterest)}
                  </span>
                  {betterInterest === 'avalanche' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Check size={12} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterInterest === 'snowball'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(snowballPlan.totalInterest)}
                  </span>
                  {betterInterest === 'snowball' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Check size={12} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
              </td>
            </tr>

            {/* Total Payments */}
            <tr>
              <td className="py-4 pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <DollarSign size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Total Paid</span>
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterTotal === 'avalanche' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {formatCurrency(avalanchePlan.totalPayments)}
                  </span>
                  {betterTotal === 'avalanche' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Check size={12} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterTotal === 'snowball' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {formatCurrency(snowballPlan.totalPayments)}
                  </span>
                  {betterTotal === 'snowball' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Check size={12} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Strategy info callout - describes the selected strategy */}
      <div
        className={`mt-5 p-4 rounded-2xl text-center relative overflow-hidden ${
          strategy === 'avalanche'
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800/50'
            : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-100 dark:border-purple-800/50'
        }`}
      >
        <Sparkles
          size={12}
          className={`absolute top-3 right-4 animate-kawaii-pulse ${
            strategy === 'avalanche' ? 'text-blue-300 dark:text-blue-700' : 'text-purple-300 dark:text-purple-700'
          }`}
        />
        <div className="flex items-center justify-center gap-2 mb-2">
          {strategy === 'avalanche' ? (
            <Mountain size={18} className="text-blue-500" />
          ) : (
            <Snowflake size={18} className="text-purple-500" />
          )}
          <span
            className={`font-bold ${
              strategy === 'avalanche' ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300'
            }`}
          >
            {strategy === 'avalanche' ? 'Avalanche Strategy' : 'Snowball Strategy'}
          </span>
        </div>
        <p
          className={`text-sm ${
            strategy === 'avalanche' ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300'
          }`}
        >
          {strategy === 'avalanche' ? (
            <>
              Pays off highest interest debts first, saving you the most money.
              {interestSavings > 0 && betterInterest === 'avalanche' && (
                <> You'll save <span className="font-bold">{formatCurrency(interestSavings)}</span> in interest vs Snowball!</>
              )}
            </>
          ) : (
            <>
              Pays off smallest balances first, giving you quick wins to stay motivated.
              {interestSavings > 0 && betterInterest === 'avalanche' && (
                <> Trade-off: <span className="font-bold">{formatCurrency(interestSavings)}</span> more interest vs Avalanche.</>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
