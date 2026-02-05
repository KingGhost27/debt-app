/**
 * Plan Summary Component - Kawaii Edition
 *
 * Displays payoff plan statistics with strategy comparison.
 * Features cute styling and delightful interactions.
 */

import { parseISO } from 'date-fns';
import { Trophy, TrendingDown, DollarSign, Check, Sparkles, Mountain, Snowflake, Crown } from 'lucide-react';
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
    <div className="card bg-white rounded-3xl shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-300/30">
          <Sparkles size={20} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Strategy Comparison</h2>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 pr-2 font-medium text-gray-500"></th>
              <th className="text-center py-3 px-2">
                <div className="relative">
                  {/* Best Value Badge for Avalanche */}
                  {betterInterest === 'avalanche' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-[10px] font-bold rounded-full shadow-lg animate-kawaii-bounce whitespace-nowrap">
                        <Crown size={10} className="animate-kawaii-wiggle" />
                        Best Value!
                        <Sparkles size={10} className="animate-kawaii-pulse" />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => onStrategyChange('avalanche')}
                    className={`w-full px-4 py-2.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      strategy === 'avalanche'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-300/40'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    } ${betterInterest === 'avalanche' ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                  >
                    <Mountain size={16} />
                    Avalanche
                  </button>
                  {/* Floating sparkles for best strategy */}
                  {betterInterest === 'avalanche' && (
                    <>
                      <span className="absolute -top-1 -left-1 text-sm animate-money-float" style={{ animationDelay: '0s' }}>✨</span>
                      <span className="absolute -top-1 -right-1 text-sm animate-money-float" style={{ animationDelay: '0.5s' }}>💰</span>
                    </>
                  )}
                </div>
              </th>
              <th className="text-center py-3 px-2">
                <div className="relative">
                  {/* Best Value Badge for Snowball */}
                  {betterInterest === 'snowball' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-[10px] font-bold rounded-full shadow-lg animate-kawaii-bounce whitespace-nowrap">
                        <Crown size={10} className="animate-kawaii-wiggle" />
                        Best Value!
                        <Sparkles size={10} className="animate-kawaii-pulse" />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => onStrategyChange('snowball')}
                    className={`w-full px-4 py-2.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      strategy === 'snowball'
                        ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-lg shadow-primary-200/40'
                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    } ${betterInterest === 'snowball' ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                  >
                    <Snowflake size={16} />
                    Snowball
                  </button>
                  {/* Floating sparkles for best strategy */}
                  {betterInterest === 'snowball' && (
                    <>
                      <span className="absolute -top-1 -left-1 text-sm animate-money-float" style={{ animationDelay: '0s' }}>✨</span>
                      <span className="absolute -top-1 -right-1 text-sm animate-money-float" style={{ animationDelay: '0.5s' }}>💰</span>
                    </>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Debt-Free Date */}
            <tr className="border-b border-gray-100">
              <td className="py-4 pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Trophy size={16} className="text-primary-500" />
                  </div>
                  <span className="text-gray-700 font-medium">Debt-Free</span>
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterTime === 'avalanche' ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {avalancheDate ? formatTimeUntil(avalancheDate) : 'N/A'}
                  </span>
                  {betterTime === 'avalanche' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterTime === 'snowball' ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {snowballDate ? formatTimeUntil(snowballDate) : 'N/A'}
                  </span>
                  {betterTime === 'snowball' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
                    </div>
                  )}
                </div>
              </td>
            </tr>

            {/* Total Interest */}
            <tr className="border-b border-gray-100">
              <td className="py-4 pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                    <TrendingDown size={16} className="text-red-500" />
                  </div>
                  <span className="text-gray-700 font-medium">Interest</span>
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterInterest === 'avalanche'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {formatCurrency(avalanchePlan.totalInterest)}
                  </span>
                  {betterInterest === 'avalanche' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterInterest === 'snowball'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {formatCurrency(snowballPlan.totalInterest)}
                  </span>
                  {betterInterest === 'snowball' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
                    </div>
                  )}
                </div>
              </td>
            </tr>

            {/* Total Payments */}
            <tr>
              <td className="py-4 pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <DollarSign size={16} className="text-gray-500" />
                  </div>
                  <span className="text-gray-700 font-medium">Total Paid</span>
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterTotal === 'avalanche' ? 'text-green-600' : 'text-gray-700'
                    }`}
                  >
                    {formatCurrency(avalanchePlan.totalPayments)}
                  </span>
                  {betterTotal === 'avalanche' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      betterTotal === 'snowball' ? 'text-green-600' : 'text-gray-700'
                    }`}
                  >
                    {formatCurrency(snowballPlan.totalPayments)}
                  </span>
                  {betterTotal === 'snowball' && (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
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
            ? 'bg-gradient-to-r from-primary-100 to-primary-50 border border-primary-200'
            : 'bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-100'
        }`}
      >
        <Sparkles
          size={12}
          className="absolute top-3 right-4 animate-kawaii-pulse text-primary-300"
        />
        <div className="flex items-center justify-center gap-2 mb-2">
          {strategy === 'avalanche' ? (
            <Mountain size={18} className="text-primary-600" />
          ) : (
            <Snowflake size={18} className="text-primary-500" />
          )}
          <span className="font-bold text-primary-700">
            {strategy === 'avalanche' ? 'Avalanche Strategy' : 'Snowball Strategy'}
          </span>
        </div>
        <p className="text-sm text-primary-700">
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
