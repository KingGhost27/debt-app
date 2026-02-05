/**
 * Home Page - Kawaii Edition
 *
 * Delightful dashboard showing overall debt payoff progress.
 * Features: Cute animations, encouraging messages, progress celebration.
 */

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Target, Sparkles, TrendingDown, Calendar, Wallet } from 'lucide-react';
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
import { UpcomingBills } from '../components/ui/UpcomingBills';
import { MiniCalendar } from '../components/ui/MiniCalendar';
import { EmptyState } from '../components/ui/EmptyState';
import { CATEGORY_INFO } from '../types';

// Encouraging messages based on progress
const getEncouragement = (percentPaid: number) => {
  if (percentPaid >= 100) return "You did it! You're debt-free!";
  if (percentPaid >= 75) return "Almost there! You're doing amazing!";
  if (percentPaid >= 50) return "Halfway there! Keep going!";
  if (percentPaid >= 25) return "Great progress! You've got this!";
  if (percentPaid > 0) return "Every payment counts!";
  return "Let's start your journey!";
};

export function HomePage() {
  const { debts, strategy, settings, customCategories, budget, payments, subscriptions } = useApp();

  // Calculate summary stats
  const summary = useMemo(() => calculateDebtSummary(debts), [debts]);

  // Generate payoff plan
  const plan = useMemo(
    () => generatePayoffPlan(debts, strategy),
    [debts, strategy]
  );

  const debtFreeDate = plan.debtFreeDate ? parseISO(plan.debtFreeDate) : null;
  const timeUntilDebtFree = debtFreeDate ? formatTimeUntil(debtFreeDate) : null;
  const encouragement = getEncouragement(summary.percentPaid);

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
        <header className="page-header bg-gradient-to-b from-primary-200 to-primary-100/50 px-4 pt-12 pb-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-300/20 rounded-full blur-2xl" />
          <div className="absolute top-1/2 -left-10 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
          <Sparkles size={16} className="absolute top-8 right-12 text-primary-400/40 animate-kawaii-pulse" />

          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Hi{settings.userName ? ` ${settings.userName}` : ''}!
              <span className="text-2xl animate-kawaii-float" style={{ animationDuration: '2s' }}>
                {settings.theme.preset === 'my-melody' ? '🎀' : settings.theme.preset === 'kuromi' ? '💜' : '✨'}
              </span>
            </h1>
            <p className="text-gray-600 text-sm">Ready to start your debt-free journey?</p>
          </div>

          {/* Wave decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-4 overflow-hidden">
            <svg viewBox="0 0 1200 30" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,15 Q300,30 600,15 T1200,15 L1200,30 L0,30 Z" fill="currentColor" className="text-gray-50" />
            </svg>
          </div>
        </header>

        {/* Empty state */}
        <div className="px-4">
          <EmptyState
            icon="🎯"
            title="Start Your Debt-Free Journey"
            description="Add your debts to see your personalized payoff plan and track your progress toward financial freedom!"
            action={{ label: "Add Your First Debt", href: "/debts" }}
            encouragement="You've got this!"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="page-header bg-gradient-to-b from-primary-200 to-primary-100/50 px-4 pt-12 pb-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-300/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-10 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
        <Sparkles size={16} className="absolute top-8 right-12 text-primary-400/40 animate-kawaii-pulse" />

        <div className="mb-4 relative z-10">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Hi{settings.userName ? ` ${settings.userName}` : ''}!
            <span className="text-2xl animate-kawaii-float" style={{ animationDuration: '2s' }}>
              {settings.theme.preset === 'my-melody' ? '🎀' : settings.theme.preset === 'kuromi' ? '💜' : '✨'}
            </span>
          </h1>
          <p className="text-gray-600 text-sm">{encouragement}</p>
        </div>

        {/* Debt-Free Countdown Card */}
        {debtFreeDate && (
          <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 rounded-3xl p-5 text-white overflow-hidden shadow-lg shadow-primary-400/30">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-primary-200" />
                <p className="text-primary-200 text-xs font-semibold tracking-wider uppercase">Debt-Free Countdown</p>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {format(debtFreeDate, 'MMMM yyyy')}
              </p>
              {timeUntilDebtFree && (
                <p className="text-primary-200 text-sm mt-1 flex items-center gap-1">
                  <Sparkles size={12} className="animate-kawaii-pulse" />
                  {timeUntilDebtFree} to go!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-4 overflow-hidden">
          <svg viewBox="0 0 1200 30" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,15 Q300,30 600,15 T1200,15 L1200,30 L0,30 Z" fill="currentColor" className="text-gray-50" />
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-5">
        {/* Up Next - First Debt to Pay Off */}
        {payoffMilestones.length > 0 && (() => {
          const nextDebt = debts.find(d => d.id === payoffMilestones[0].debtId);
          return (
            <div className="relative bg-gradient-to-r from-primary-600 via-primary-400 to-primary-200 rounded-3xl p-5 text-white overflow-hidden shadow-lg shadow-primary-400/30">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

              <div className="relative z-10 flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Target size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={12} className="text-primary-200" />
                    <p className="text-xs font-semibold text-primary-200 uppercase tracking-wide">Up Next</p>
                  </div>
                  <p className="font-bold text-white truncate">
                    {payoffMilestones[0].debtName}
                  </p>
                  <p className="text-sm text-primary-200">
                    Paid off by {format(parseISO(payoffMilestones[0].payoffDate), 'MMMM yyyy')}
                  </p>
                </div>
                {nextDebt && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-primary-200 mb-1">Balance</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(nextDebt.balance)}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Progress Overview Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <TrendingDown size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Payoff Progress</h2>
              <p className="text-xs text-gray-500">You're doing great!</p>
            </div>
          </div>

          {/* Progress Ring + Stats */}
          <div className="flex items-center gap-6 mb-6">
            <ProgressRing
              percentage={summary.percentPaid}
              size={110}
              strokeWidth={12}
              showSparkle
            />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Paid Off</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(summary.principalPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Remaining</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(summary.totalBalance)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-box">
              <p className="text-xs text-gray-500 mb-1">Total Interest</p>
              <p className="text-lg font-bold text-red-500">
                {formatCurrency(plan.totalInterest)}
              </p>
            </div>
            <div className="stat-box">
              <p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
              <p className="text-lg font-bold text-primary-600">
                {formatCurrency(strategy.recurringFunding.amount)}
              </p>
            </div>
            <div className="stat-box">
              <p className="text-xs text-gray-500 mb-1"># of Debts</p>
              <p className="text-lg font-bold text-gray-900">{debts.length}</p>
            </div>
            <div className="stat-box">
              <p className="text-xs text-gray-500 mb-1">Time Left</p>
              <p className="text-lg font-bold text-green-600">
                {timeUntilDebtFree || 'N/A'}
              </p>
            </div>
          </div>

          {/* Strategy Savings Callout */}
          {(() => {
            const minOnlyPlan = generatePayoffPlan(debts, {
              ...strategy,
              recurringFunding: { ...strategy.recurringFunding, amount: summary.totalMinimumPayments },
            });
            const savings = minOnlyPlan.totalInterest - plan.totalInterest;
            const strategyName = strategy.strategy === 'avalanche' ? 'Avalanche' : 'Snowball';

            if (savings > 0) {
              return (
                <div className="mt-4 relative bg-gradient-to-r from-primary-600 via-primary-400 to-primary-200 rounded-2xl p-4 text-white overflow-hidden shadow-lg shadow-primary-400/30">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Wallet size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Saving <span className="text-primary-100 font-bold">{formatCurrency(savings)}</span> in interest!
                      </p>
                      <p className="text-xs text-primary-100">
                        By paying extra with {strategyName}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Upcoming Bills */}
        <UpcomingBills debts={debts} customCategories={customCategories} payments={payments} incomeSources={budget.incomeSources} subscriptions={subscriptions} />

        {/* Mini Calendar */}
        <MiniCalendar debts={debts} incomeSources={budget.incomeSources} customCategories={customCategories} />

        {/* Debt Over Time Chart */}
        {plan.monthlyBreakdown && plan.monthlyBreakdown.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <TrendingDown size={20} className="text-white" />
              </div>
              <h2 className="font-bold text-gray-900">Debt Over Time</h2>
            </div>
            <DebtOverTimeChart plan={plan} startingBalance={summary.totalBalance} />
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={12} />
              Categories
            </h3>
            <div className="space-y-3">
              {categories.slice(0, 4).map((cat) => {
                const categoryDebts = debts.filter((d) => d.category === cat.category);
                const originalTotal = categoryDebts.reduce((sum, d) => sum + d.originalBalance, 0);
                const percentPaid = originalTotal > 0
                  ? ((originalTotal - cat.balance) / originalTotal) * 100
                  : 0;

                return (
                  <div key={cat.category} className="flex items-center gap-4 p-3 rounded-2xl bg-primary-50/80 hover:bg-primary-100/80 transition-colors border border-primary-100">
                    <ProgressRing
                      percentage={percentPaid}
                      size={56}
                      strokeWidth={6}
                      color={cat.color}
                      backgroundColor={`${cat.color}20`}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: cat.color }}>
                        {cat.label}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {categoryDebts.map((debt) => (
                          <p key={debt.id} className="text-xs text-gray-600 truncate">
                            {debt.name}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 mb-0.5">Balance</p>
                      <p className="font-bold text-gray-900">{formatCurrency(cat.balance)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Credit Utilization */}
        {summary.totalCreditLimit > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-2">Credit Utilization</h2>
            <p className="text-sm text-gray-500 mb-4">
              Only includes debts with a credit limit
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
                  <span className="text-xs text-gray-500">utilized</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-3">
              {formatCurrency(debts.filter(d => d.creditLimit).reduce((sum, d) => sum + d.balance, 0))} / {formatCurrency(summary.totalCreditLimit)}
            </p>
          </div>
        )}

        {/* Summary Card */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-primary-400" />
            Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Debt</span>
              <span className="font-bold text-gray-900">{formatCurrency(summary.totalBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Monthly Minimums</span>
              <span className="font-bold text-gray-900">{formatCurrency(summary.totalMinimumPayments)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Interest</span>
              <span className="font-bold text-red-500">{formatCurrency(plan.totalInterest)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Number of Debts</span>
              <span className="font-bold text-gray-900">{debts.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
