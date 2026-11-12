/**
 * Pay Period Summary Component
 *
 * Shows remaining balance after bills and subscriptions for a pay period.
 * Includes toggle to show/hide subscriptions in calculation. Ranch card,
 * styled in pages/track.css (.ppr-*).
 */

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Check, ChevronDown, ChevronUp, CreditCard, DollarSign, Repeat } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculatePayPeriodRemaining, formatCurrency } from '../../lib/calculations';
import type { ReceivedPaycheck } from '../../types';
import '../../pages/track.css';

/**
 * Parse a date string that may be yyyy-MM-dd or full ISO format
 */
function parseDateForDisplay(dateStr: string): Date {
  if (dateStr.length === 10) {
    return new Date(dateStr + 'T12:00:00');
  }
  return new Date(dateStr);
}

interface PayPeriodSummaryProps {
  paycheck: ReceivedPaycheck;
}

export function PayPeriodSummary({ paycheck }: PayPeriodSummaryProps) {
  const { debts, subscriptions, payments } = useApp();
  const [includeSubscriptions, setIncludeSubscriptions] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const summary = useMemo(() => {
    return calculatePayPeriodRemaining(paycheck, debts, subscriptions, includeSubscriptions, payments);
  }, [paycheck, debts, subscriptions, includeSubscriptions, payments]);

  const isPositive = summary.remaining >= 0;

  return (
    <div className="ppr">
      <div className="ppr-head">
        <h3>Pay Period Summary</h3>
        <span className="ppr-range">
          {format(parseDateForDisplay(paycheck.payPeriodStart), 'MMM d')} - {format(parseDateForDisplay(paycheck.payPeriodEnd), 'MMM d')}
        </span>
      </div>

      <div className="ppr-rows">
        <div className="ppr-row">
          <span className="ppr-ic is-ok"><DollarSign size={16} aria-hidden="true" /></span>
          <span className="ppr-l">Paycheck</span>
          <b className="num">{formatCurrency(summary.totalIncome)}</b>
        </div>

        <div className="ppr-row">
          <span className="ppr-ic is-bad"><CreditCard size={16} aria-hidden="true" /></span>
          <span className="ppr-l">Bills ({summary.bills.length})</span>
          <b className="num is-bad">-{formatCurrency(summary.totalBills)}</b>
        </div>

        <div className="ppr-row">
          <span className="ppr-ic is-soon"><Repeat size={16} aria-hidden="true" /></span>
          <span className="ppr-l">
            Subscriptions ({summary.subs.length})
            <button
              type="button"
              onClick={() => setIncludeSubscriptions(!includeSubscriptions)}
              className={`ppr-toggle${includeSubscriptions ? ' is-on' : ''}`}
              aria-pressed={includeSubscriptions}
              aria-label="Include subscriptions"
            >
              {includeSubscriptions ? 'ON' : 'OFF'}
            </button>
          </span>
          <b className={`num${includeSubscriptions ? '' : ' is-off'}`}>-{formatCurrency(summary.totalSubscriptions)}</b>
        </div>

        <div className="ppr-row ppr-total">
          <span className="ppr-l">Remaining</span>
          <b className={`num ppr-big ${isPositive ? 'is-ok' : 'is-bad'}`}>{formatCurrency(summary.remaining)}</b>
        </div>
      </div>

      {(summary.bills.length > 0 || summary.subs.length > 0) && (
        <button type="button" onClick={() => setShowDetails(!showDetails)} className="ppr-more" aria-expanded={showDetails}>
          {showDetails ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      )}

      {showDetails && (
        <div className="ppr-detail">
          {summary.bills.length > 0 && (
            <div>
              <h4><CreditCard size={15} aria-hidden="true" />Bills Due This Period</h4>
              <ul>
                {summary.bills.map((bill, idx) => (
                  <li key={idx} className={bill.isPaid ? 'is-paid' : ''}>
                    <span className="ppr-d-n">
                      {bill.isPaid && <span className="ppr-d-ck"><Check size={11} aria-hidden="true" /></span>}
                      <span className="ppr-d-name">{bill.name}</span>
                      <small>due {format(bill.dueDate, 'MMM d')}</small>
                      {bill.isPaid && <em>Paid</em>}
                    </span>
                    <b className="num ppr-d-amt">{formatCurrency(bill.amount)}</b>
                  </li>
                ))}
              </ul>
              {summary.bills.some((b) => !b.isPaid) && (
                <p className="ppr-d-sum">
                  <span>Remaining Unpaid</span>
                  <b className="num is-bad">{formatCurrency(summary.bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0))}</b>
                </p>
              )}
            </div>
          )}

          {includeSubscriptions && summary.subs.length > 0 && (
            <div>
              <h4><Repeat size={15} aria-hidden="true" />Subscriptions This Period</h4>
              <ul>
                {summary.subs.map((sub, idx) => (
                  <li key={idx}>
                    <span className="ppr-d-n">
                      <span className="ppr-d-name">{sub.name}</span>
                      <small>{format(sub.billingDate, 'MMM d')}</small>
                    </span>
                    <b className="num ppr-d-amt">{formatCurrency(sub.amount)}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.bills.length === 0 && (!includeSubscriptions || summary.subs.length === 0) && (
            <p className="ppr-none">No bills or subscriptions due this period</p>
          )}
        </div>
      )}
    </div>
  );
}
