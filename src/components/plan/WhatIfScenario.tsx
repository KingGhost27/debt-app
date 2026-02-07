/**
 * What-If Scenario Tool
 *
 * Lets users see how extra payments affect their debt-free date and
 * total interest paid. Shows a side-by-side comparison with animated values.
 */

import { useState, useMemo } from 'react';
import { Sparkles, TrendingDown, Calendar, DollarSign, Zap } from 'lucide-react';
import { parseISO, differenceInMonths } from 'date-fns';
import { generatePayoffPlan, formatCurrency } from '../../lib/calculations';
import type { Debt, StrategySettings } from '../../types';

interface WhatIfScenarioProps {
  debts: Debt[];
  strategy: StrategySettings;
}

const SLIDER_PRESETS = [50, 100, 200, 300, 500];

export function WhatIfScenario({ debts, strategy }: WhatIfScenarioProps) {
  const [extraAmount, setExtraAmount] = useState(100);

  // Current plan (baseline)
  const currentPlan = useMemo(
    () => generatePayoffPlan(debts, strategy),
    [debts, strategy]
  );

  // What-if plan with extra monthly payment
  const whatIfPlan = useMemo(() => {
    const modifiedStrategy: StrategySettings = {
      ...strategy,
      recurringFunding: {
        ...strategy.recurringFunding,
        amount: strategy.recurringFunding.amount + extraAmount,
      },
    };
    return generatePayoffPlan(debts, modifiedStrategy);
  }, [debts, strategy, extraAmount]);

  // Calculate differences
  const currentDate = currentPlan.debtFreeDate ? parseISO(currentPlan.debtFreeDate) : null;
  const whatIfDate = whatIfPlan.debtFreeDate ? parseISO(whatIfPlan.debtFreeDate) : null;

  const monthsSaved = currentDate && whatIfDate
    ? differenceInMonths(currentDate, whatIfDate)
    : 0;

  const interestSaved = currentPlan.totalInterest - whatIfPlan.totalInterest;

  return (
    <div className="card bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 px-5 py-4 border-b border-amber-100 dark:border-amber-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-300/30">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">What If...?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">See how extra payments accelerate your plan</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Extra monthly payment
            </label>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              +{formatCurrency(extraAmount)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            step={25}
            value={extraAmount}
            onChange={(e) => setExtraAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>$0</span>
            <span>$500</span>
            <span>$1,000</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2 mt-3">
            {SLIDER_PRESETS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setExtraAmount(amount)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
                  extraAmount === amount
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-300/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                }`}
              >
                +${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Results comparison */}
        {extraAmount > 0 ? (
          <div className="space-y-3">
            {/* Months saved */}
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/30">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-green-300/30">
                <Calendar size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Time saved</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {monthsSaved > 0 ? `${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner` : 'Same timeline'}
                </p>
              </div>
            </div>

            {/* Interest saved */}
            <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800/30">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-300/30">
                <DollarSign size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Interest saved</p>
                <p className="text-lg font-bold text-primary-700 dark:text-primary-400">
                  {interestSaved > 0 ? formatCurrency(interestSaved) : '$0.00'}
                </p>
              </div>
            </div>

            {/* Total paid comparison */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-md shadow-gray-300/30">
                <TrendingDown size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">New total interest</p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {formatCurrency(whatIfPlan.totalInterest)}
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2">
                    vs {formatCurrency(currentPlan.totalInterest)}
                  </span>
                </p>
              </div>
            </div>

            {/* Motivational message */}
            {monthsSaved > 0 && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  {monthsSaved >= 12
                    ? `That's ${Math.floor(monthsSaved / 12)} year${Math.floor(monthsSaved / 12) !== 1 ? 's' : ''} closer to freedom!`
                    : 'Every extra dollar brings you closer to debt-free!'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-500">
            Move the slider to see how extra payments help
          </div>
        )}
      </div>
    </div>
  );
}
