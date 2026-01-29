/**
 * Plan Summary Component
 *
 * Displays payoff plan statistics and strategy toggle.
 */

import { Trophy, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency, formatTimeUntil } from '../../lib/calculations';
import type { PayoffPlan, PayoffStrategy } from '../../types';

interface PlanSummaryProps {
  plan: PayoffPlan;
  strategy: PayoffStrategy;
  debtFreeDate: Date | null;
  onStrategyChange: (strategy: PayoffStrategy) => void;
}

export function PlanSummary({
  plan,
  strategy,
  debtFreeDate,
  onStrategyChange,
}: PlanSummaryProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Plan Summary</h2>
        <div className="flex gap-1">
          <button
            onClick={() => onStrategyChange('avalanche')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              strategy === 'avalanche'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Avalanche
          </button>
          <button
            onClick={() => onStrategyChange('snowball')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              strategy === 'snowball'
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
          <p className="text-xs text-gray-500">Debt-Free</p>
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
          <p className="font-semibold text-sm">{formatCurrency(plan.totalPayments)}</p>
        </div>
      </div>
    </div>
  );
}
