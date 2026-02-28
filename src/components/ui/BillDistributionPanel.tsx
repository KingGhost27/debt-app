/**
 * Bill Distribution Panel
 *
 * Displays analysis of how bills are distributed across pay periods
 * and suggests optimal due dates to balance payments.
 */

import { useMemo, useState } from 'react';
import { Lightbulb, Check, ArrowRight, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatOrdinal } from '../../lib/calculations';
import {
  analyzeBillDistribution,
  type BillSuggestion,
} from '../../lib/billDistribution';
import type { Debt, IncomeSource } from '../../types';

interface BillDistributionPanelProps {
  debts: Debt[];
  incomeSources: IncomeSource[];
}

export function BillDistributionPanel({
  debts,
  incomeSources,
}: BillDistributionPanelProps) {
  const { updateDebt } = useApp();
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('bill-distribution-collapsed') === 'true'
  );

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('bill-distribution-collapsed', String(next));
      return next;
    });
  };

  // Analyze distribution
  const analysis = useMemo(
    () => analyzeBillDistribution(debts, incomeSources),
    [debts, incomeSources]
  );

  // Calculate max amount for bar scaling
  const maxPeriodAmount = useMemo(() => {
    if (analysis.payPeriods.length === 0) return 0;
    return Math.max(...analysis.payPeriods.map((p) => p.totalAmount));
  }, [analysis.payPeriods]);

  // Apply a single suggestion
  const applySuggestion = (suggestion: BillSuggestion) => {
    updateDebt(suggestion.debtId, { dueDay: suggestion.suggestedDueDay });
    setAppliedSuggestions((prev) => new Set([...prev, suggestion.debtId]));
  };

  // Apply all suggestions
  const applyAllSuggestions = () => {
    analysis.suggestions.forEach((suggestion) => {
      if (!appliedSuggestions.has(suggestion.debtId)) {
        updateDebt(suggestion.debtId, { dueDay: suggestion.suggestedDueDay });
      }
    });
    setAppliedSuggestions(
      new Set(analysis.suggestions.map((s) => s.debtId))
    );
  };

  // Don't show if no data
  if (analysis.payPeriods.length === 0) {
    return (
      <div className="card bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Lightbulb size={18} />
          <span className="text-sm">{analysis.message}</span>
        </div>
      </div>
    );
  }

  // Don't show if already balanced and no suggestions
  if (analysis.isBalanced && analysis.suggestions.length === 0) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{analysis.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-3! sm:p-5!">
      {/* Header — always visible, clicking toggles body */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between mb-0"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          <h3 className="text-xs font-medium">Bill Distribution</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              analysis.isBalanced
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {analysis.balanceScore}% balanced
          </span>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
        </div>
      </button>

      {/* Collapsible body */}
      {!collapsed && (
        <div className="mt-3">

      {/* Pay Period Breakdown */}
      <div className="space-y-2 mb-3">
        {analysis.payPeriods.map((period, index) => {
          const barWidth =
            maxPeriodAmount > 0
              ? (period.totalAmount / maxPeriodAmount) * 100
              : 0;
          const isOverloaded =
            period.totalAmount > analysis.totalBillAmount / analysis.payPeriods.length * 1.15;
          const isUnderloaded =
            period.totalAmount < analysis.totalBillAmount / analysis.payPeriods.length * 0.85;

          return (
            <div key={period.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">
                  Pay Period {index + 1}{' '}
                  <span className="text-gray-400">
                    ({formatOrdinal(period.startDay)} - {formatOrdinal(period.endDay)})
                  </span>
                </span>
                <span className="font-medium">
                  {formatCurrency(period.totalAmount)}
                  <span className="text-gray-400 ml-1">
                    ({period.bills.length} bill{period.bills.length !== 1 ? 's' : ''})
                  </span>
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isOverloaded
                      ? 'bg-red-400'
                      : isUnderloaded
                      ? 'bg-blue-300'
                      : 'bg-green-400'
                  }`}
                  style={{ width: `${Math.max(barWidth, 5)}%` }}
                />
              </div>
              {/* Bill names */}
              {period.bills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {period.bills.map((bill) => (
                    <span
                      key={bill.id}
                      className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {bill.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>Heavy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>Balanced</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-300" />
          <span>Light</span>
        </div>
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={12} className="text-amber-500" />
            <span className="text-xs font-medium">Suggested Changes</span>
          </div>

          <div className="space-y-2">
            {analysis.suggestions.map((suggestion) => {
              const isApplied = appliedSuggestions.has(suggestion.debtId);

              return (
                <div
                  key={suggestion.debtId}
                  className={`p-2 rounded-lg ${
                    isApplied ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {isApplied ? (
                        <Check size={12} className="text-green-600 shrink-0" />
                      ) : (
                        <ArrowRight size={12} className="text-amber-500 shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{suggestion.debtName}</span>
                    </div>
                    {!isApplied && (
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="text-xs px-2 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  <div className="ml-5 text-xs text-gray-500">
                    <p>
                      Move from <span className="font-medium text-red-600">{formatOrdinal(suggestion.currentDueDay)}</span>
                      {' → '}
                      <span className="font-medium text-green-600">{formatOrdinal(suggestion.suggestedDueDay)}</span>
                    </p>
                    <p className="mt-0.5 text-gray-400 hidden sm:block">
                      {(() => {
                        // Find which periods are involved
                        const fromPeriod = analysis.payPeriods.find(
                          p => suggestion.currentDueDay >= p.startDay && suggestion.currentDueDay <= p.endDay
                        );
                        const toPeriod = analysis.payPeriods.find(
                          p => suggestion.suggestedDueDay >= p.startDay && suggestion.suggestedDueDay <= p.endDay
                        );
                        const fromIdx = fromPeriod ? analysis.payPeriods.indexOf(fromPeriod) + 1 : 0;
                        const toIdx = toPeriod ? analysis.payPeriods.indexOf(toPeriod) + 1 : 0;

                        if (fromPeriod && toPeriod) {
                          return `Pay period ${fromIdx} has ${formatCurrency(fromPeriod.totalAmount)} in bills. Moving this to period ${toIdx} (${formatCurrency(toPeriod.totalAmount)}) will balance your payments better.`;
                        }
                        return suggestion.reason;
                      })()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Apply All button */}
          {analysis.suggestions.some((s) => !appliedSuggestions.has(s.debtId)) && (
            <div className="mt-3">
              <button
                onClick={applyAllSuggestions}
                className="w-full py-1.5 bg-primary-500 text-white text-xs font-medium rounded-xl hover:bg-primary-600 transition-colors"
              >
                Apply All
              </button>
            </div>
          )}

          {/* All applied message */}
          {analysis.suggestions.every((s) => appliedSuggestions.has(s.debtId)) && (
            <div className="mt-3 p-2.5 bg-green-50 rounded-lg text-center">
              <CheckCircle size={16} className="text-green-600 mx-auto mb-1" />
              <p className="text-xs text-green-700 font-medium">
                All suggestions applied!
              </p>
              <p className="text-[10px] text-green-600">
                Your bills are now better balanced across pay periods.
              </p>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}
