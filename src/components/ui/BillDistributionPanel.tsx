/**
 * Bill Distribution Panel
 *
 * Displays analysis of how bills are distributed across pay periods
 * and suggests optimal due dates to balance payments. Ranch card with a plank
 * heading (styled in pages/track.css, .bdp-*); the heavy/balanced/light bars
 * use the focus, paid and neutral ranch colors.
 */

import { useMemo, useState } from 'react';
import { Lightbulb, Check, ArrowRight, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import { Plank } from '../dashboard/RanchPanels';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatOrdinal } from '../../lib/calculations';
import {
  analyzeBillDistribution,
  type BillSuggestion,
} from '../../lib/billDistribution';
import type { Debt, IncomeSource } from '../../types';
import '../../pages/track.css';

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
      <section className="rui-card bdp bdp-note">
        <Lightbulb size={18} aria-hidden="true" />
        <span>{analysis.message}</span>
      </section>
    );
  }

  // Don't show if already balanced and no suggestions
  if (analysis.isBalanced && analysis.suggestions.length === 0) {
    return (
      <section className="rui-card bdp bdp-note is-ok">
        <CheckCircle size={18} aria-hidden="true" />
        <span>{analysis.message}</span>
      </section>
    );
  }

  const avg = analysis.totalBillAmount / analysis.payPeriods.length;

  return (
    <section className="rui-card bdp">
      {/* Header: always visible, clicking toggles body */}
      <button type="button" onClick={toggleCollapsed} className="bdp-toggle" aria-expanded={!collapsed}>
        <Plank icon={<Lightbulb size={18} aria-hidden="true" />}>Bill Distribution</Plank>
        <span className={`rui-badge ${analysis.isBalanced ? 'ok' : 'soon'}`}>{analysis.balanceScore}% balanced</span>
        <ChevronDown size={20} className={`bdp-chev${collapsed ? '' : ' is-open'}`} aria-hidden="true" />
      </button>

      {!collapsed && (
        <div className="bdp-body">
          {/* Pay Period Breakdown */}
          <ul className="bdp-periods">
            {analysis.payPeriods.map((period, index) => {
              const barWidth = maxPeriodAmount > 0 ? (period.totalAmount / maxPeriodAmount) * 100 : 0;
              const state = period.totalAmount > avg * 1.15 ? 'is-heavy' : period.totalAmount < avg * 0.85 ? 'is-light' : 'is-even';

              return (
                <li key={period.id}>
                  <div className="bdp-p-t">
                    <span>
                      Pay Period {index + 1} <small>({formatOrdinal(period.startDay)} - {formatOrdinal(period.endDay)})</small>
                    </span>
                    <b className="num">
                      {formatCurrency(period.totalAmount)}
                      <small>({period.bills.length} bill{period.bills.length !== 1 ? 's' : ''})</small>
                    </b>
                  </div>
                  <div className="trk-track">
                    <i className={state} style={{ width: `${Math.max(barWidth, 5)}%` }} />
                  </div>
                  {period.bills.length > 0 && (
                    <div className="bdp-chips">
                      {period.bills.map((bill) => (
                        <span key={bill.id}>{bill.name}</span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <ul className="cht-legend bdp-legend">
            <li><i className="cht-dot is-heavy" /><span>Heavy</span></li>
            <li><i className="cht-dot is-even" /><span>Balanced</span></li>
            <li><i className="cht-dot is-light" /><span>Light</span></li>
          </ul>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="bdp-sug">
              <h4><AlertTriangle size={16} aria-hidden="true" />Suggested Changes</h4>

              <ul>
                {analysis.suggestions.map((suggestion) => {
                  const isApplied = appliedSuggestions.has(suggestion.debtId);

                  return (
                    <li key={suggestion.debtId} className={isApplied ? 'is-applied' : ''}>
                      <div className="bdp-s-t">
                        <span className="bdp-s-n">
                          {isApplied ? <Check size={15} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}
                          {suggestion.debtName}
                        </span>
                        {!isApplied && (
                          <button type="button" onClick={() => applySuggestion(suggestion)} className="trk-btn is-sm">
                            Apply
                          </button>
                        )}
                      </div>
                      <p>
                        Move from <b className="is-bad">{formatOrdinal(suggestion.currentDueDay)}</b>
                        {' → '}
                        <b className="is-ok">{formatOrdinal(suggestion.suggestedDueDay)}</b>
                      </p>
                      <p className="bdp-why">
                        {(() => {
                          // Find which periods are involved
                          const fromPeriod = analysis.payPeriods.find(
                            (p) => suggestion.currentDueDay >= p.startDay && suggestion.currentDueDay <= p.endDay
                          );
                          const toPeriod = analysis.payPeriods.find(
                            (p) => suggestion.suggestedDueDay >= p.startDay && suggestion.suggestedDueDay <= p.endDay
                          );
                          const fromIdx = fromPeriod ? analysis.payPeriods.indexOf(fromPeriod) + 1 : 0;
                          const toIdx = toPeriod ? analysis.payPeriods.indexOf(toPeriod) + 1 : 0;

                          if (fromPeriod && toPeriod) {
                            return `Pay period ${fromIdx} has ${formatCurrency(fromPeriod.totalAmount)} in bills. Moving this to period ${toIdx} (${formatCurrency(toPeriod.totalAmount)}) will balance your payments better.`;
                          }
                          return suggestion.reason;
                        })()}
                      </p>
                    </li>
                  );
                })}
              </ul>

              {/* Apply All button */}
              {analysis.suggestions.some((s) => !appliedSuggestions.has(s.debtId)) && (
                <button type="button" onClick={applyAllSuggestions} className="trk-btn bdp-all">
                  Apply All
                </button>
              )}

              {/* All applied message */}
              {analysis.suggestions.every((s) => appliedSuggestions.has(s.debtId)) && (
                <div className="bdp-done">
                  <CheckCircle size={20} aria-hidden="true" />
                  <b>All suggestions applied!</b>
                  <span>Your bills are now better balanced across pay periods.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
