/**
 * Home Page - Kawaii Edition
 *
 * Delightful dashboard showing overall debt payoff progress.
 * Features: Cute animations, encouraging messages, progress celebration.
 */

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Target, Sparkles, TrendingDown, Calendar, Wallet, Receipt, ChevronRight, Trophy, BarChart3, PieChart as PieChartIcon, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  calculateDebtSummary,
  generatePayoffPlan,
  formatTimeUntil,
  formatCurrency,
  formatPercent,
  calculatePayPeriodRemaining,
} from '../lib/calculations';
import { computeOverallMilestones, computeDebtPayoffTimeline, computePaymentStreak } from '../lib/milestones';
import { ProgressRing } from '../components/ui/ProgressRing';
import { DebtsyCow } from '../components/ui/DebtsyCow';
import { DebtOverTimeChart } from '../components/ui/DebtOverTimeChart';
import { MilestoneTracker } from '../components/ui/MilestoneTracker';
import { DebtPayoffTimeline } from '../components/ui/DebtPayoffTimeline';
import { PaymentStreakCard } from '../components/ui/PaymentStreakCard';
import { UpcomingBills } from '../components/ui/UpcomingBills';
import { MiniCalendar } from '../components/ui/MiniCalendar';
import { EmptyState } from '../components/ui/EmptyState';
import { InterestVsPrincipalChart } from '../components/analytics/InterestVsPrincipalChart';
import { DebtBreakdownChart } from '../components/analytics/DebtBreakdownChart';
import { PaymentHistorySummary } from '../components/analytics/PaymentHistorySummary';
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
  const { debts, strategy, settings, customCategories, budget, payments, subscriptions, receivedPaychecks } = useApp();

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

  // Get latest paycheck and calculate remaining
  const paycheckSummary = useMemo(() => {
    if (receivedPaychecks.length === 0) return null;

    // Get the most recent paycheck
    const sortedPaychecks = [...receivedPaychecks].sort(
      (a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime()
    );
    const latestPaycheck = sortedPaychecks[0];

    // Get the income source name
    const incomeSource = budget.incomeSources.find((s) => s.id === latestPaycheck.incomeSourceId);

    // Calculate remaining after bills
    const periodSummary = calculatePayPeriodRemaining(
      latestPaycheck,
      debts,
      subscriptions,
      true, // include subscriptions
      payments
    );

    return {
      paycheck: latestPaycheck,
      sourceName: incomeSource?.name || 'Unknown',
      remaining: periodSummary.remaining,
      totalBills: periodSummary.totalBills,
      totalSubscriptions: periodSummary.totalSubscriptions,
      billCount: periodSummary.bills.length,
      subCount: periodSummary.subs.length,
      unpaidBillCount: periodSummary.bills.filter((b) => !b.isPaid).length,
    };
  }, [receivedPaychecks, budget.incomeSources, debts, subscriptions, payments]);

  // Compute milestone data
  const totalOriginalBalance = useMemo(
    () => debts.reduce((sum, d) => sum + d.originalBalance, 0),
    [debts]
  );

  const overallMilestones = useMemo(
    () => computeOverallMilestones(summary.percentPaid, totalOriginalBalance, plan.monthlyBreakdown),
    [summary.percentPaid, totalOriginalBalance, plan.monthlyBreakdown]
  );

  const debtTimeline = useMemo(
    () => computeDebtPayoffTimeline(debts, plan),
    [debts, plan]
  );

  const streakData = useMemo(
    () => computePaymentStreak(payments, debts),
    [payments, debts]
  );

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
      <div className="min-h-screen animate-page-enter">
        {/* Header */}
        <header className="page-header bg-gradient-to-b from-primary-200 to-primary-100/50 px-4 pt-12 pb-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-300/20 rounded-full blur-2xl" />
          <div className="absolute top-1/2 -left-10 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
          <Sparkles size={16} className="absolute top-8 right-12 text-primary-400/40 animate-kawaii-pulse" />

          <div className="relative z-10 flex items-center gap-4">
            <DebtsyCow size={64} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Hi{settings.userName ? ` ${settings.userName}` : ''}!
                <span className="text-2xl animate-kawaii-float" style={{ animationDuration: '2s' }}>
                  {settings.theme.preset === 'cinnamoroll' ? '🦦' : settings.theme.preset === 'pompompurin' ? '🐥' : settings.theme.preset === 'keroppi' ? '🐸' : settings.theme.preset === 'chococat' ? '🐻' : settings.theme.preset === 'maple' ? '🦊' : settings.theme.preset === 'kuromi' ? '🌙' : settings.theme.preset === 'my-melody' || settings.theme.preset === 'hello-kitty' ? '🐷' : '🐰'}
                </span>
              </h1>
              <p className="text-gray-600 text-sm">Ready to start your debt-free journey?</p>
            </div>
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
    <div className="min-h-screen animate-page-enter">
      {/* Header */}
      <header className="page-header bg-gradient-to-br from-primary-300 via-primary-200 to-accent/20 px-4 pt-12 pb-8 relative overflow-hidden">
        {/* Glowing orbs - bolder */}
        <div className="absolute -top-6 -right-6 w-44 h-44 bg-primary-400/30 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-8 w-32 h-32 bg-accent/30 rounded-full blur-xl" />
        <div className="absolute top-2 right-1/3 w-24 h-24 bg-primary-500/15 rounded-full blur-xl" />
        <div className="absolute bottom-4 left-1/4 w-16 h-16 bg-accent/20 rounded-full blur-lg" />

        {/* Polka dot pattern - more visible */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none" aria-hidden="true">
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="3" fill="currentColor" className="text-primary-600" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Floating stars - bigger & brighter */}
        <div className="absolute top-2 right-6 animate-kawaii-float" style={{ animationDuration: '5s' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" className="text-primary-500/50">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-6 left-[55%] animate-kawaii-float" style={{ animationDuration: '3.5s', animationDelay: '2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" className="text-accent/50">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-10 left-[15%] animate-kawaii-float" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-primary-400/45">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" fill="currentColor" />
          </svg>
        </div>

        {/* Floating hearts - bigger & more visible */}
        <div className="absolute top-8 right-20 animate-kawaii-float" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" className="text-accent/55">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-12 right-[40%] animate-kawaii-float" style={{ animationDuration: '5.5s', animationDelay: '0.5s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-primary-400/50">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-3 left-[70%] animate-kawaii-float" style={{ animationDuration: '6s', animationDelay: '3s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" className="text-accent/40">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
          </svg>
        </div>

        {/* Floating bubbles */}
        <div className="absolute bottom-8 right-12 animate-kawaii-float" style={{ animationDuration: '6s', animationDelay: '0.5s' }}>
          <div className="w-5 h-5 rounded-full bg-primary-400/25 border-2 border-primary-400/30" />
        </div>
        <div className="absolute top-10 left-[40%] animate-kawaii-float" style={{ animationDuration: '4s', animationDelay: '2.5s' }}>
          <div className="w-3 h-3 rounded-full bg-accent/25 border-2 border-accent/30" />
        </div>
        <div className="absolute bottom-14 left-[60%] animate-kawaii-float" style={{ animationDuration: '5s', animationDelay: '1s' }}>
          <div className="w-4 h-4 rounded-full bg-primary-300/30 border-2 border-primary-300/35" />
        </div>

        {/* Sparkle icons - more & brighter */}
        <Sparkles size={18} className="absolute top-6 right-10 text-primary-500/60 animate-kawaii-pulse" />
        <Sparkles size={14} className="absolute top-14 right-28 text-accent/50 animate-kawaii-pulse" style={{ animationDelay: '1s' }} />
        <Sparkles size={12} className="absolute bottom-10 left-[30%] text-primary-400/45 animate-kawaii-pulse" style={{ animationDelay: '0.5s' }} />

        {/* Cute flower cluster (top-right corner) - bigger & bolder */}
        <svg className="absolute -top-1 -right-1 w-28 h-28 text-primary-400/30 animate-kawaii-pulse" style={{ animationDuration: '4s' }} viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="18" r="11" fill="currentColor" />
          <circle cx="57" cy="30" r="11" fill="currentColor" />
          <circle cx="50" cy="50" r="11" fill="currentColor" />
          <circle cx="30" cy="50" r="11" fill="currentColor" />
          <circle cx="23" cy="30" r="11" fill="currentColor" />
          <circle cx="40" cy="35" r="9" className="text-accent/35" fill="currentColor" />
        </svg>

        {/* Small flower (bottom-left) */}
        <svg className="absolute bottom-6 left-4 w-16 h-16 text-accent/25 animate-kawaii-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} viewBox="0 0 60 60" aria-hidden="true">
          <circle cx="30" cy="14" r="8" fill="currentColor" />
          <circle cx="42" cy="24" r="8" fill="currentColor" />
          <circle cx="38" cy="38" r="8" fill="currentColor" />
          <circle cx="22" cy="38" r="8" fill="currentColor" />
          <circle cx="18" cy="24" r="8" fill="currentColor" />
          <circle cx="30" cy="27" r="6" className="text-primary-300/35" fill="currentColor" />
        </svg>

        <div className="mb-4 relative z-10 flex items-center gap-4">
          <DebtsyCow size={72} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Hi{settings.userName ? ` ${settings.userName}` : ''}!
              <span className="text-2xl animate-kawaii-float" style={{ animationDuration: '2s' }}>
                {settings.theme.preset === 'my-melody' ? '🎀' : settings.theme.preset === 'kuromi' ? '💜' : '✨'}
              </span>
            </h1>
            <p className="text-gray-600 text-sm">{encouragement}</p>
          </div>
        </div>

        {/* Scalloped wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden">
          <svg viewBox="0 0 1200 40" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,20 C50,0 100,0 150,20 C200,40 250,40 300,20 C350,0 400,0 450,20 C500,40 550,40 600,20 C650,0 700,0 750,20 C800,40 850,40 900,20 C950,0 1000,0 1050,20 C1100,40 1150,40 1200,20 L1200,40 L0,40 Z" fill="currentColor" className="text-gray-50" />
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-5">
        {/* Progress Overview Card (Hero) */}
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

        {/* Milestone Tracker */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Milestones</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Track your progress</p>
            </div>
          </div>
          <MilestoneTracker milestones={overallMilestones} percentPaid={summary.percentPaid} />
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

        {/* Payment Streak */}
        <PaymentStreakCard streak={streakData} />

        {/* Paycheck Summary Card */}
        {paycheckSummary && (
          <Link to="/track" className="block">
            <div className="card bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-100 rounded-3xl relative overflow-hidden hover:shadow-md transition-all">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
              <Sparkles size={12} className="absolute top-3 right-12 text-primary-300 animate-kawaii-pulse" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-300/30">
                      <Receipt size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">Latest Paycheck</p>
                      <p className="text-sm font-bold text-gray-900">{paycheckSummary.sourceName}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-primary-400" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-white/60 dark:bg-gray-900/20 rounded-xl">
                    <p className="text-lg font-bold text-primary-600">
                      {formatCurrency(paycheckSummary.paycheck.actualAmount)}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">Received</p>
                  </div>
                  <div className="text-center p-2 bg-white/60 dark:bg-gray-900/20 rounded-xl">
                    <p className="text-lg font-bold text-red-500">
                      {formatCurrency(paycheckSummary.totalBills + paycheckSummary.totalSubscriptions)}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Bills ({paycheckSummary.unpaidBillCount}) + Subs
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white/60 dark:bg-gray-900/20 rounded-xl">
                    <p className={`text-lg font-bold ${paycheckSummary.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(paycheckSummary.remaining)}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">Remaining</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Pay period: {format(new Date(paycheckSummary.paycheck.payPeriodStart + 'T12:00:00'), 'MMM d')} – {format(new Date(paycheckSummary.paycheck.payPeriodEnd + 'T12:00:00'), 'MMM d')}
                  </span>
                  <span className="text-primary-600 font-semibold flex items-center gap-1">
                    View details
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

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

        {/* Debt Payoff Timeline */}
        {debtTimeline.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <ClipboardList size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Payoff Timeline</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">When each debt gets paid off</p>
              </div>
            </div>
            <DebtPayoffTimeline timeline={debtTimeline} />
          </div>
        )}

        {/* Upcoming Bills */}
        <UpcomingBills debts={debts} customCategories={customCategories} payments={payments} incomeSources={budget.incomeSources} subscriptions={subscriptions} />

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

        {/* Interest vs Principal Chart */}
        {plan.monthlyBreakdown && plan.monthlyBreakdown.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <PieChartIcon size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Interest vs Principal</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Where your payments go</p>
              </div>
            </div>
            <InterestVsPrincipalChart monthlyBreakdown={plan.monthlyBreakdown} />
          </div>
        )}

        {/* Debt Breakdown Chart */}
        {plan.monthlyBreakdown && plan.monthlyBreakdown.length > 0 && debts.length > 1 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Debt Breakdown</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Each debt over time</p>
              </div>
            </div>
            <DebtBreakdownChart monthlyBreakdown={plan.monthlyBreakdown} debts={debts} />
          </div>
        )}

        {/* Mini Calendar */}
        <MiniCalendar debts={debts} incomeSources={budget.incomeSources} customCategories={customCategories} />

        {/* Payment History */}
        {payments.filter((p) => p.isCompleted).length > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Receipt size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Payment History</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your actual payments</p>
              </div>
            </div>
            <PaymentHistorySummary payments={payments} />
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
