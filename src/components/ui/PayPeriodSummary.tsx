/**
 * Pay Period Summary Component
 *
 * Shows remaining balance after bills and subscriptions for a pay period.
 * Includes toggle to show/hide subscriptions in calculation.
 */

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DollarSign, CreditCard, Tv, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculatePayPeriodRemaining,
  formatCurrency,
} from '../../lib/calculations';
import type { ReceivedPaycheck } from '../../types';

interface PayPeriodSummaryProps {
  paycheck: ReceivedPaycheck;
}

export function PayPeriodSummary({ paycheck }: PayPeriodSummaryProps) {
  const { debts, subscriptions } = useApp();
  const [includeSubscriptions, setIncludeSubscriptions] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const summary = useMemo(() => {
    return calculatePayPeriodRemaining(
      paycheck,
      debts,
      subscriptions,
      includeSubscriptions
    );
  }, [paycheck, debts, subscriptions, includeSubscriptions]);

  const isPositive = summary.remaining >= 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-3 border-b border-primary-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-primary-900">Pay Period Summary</h3>
          <span className="text-sm text-primary-600">
            {format(parseISO(paycheck.payPeriodStart), 'MMM d')} -{' '}
            {format(parseISO(paycheck.payPeriodEnd), 'MMM d')}
          </span>
        </div>
      </div>

      {/* Main Summary */}
      <div className="p-4 space-y-3">
        {/* Income */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-gray-700">Paycheck</span>
          </div>
          <span className="font-semibold text-gray-900">
            {formatCurrency(summary.totalIncome)}
          </span>
        </div>

        {/* Bills */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-gray-700">
              Bills ({summary.bills.length})
            </span>
          </div>
          <span className="font-semibold text-red-600">
            -{formatCurrency(summary.totalBills)}
          </span>
        </div>

        {/* Subscriptions Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Tv className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-gray-700">
              Subscriptions ({summary.subs.length})
            </span>
            <button
              onClick={() => setIncludeSubscriptions(!includeSubscriptions)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                includeSubscriptions
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {includeSubscriptions ? 'ON' : 'OFF'}
            </button>
          </div>
          <span
            className={`font-semibold ${
              includeSubscriptions ? 'text-purple-600' : 'text-gray-400 line-through'
            }`}
          >
            -{formatCurrency(summary.totalSubscriptions)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3">
          {/* Remaining */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Remaining</span>
            <span
              className={`text-xl font-bold ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(summary.remaining)}
            </span>
          </div>
        </div>

        {/* Details Toggle */}
        {(summary.bills.length > 0 || summary.subs.length > 0) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 pt-2"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show details
              </>
            )}
          </button>
        )}
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
          {/* Bills Detail */}
          {summary.bills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                Bills Due This Period
              </h4>
              <div className="space-y-2">
                {summary.bills.map((bill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{bill.name}</span>
                      <span className="text-xs text-gray-400">
                        (due {format(bill.dueDate, 'MMM d')})
                      </span>
                    </div>
                    <span className="text-gray-900">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions Detail */}
          {includeSubscriptions && summary.subs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Tv className="w-4 h-4" />
                Subscriptions This Period
              </h4>
              <div className="space-y-2">
                {summary.subs.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{sub.name}</span>
                      <span className="text-xs text-gray-400">
                        ({format(sub.billingDate, 'MMM d')})
                      </span>
                    </div>
                    <span className="text-gray-900">
                      {formatCurrency(sub.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.bills.length === 0 && (!includeSubscriptions || summary.subs.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-2">
              No bills or subscriptions due this period
            </p>
          )}
        </div>
      )}
    </div>
  );
}
