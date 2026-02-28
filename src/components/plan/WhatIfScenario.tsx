/**
 * What-If Scenario Tool
 *
 * Lets users see how extra payments affect their debt-free date and
 * total interest paid. Shows a side-by-side comparison with animated values.
 */

import { useState, useMemo } from 'react';
import { Sparkles, TrendingDown, Calendar, DollarSign, Zap } from 'lucide-react';
import { parseISO, differenceInMonths, format } from 'date-fns';
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
    <div className="card bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
      {/* Compact header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-300/30 flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">What If...?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Extra payment impact</p>
        </div>
        <span className="ml-auto text-base font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">
          +{formatCurrency(extraAmount)}
        </span>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min={0}
          max={1000}
          step={25}
          value={extraAmount}
          onChange={(e) => setExtraAmount(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1 mb-3">
          <span>$0</span>
          <span>$500</span>
          <span>$1,000</span>
        </div>

        {/* Quick preset buttons */}
        <div className="flex gap-1.5">
          {SLIDER_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setExtraAmount(amount)}
              className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${
                extraAmount === amount
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-300/30'
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
        <div className="space-y-2">
          {/* Months saved */}
          <div className="flex items-center gap-3 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/30">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <Calendar size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Time saved</p>
              <p className="text-sm font-bold text-green-700 dark:text-green-400 leading-tight">
                {monthsSaved > 0 ? `${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner` : 'Same timeline'}
              </p>
              {monthsSaved > 0 && whatIfDate && (
                <p className="text-xs text-green-600/70 dark:text-green-400/60">
                  Free by {format(whatIfDate, 'MMM yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Interest saved */}
          <div className="flex items-center gap-3 p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800/30">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <DollarSign size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Interest saved</p>
              <p className="text-sm font-bold text-primary-700 dark:text-primary-400 leading-tight">
                {interestSaved > 0 ? formatCurrency(interestSaved) : '$0.00'}
              </p>
            </div>
          </div>

          {/* Total paid comparison */}
          <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <TrendingDown size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">New total interest</p>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-tight">
                {formatCurrency(whatIfPlan.totalInterest)}
                <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1.5">
                  vs {formatCurrency(currentPlan.totalInterest)}
                </span>
              </p>
            </div>
          </div>

          {/* Motivational message */}
          {monthsSaved >= 12 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 pt-1">
              <Sparkles size={12} className="text-amber-400" />
              That's {Math.floor(monthsSaved / 12)} year{Math.floor(monthsSaved / 12) !== 1 ? 's' : ''} closer to freedom!
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-3 text-sm text-gray-400 dark:text-gray-500">
          Move the slider to see how extra payments help
        </div>
      )}
    </div>
  );
}
