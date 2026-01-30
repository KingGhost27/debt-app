/**
 * Home Page
 *
 * Dashboard showing overall debt payoff progress.
 * Features: Debt-free countdown, progress overview, category breakdown,
 * payoff timeline chart, credit utilization, daily inspiration.
 */

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Settings, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  calculateDebtSummary,
  generatePayoffPlan,
  formatTimeUntil,
  formatCurrency,
  formatPercent,
} from '../lib/calculations';
import { ProgressRing } from '../components/ui/ProgressRing';
import { DebtOverTimeChart } from '../components/ui/DebtOverTimeChart';
import { CATEGORY_INFO } from '../types';

export function HomePage() {
  const { debts, strategy, settings } = useApp();

  // Calculate summary stats
  const summary = useMemo(() => calculateDebtSummary(debts), [debts]);

  // Generate payoff plan
  const plan = useMemo(
    () => generatePayoffPlan(debts, strategy),
    [debts, strategy]
  );

  const debtFreeDate = plan.debtFreeDate ? parseISO(plan.debtFreeDate) : null;
  const timeUntilDebtFree = debtFreeDate ? formatTimeUntil(debtFreeDate) : null;

  // Get payoff milestones in order
  const payoffMilestones = useMemo(() => {
    const milestones: { debtId: string; debtName: string; payoffDate: string; totalPaid: number }[] = [];
    plan.steps.forEach((step) => {
      step.milestonesInStep.forEach((milestone) => {
        milestones.push(milestone);
      });
    });
    return milestones;
  }, [plan.steps]);

  // Get categories with balances
  const categories = useMemo(() => {
    return Object.entries(summary.debtsByCategory)
      .filter(([, balance]) => balance > 0)
      .map(([category, balance]) => ({
        category,
        balance,
        ...CATEGORY_INFO[category as keyof typeof CATEGORY_INFO],
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [summary.debtsByCategory]);

  if (debts.length === 0) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-gradient-to-b from-primary-200 to-primary-100/50 px-4 pt-12 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hi{settings.userName ? ` ${settings.userName}` : ''}!
              </h1>
              <p className="text-gray-600">Plan, track and achieve your payoff goal</p>
            </div>
            <Link
              to="/settings"
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Settings size={20} className="text-gray-500" />
            </Link>
          </div>
        </header>

        {/* Empty state */}
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Start Your Debt-Free Journey
          </h2>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Add your debts to see your personalized payoff plan and track your progress.
          </p>
          <a
            href="/debts"
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            Add Your First Debt
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-b from-primary-200 to-primary-100/50 px-4 pt-12 pb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hi{settings.userName ? ` ${settings.userName}` : ''}!
            </h1>
            <p className="text-gray-600">Plan, track and achieve your payoff goal</p>
          </div>
          <Link
            to="/settings"
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Settings size={20} className="text-gray-400" />
          </Link>
        </div>

        {/* Debt-Free Countdown */}
        {debtFreeDate && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-4 text-white">
            <p className="text-primary-100 text-sm font-medium">DEBT-FREE COUNTDOWN</p>
            <p className="text-xl font-bold mt-1">
              {format(debtFreeDate, 'MMMM yyyy').toUpperCase()}
            </p>
            <div className="flex gap-4 mt-2">
              {timeUntilDebtFree && (
                <p className="text-primary-100">{timeUntilDebtFree}</p>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Up Next - First Debt to Pay Off */}
        {payoffMilestones.length > 0 && (() => {
          const nextDebt = debts.find(d => d.id === payoffMilestones[0].debtId);
          return (
            <div className="card bg-gradient-to-r from-primary-50 to-white border border-primary-100">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center">
                  <Target size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">Up Next</p>
                  <p className="font-semibold text-gray-900 truncate">
                    {payoffMilestones[0].debtName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Paid off by {format(parseISO(payoffMilestones[0].payoffDate), 'MMMM yyyy')}
                  </p>
                </div>
                {nextDebt && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="font-bold text-primary-600">{formatCurrency(nextDebt.balance)}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Payoff Progress Card */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🦋</span>
            <div>
              <p className="text-xs text-gray-500">Debt Payoff</p>
              <p className="font-semibold">Planner</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4">Payoff progress</h2>

          <div className="flex items-center gap-6">
            <ProgressRing
              percentage={summary.percentPaid}
              size={100}
              strokeWidth={10}
            />
            <div>
              <p className="text-sm text-gray-500">Principal paid</p>
              <p className="text-xl font-bold text-primary-500">
                {formatCurrency(summary.principalPaid)}
              </p>
              <p className="text-sm text-gray-500 mt-2">Balance</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(summary.totalBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Debt Over Time Chart */}
        {plan.monthlyBreakdown && plan.monthlyBreakdown.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Debt Over Time</h2>
            <DebtOverTimeChart plan={plan} startingBalance={summary.totalBalance} />
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="card">
            <h3 className="text-sm text-gray-500 mb-4">CATEGORIES</h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.slice(0, 4).map((cat) => {
                const categoryDebts = debts.filter((d) => d.category === cat.category);
                const originalTotal = categoryDebts.reduce((sum, d) => sum + d.originalBalance, 0);
                const percentPaid = originalTotal > 0
                  ? ((originalTotal - cat.balance) / originalTotal) * 100
                  : 0;

                return (
                  <div key={cat.category} className="text-center">
                    <p className="text-sm font-medium" style={{ color: cat.color }}>
                      {cat.label}
                    </p>
                    <ProgressRing
                      percentage={percentPaid}
                      size={60}
                      strokeWidth={6}
                      color={cat.color}
                      className="mx-auto my-2"
                    />
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="font-semibold">{formatCurrency(cat.balance)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Credit Utilization */}
        {summary.totalCreditLimit > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Overall credit utilization</h2>
            <p className="text-sm text-gray-500 mb-4">
              This only includes debts that have a credit limit.
            </p>
            <div className="flex justify-center">
              <div className="relative">
                <ProgressRing
                  percentage={summary.creditUtilization}
                  size={120}
                  strokeWidth={12}
                  color={summary.creditUtilization > 30 ? '#ef4444' : '#22c55e'}
                  showLabel={false}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${summary.creditUtilization > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatPercent(summary.creditUtilization, 0)}
                  </span>
                  <span className="text-xs text-gray-500">credit utilized</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {formatCurrency(summary.totalBalance - (summary.totalBalance - debts
                .filter(d => d.creditLimit)
                .reduce((sum, d) => sum + d.balance, 0)))} / {formatCurrency(summary.totalCreditLimit)}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Debt</span>
              <span className="font-semibold text-gray-900">{formatCurrency(summary.totalBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Minimums</span>
              <span className="font-semibold text-gray-900">{formatCurrency(summary.totalMinimumPayments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Interest</span>
              <span className="font-semibold text-red-500">
                {formatCurrency(plan.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Number of Debts</span>
              <span className="font-semibold text-gray-900">{debts.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
