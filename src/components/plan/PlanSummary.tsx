/**
 * Plan Summary Component
 *
 * Displays payoff plan statistics with strategy comparison.
 */

import { parseISO } from 'date-fns';
import { Trophy, TrendingDown, DollarSign, Check } from 'lucide-react';
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

  // Calculate savings
  const interestSavings = Math.abs(
    avalanchePlan.totalInterest - snowballPlan.totalInterest
  );
  const totalSavings = Math.abs(
    avalanchePlan.totalPayments - snowballPlan.totalPayments
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Strategy Comparison</h2>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-2 font-medium text-gray-500"></th>
              <th className="text-center py-2 px-2">
                <button
                  onClick={() => onStrategyChange('avalanche')}
                  className={`w-full px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    strategy === 'avalanche'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Avalanche
                </button>
              </th>
              <th className="text-center py-2 px-2">
                <button
                  onClick={() => onStrategyChange('snowball')}
                  className={`w-full px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    strategy === 'snowball'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Snowball
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Debt-Free Date */}
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-2">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-primary-500" />
                  <span className="text-gray-600">Debt-Free</span>
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={
                      betterTime === 'avalanche' ? 'font-semibold text-green-600' : ''
                    }
                  >
                    {avalancheDate ? formatTimeUntil(avalancheDate) : 'N/A'}
                  </span>
                  {betterTime === 'avalanche' && (
                    <Check size={14} className="text-green-600" />
                  )}
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={
                      betterTime === 'snowball' ? 'font-semibold text-green-600' : ''
                    }
                  >
                    {snowballDate ? formatTimeUntil(snowballDate) : 'N/A'}
                  </span>
                  {betterTime === 'snowball' && (
                    <Check size={14} className="text-green-600" />
                  )}
                </div>
              </td>
            </tr>

            {/* Total Interest */}
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-2">
                <div className="flex items-center gap-2">
                  <TrendingDown size={16} className="text-red-500" />
                  <span className="text-gray-600">Interest</span>
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={
                      betterInterest === 'avalanche'
                        ? 'font-semibold text-green-600'
                        : 'text-red-500'
                    }
                  >
                    {formatCurrency(avalanchePlan.totalInterest)}
                  </span>
                  {betterInterest === 'avalanche' && (
                    <Check size={14} className="text-green-600" />
                  )}
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={
                      betterInterest === 'snowball'
                        ? 'font-semibold text-green-600'
                        : 'text-red-500'
                    }
                  >
                    {formatCurrency(snowballPlan.totalInterest)}
                  </span>
                  {betterInterest === 'snowball' && (
                    <Check size={14} className="text-green-600" />
                  )}
                </div>
              </td>
            </tr>

            {/* Total Payments */}
            <tr>
              <td className="py-3 pr-2">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-500" />
                  <span className="text-gray-600">Total Paid</span>
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={
                      betterTotal === 'avalanche' ? 'font-semibold text-green-600' : ''
                    }
                  >
                    {formatCurrency(avalanchePlan.totalPayments)}
                  </span>
                  {betterTotal === 'avalanche' && (
                    <Check size={14} className="text-green-600" />
                  )}
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={
                      betterTotal === 'snowball' ? 'font-semibold text-green-600' : ''
                    }
                  >
                    {formatCurrency(snowballPlan.totalPayments)}
                  </span>
                  {betterTotal === 'snowball' && (
                    <Check size={14} className="text-green-600" />
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Strategy info callout - describes the selected strategy */}
      <div
        className={`mt-4 p-3 rounded-lg text-center ${
          strategy === 'avalanche' ? 'bg-blue-50' : 'bg-purple-50'
        }`}
      >
        <p
          className={`text-sm ${
            strategy === 'avalanche' ? 'text-blue-800' : 'text-purple-800'
          }`}
        >
          {strategy === 'avalanche' ? (
            <>
              <span className="font-semibold">Avalanche</span> pays off highest interest debts first, saving you the most money.
              {interestSavings > 0 && betterInterest === 'avalanche' && (
                <> You'll save <span className="font-semibold">{formatCurrency(interestSavings)}</span> in interest vs Snowball.</>
              )}
              {interestSavings > 0 && betterInterest === 'snowball' && (
                <> You'll pay <span className="font-semibold">{formatCurrency(interestSavings)}</span> more in interest vs Snowball.</>
              )}
              {totalSavings > 0 && betterTotal === 'avalanche' && (
                <> Total paid: <span className="font-semibold">{formatCurrency(avalanchePlan.totalPayments)}</span> (<span className="font-semibold">{formatCurrency(totalSavings)}</span> less).</>
              )}
              {totalSavings > 0 && betterTotal === 'snowball' && (
                <> Total paid: <span className="font-semibold">{formatCurrency(avalanchePlan.totalPayments)}</span> (<span className="font-semibold">{formatCurrency(totalSavings)}</span> more).</>
              )}
            </>
          ) : (
            <>
              <span className="font-semibold">Snowball</span> pays off smallest balances first, giving you quick wins to stay motivated.
              {interestSavings > 0 && betterInterest === 'avalanche' && (
                <> You'll pay <span className="font-semibold">{formatCurrency(interestSavings)}</span> more in interest vs Avalanche.</>
              )}
              {interestSavings > 0 && betterInterest === 'snowball' && (
                <> You'll save <span className="font-semibold">{formatCurrency(interestSavings)}</span> in interest vs Avalanche.</>
              )}
              {totalSavings > 0 && betterTotal === 'avalanche' && (
                <> Total paid: <span className="font-semibold">{formatCurrency(snowballPlan.totalPayments)}</span> (<span className="font-semibold">{formatCurrency(totalSavings)}</span> more).</>
              )}
              {totalSavings > 0 && betterTotal === 'snowball' && (
                <> Total paid: <span className="font-semibold">{formatCurrency(snowballPlan.totalPayments)}</span> (<span className="font-semibold">{formatCurrency(totalSavings)}</span> less).</>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
