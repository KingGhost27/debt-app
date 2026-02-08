/**
 * Track Page - Kawaii Edition
 *
 * Track upcoming and completed payments with monthly summary,
 * payment streaks, and calendar view.
 * Features cute animations, soft gradients, and delightful interactions.
 */

import { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
} from 'date-fns';
import { Check, Plus, Flame, CheckCircle, AlertCircle, X, Undo2, Pencil, Receipt, Calendar, Sparkles, Trophy, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { MiniCalendar } from '../components/ui/MiniCalendar';
import { PaymentModal } from '../components/ui/PaymentModal';
import { PaycheckModal } from '../components/ui/PaycheckModal';
import { PayPeriodSummary } from '../components/ui/PayPeriodSummary';
import { BillDistributionPanel } from '../components/ui/BillDistributionPanel';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, generatePayoffPlan } from '../lib/calculations';
import { computePaymentStreak } from '../lib/milestones';
import type { Debt, PaymentType, Payment, ReceivedPaycheck } from '../types';

type TabType = 'upcoming' | 'complete' | 'calendar' | 'paychecks';

export function TrackPage() {
  const { debts, strategy, payments, budget, deletePayment, updateDebt, customCategories, receivedPaychecks, deletePaycheck, subscriptions } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [preselectedDebt, setPreselectedDebt] = useState<Debt | undefined>();
  const [preselectedAmount, setPreselectedAmount] = useState<number | undefined>();
  const [preselectedType, setPreselectedType] = useState<PaymentType | undefined>();
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();

  // Paycheck modal state
  const [isPaycheckModalOpen, setIsPaycheckModalOpen] = useState(false);
  const [editingPaycheck, setEditingPaycheck] = useState<ReceivedPaycheck | undefined>();
  const [selectedPaycheck, setSelectedPaycheck] = useState<ReceivedPaycheck | undefined>();

  // Generate upcoming payments from payoff plan
  const plan = useMemo(
    () => generatePayoffPlan(debts, strategy),
    [debts, strategy]
  );

  // Group monthly breakdown by month
  const upcomingByMonth = useMemo(() => {
    const grouped: Record<string, typeof plan.monthlyBreakdown[0]['payments']> = {};

    // Take next 6 months of payments
    plan.monthlyBreakdown.slice(0, 6).forEach((month) => {
      const monthKey = month.month;
      grouped[monthKey] = month.payments;
    });

    return grouped;
  }, [plan]);

  // Get completed payments
  const completedPayments = useMemo(
    () =>
      payments
        .filter((p) => p.isCompleted)
        .sort(
          (a, b) =>
            new Date(b.completedAt || 0).getTime() -
            new Date(a.completedAt || 0).getTime()
        ),
    [payments]
  );

  // This month stats
  const thisMonthStats = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Completed payments this month
    const paidThisMonth = payments
      .filter((p) => p.isCompleted && p.completedAt)
      .filter((p) => {
        const date = parseISO(p.completedAt!);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Expected payments this month (from plan)
    const currentMonthKey = format(now, 'yyyy-MM');
    const currentMonthPlan = plan.monthlyBreakdown.find(
      (m) => m.month === currentMonthKey
    );
    const expectedThisMonth = currentMonthPlan?.totalPayment || 0;

    // Count bills due this month
    const billsDueThisMonth = debts.length;
    const billsPaidThisMonth = payments.filter((p) => {
      if (!p.isCompleted || !p.completedAt) return false;
      const date = parseISO(p.completedAt);
      return isSameMonth(date, now);
    }).length;

    // Check for actually overdue bills (due date has passed and not paid this month)
    const overdueCount = debts.filter((debt) => {
      // Bill is overdue if: due day has passed AND not paid this month
      const isPastDue = debt.dueDay < currentDay;
      const isPaidThisMonth = payments.some((p) => {
        if (!p.isCompleted || !p.completedAt || p.debtId !== debt.id) return false;
        const paidDate = parseISO(p.completedAt);
        return isSameMonth(paidDate, now);
      });
      return isPastDue && !isPaidThisMonth;
    }).length;

    // Only "behind" if there are actually overdue bills
    const onTrack = overdueCount === 0;

    return {
      paid: paidThisMonth,
      expected: expectedThisMonth,
      remaining: Math.max(0, expectedThisMonth - paidThisMonth),
      onTrack,
      billsDue: billsDueThisMonth,
      billsPaid: billsPaidThisMonth,
      overdueCount,
    };
  }, [payments, plan, debts]);

  // Payment streak calculation (shared utility)
  const streakData = useMemo(() => computePaymentStreak(payments, debts), [payments, debts]);
  const paymentStreak = {
    months: streakData.consecutiveMonths,
    totalPayments: streakData.thisMonthPayments,
    expectedPayments: debts.length,
  };

  // Handle undoing/deleting a payment (restore balance)
  const handleDeletePayment = (paymentId: string, debtId: string, principal: number) => {
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      // Restore the balance
      updateDebt(debtId, {
        balance: debt.balance + principal,
      });
    }
    deletePayment(paymentId);
  };

  // Open payment modal with preselected values or for editing
  const openPaymentModal = (debt?: Debt, amount?: number, type?: PaymentType, payment?: Payment) => {
    setPreselectedDebt(debt);
    setPreselectedAmount(amount);
    setPreselectedType(type);
    setEditingPayment(payment);
    setIsPaymentModalOpen(true);
  };

  if (debts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 animate-page-enter">
        <PageHeader title="Tracking" subtitle="Record your transactions" emoji="📊" />
        <div className="px-4">
          <EmptyState
            icon="💳"
            title="No Debts to Track"
            description="Add your debts first to start tracking payments and building your streak."
            action={{ label: 'Add Debts', href: '/debts' }}
            encouragement="Let's get started!"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-page-enter">
      <PageHeader
        title="Tracking"
        subtitle="Record your transactions"
        emoji="📊"
        action={
          <button
            onClick={() => openPaymentModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            Log Payment
          </button>
        }
      />

      <div className="px-4 py-6 space-y-4">
        {/* This Month Summary Card */}
        <div className="card bg-white rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Target size={16} className="text-white" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">This Month</h2>
            </div>
            <span className="text-sm text-gray-400 font-medium">{format(new Date(), 'MMMM yyyy')}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-2xl">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(thisMonthStats.paid)}
              </p>
              <p className="text-xs text-green-600/70/70 font-medium mt-1">Paid</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-2xl">
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(thisMonthStats.remaining)}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-1">Remaining</p>
            </div>
            <div className="text-center p-3 rounded-2xl">
              {thisMonthStats.onTrack ? (
                <div className="bg-green-50 rounded-2xl p-3 -m-3">
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-300/40">
                      <CheckCircle size={22} className="text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 font-semibold mt-2">On Track</p>
                </div>
              ) : (
                <div className="bg-red-50 rounded-2xl p-3 -m-3">
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-300/40">
                      <AlertCircle size={22} className="text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-red-600 font-semibold mt-2">
                    {thisMonthStats.overdueCount} Overdue
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Streak Card */}
        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border border-orange-100 rounded-3xl relative overflow-hidden">
          {/* Decorative element */}
          <Sparkles size={14} className="absolute top-4 right-4 text-orange-300 animate-kawaii-pulse" />

          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              paymentStreak.months > 0
                ? 'bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-300/40'
                : 'bg-gray-200'
            }`}>
              <Flame size={24} className={paymentStreak.months > 0 ? 'text-white' : 'text-gray-400'} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Payment Streak</h2>
              {paymentStreak.months > 0 ? (
                <p className="text-xl font-bold text-orange-600">
                  {paymentStreak.months} month{paymentStreak.months !== 1 ? 's' : ''}!
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Make your first payment to start!
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span className="font-medium">This month's progress</span>
              <span className="font-semibold">
                {paymentStreak.totalPayments}/{paymentStreak.expectedPayments} payments
              </span>
            </div>
            <div className="h-3 bg-white/60 dark:bg-gray-900/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    paymentStreak.expectedPayments > 0
                      ? (paymentStreak.totalPayments / paymentStreak.expectedPayments) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Milestone badges */}
          {paymentStreak.months >= 1 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {paymentStreak.months >= 1 && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/30 text-orange-700 text-xs font-semibold rounded-xl flex items-center gap-1">
                  <Trophy size={12} />
                  1 Month
                </span>
              )}
              {paymentStreak.months >= 3 && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/30 text-orange-700 text-xs font-semibold rounded-xl flex items-center gap-1">
                  <Trophy size={12} />
                  3 Months
                </span>
              )}
              {paymentStreak.months >= 6 && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/30 text-orange-700 text-xs font-semibold rounded-xl flex items-center gap-1">
                  <Trophy size={12} />
                  6 Months
                </span>
              )}
              {paymentStreak.months >= 12 && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/30 text-yellow-700 text-xs font-bold rounded-xl flex items-center gap-1 animate-kawaii-pulse">
                  <Sparkles size={12} />
                  1 Year!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1.5 bg-gray-100 rounded-2xl">
          {(['upcoming', 'complete', 'calendar', 'paychecks'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Upcoming Tab */}
        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            {Object.entries(upcomingByMonth).map(([monthKey, monthPayments]) => {
              const monthDate = parseISO(`${monthKey}-01`);

              return (
                <div key={monthKey}>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar size={18} className="text-primary-500" />
                    {format(monthDate, 'MMMM yyyy')}
                  </h3>

                  <div className="space-y-3">
                    {/* Individual debt payments - sorted by due date */}
                    {[...monthPayments]
                      .sort((a, b) => {
                        const debtA = debts.find((d) => d.id === a.debtId);
                        const debtB = debts.find((d) => d.id === b.debtId);
                        return (debtA?.dueDay || 0) - (debtB?.dueDay || 0);
                      })
                      .map((payment) => {
                      const debt = debts.find((d) => d.id === payment.debtId);
                      if (!debt) return null;

                      // Check if this payment was already made this month
                      const paidPayment = payments.find((p) => {
                        if (!p.isCompleted || !p.completedAt || p.debtId !== debt.id) return false;
                        const paidDate = parseISO(p.completedAt);
                        return isSameMonth(paidDate, monthDate);
                      });
                      const alreadyPaid = !!paidPayment;

                      return (
                        <div
                          key={`${monthKey}-${payment.debtId}`}
                          className={`card rounded-2xl flex items-center gap-4 transition-all ${
                            alreadyPaid
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border border-green-100'
                              : 'bg-white hover:shadow-md'
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              alreadyPaid
                                ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-300/40'
                                : 'bg-gray-100'
                            }`}
                          >
                            {alreadyPaid ? (
                              <Check size={22} className="text-white" />
                            ) : (
                              <span className="text-xl">💳</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {payment.debtName}
                              {alreadyPaid && (
                                <span className="ml-2 text-xs text-green-600 font-bold">Paid</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(monthDate, 'MMM')} {debt.dueDay},{' '}
                              {format(monthDate, 'yyyy')}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className={`font-bold ${alreadyPaid ? 'text-green-600' : 'text-gray-900'}`}>
                                {formatCurrency(alreadyPaid && paidPayment ? paidPayment.amount : payment.amount)}
                              </p>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-xl font-medium ${
                                  (alreadyPaid && paidPayment ? paidPayment.type : payment.type) === 'extra'
                                    ? 'bg-primary-100 text-primary-700'
                                    : (alreadyPaid && paidPayment ? paidPayment.type : payment.type) === 'one_time'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {(alreadyPaid && paidPayment ? paidPayment.type : payment.type) === 'extra'
                                  ? 'Extra'
                                  : (alreadyPaid && paidPayment ? paidPayment.type : payment.type) === 'one_time'
                                  ? 'One-time'
                                  : 'Minimum'}
                              </span>
                            </div>
                            {!alreadyPaid ? (
                              <button
                                onClick={() =>
                                  openPaymentModal(
                                    debt,
                                    payment.amount,
                                    payment.type as PaymentType
                                  )
                                }
                                className="p-2.5 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-xl hover:from-green-500 hover:to-emerald-600 transition-all shadow-lg shadow-green-300/40 hover:scale-105 active:scale-95"
                                title="Mark as paid (click to edit amount)"
                              >
                                <Check size={18} />
                              </button>
                            ) : (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => paidPayment && openPaymentModal(debt, undefined, undefined, paidPayment)}
                                  className="p-2 bg-white/80 dark:bg-gray-900/30 text-gray-500 rounded-xl hover:bg-primary-100 hover:text-primary-600 transition-all"
                                  title="Edit payment"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => paidPayment && handleDeletePayment(paidPayment.id, paidPayment.debtId, paidPayment.principal)}
                                  className="p-2 bg-white/80 dark:bg-gray-900/30 text-gray-500 rounded-xl hover:bg-red-100 hover:text-red-500 transition-all"
                                  title="Undo payment"
                                >
                                  <Undo2 size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {Object.keys(upcomingByMonth).length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Calendar size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Set your monthly budget to see upcoming payments.</p>
                <a
                  href="/plan"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
                >
                  <Sparkles size={16} />
                  Set Up Budget
                </a>
              </div>
            )}
          </div>
        )}

        {/* Complete Tab */}
        {activeTab === 'complete' && (
          <div className="space-y-3">
            {completedPayments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Receipt size={28} className="text-gray-400" />
                </div>
                <p className="font-bold text-gray-700 mb-1">No Completed Payments</p>
                <p className="text-sm text-gray-500 mb-4">
                  Mark payments as complete or log them manually.
                </p>
                <button
                  onClick={() => openPaymentModal()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
                >
                  <Sparkles size={16} />
                  Log Your First Payment
                </button>
              </div>
            ) : (
              completedPayments.map((payment) => {
                const debt = debts.find((d) => d.id === payment.debtId);

                return (
                  <div key={payment.id} className="card bg-white rounded-2xl flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-300/40">
                      <Check size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{debt?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {payment.completedAt
                          ? format(parseISO(payment.completedAt), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
                      {payment.note && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate italic">
                          {payment.note}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-bold text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-xl font-medium ${
                            payment.type === 'extra'
                              ? 'bg-primary-100 text-primary-700'
                              : payment.type === 'one_time'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {payment.type === 'extra'
                            ? 'Extra'
                            : payment.type === 'one_time'
                            ? 'One-time'
                            : 'Minimum'}
                        </span>
                      </div>
                      <button
                        onClick={() => debt && openPaymentModal(debt, undefined, undefined, payment)}
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Edit payment"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment.id, payment.debtId, payment.principal)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete payment"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <MiniCalendar
              debts={debts}
              incomeSources={budget.incomeSources}
              subscriptions={subscriptions}
              customCategories={customCategories}
              size="large"
            />

            {/* Bill Distribution Analysis */}
            <BillDistributionPanel
              debts={debts}
              incomeSources={budget.incomeSources}
            />
          </div>
        )}

        {/* Paychecks Tab */}
        {activeTab === 'paychecks' && (
          <div className="space-y-4">
            {/* Log Paycheck Button */}
            <button
              onClick={() => {
                setEditingPaycheck(undefined);
                setIsPaycheckModalOpen(true);
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Log Paycheck
            </button>

            {/* No income sources warning */}
            {budget.incomeSources.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-800 text-sm">
                  Add income sources in the Budget page to log paychecks.
                </p>
                <a
                  href="/budget"
                  className="inline-block mt-2 text-amber-700 font-semibold text-sm hover:underline"
                >
                  Go to Budget →
                </a>
              </div>
            )}

            {/* Recent Paychecks List */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Receipt size={18} className="text-emerald-500" />
                Recent Paychecks
              </h3>
              <p className="text-sm text-gray-500 -mt-2">
                Tap a paycheck to see your remaining balance after bills
              </p>

              {receivedPaychecks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Receipt size={28} className="text-gray-400" />
                  </div>
                  <p className="font-bold text-gray-700 mb-1">No Paychecks Logged</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Log your actual paycheck amounts to track spending.
                  </p>
                </div>
              ) : (
                [...receivedPaychecks]
                  .sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime())
                  .map((paycheck) => {
                    const source = budget.incomeSources.find((s) => s.id === paycheck.incomeSourceId);
                    const variance = paycheck.actualAmount - paycheck.expectedAmount;
                    const isExpanded = selectedPaycheck?.id === paycheck.id;

                    return (
                      <div key={paycheck.id} className="space-y-2">
                        {/* Paycheck Card */}
                        <div
                          onClick={() => setSelectedPaycheck(isExpanded ? undefined : paycheck)}
                          className={`card rounded-2xl flex items-center gap-4 transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 border-2 border-emerald-300'
                              : 'bg-white hover:shadow-md'
                          }`}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-300/40">
                            <span className="text-xl">💰</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {source?.name || 'Unknown Source'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(paycheck.payDate + (paycheck.payDate.length === 10 ? 'T12:00:00' : '')), 'MMM d, yyyy')}
                            </p>
                            {paycheck.note && (
                              <p className="text-xs text-gray-400 mt-1">
                                {paycheck.note}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatCurrency(paycheck.actualAmount)}
                            </p>
                            {variance !== 0 && (
                              <p
                                className={`text-xs font-medium ${
                                  variance > 0
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {variance > 0 ? '+' : ''}
                                {formatCurrency(variance)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPaycheck(paycheck);
                                setIsPaycheckModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all"
                              title="Edit paycheck"
                            >
                              <Pencil size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedPaycheck?.id === paycheck.id) {
                                setSelectedPaycheck(undefined);
                              }
                              deletePaycheck(paycheck.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete paycheck"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        </div>

                        {/* Inline Pay Period Summary */}
                        {isExpanded && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <PayPeriodSummary paycheck={paycheck} />
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPreselectedDebt(undefined);
          setPreselectedAmount(undefined);
          setPreselectedType(undefined);
          setEditingPayment(undefined);
        }}
        preselectedDebt={preselectedDebt}
        preselectedAmount={preselectedAmount}
        preselectedType={preselectedType}
        editingPayment={editingPayment}
      />

      {/* Paycheck Modal */}
      <PaycheckModal
        isOpen={isPaycheckModalOpen}
        onClose={() => {
          setIsPaycheckModalOpen(false);
          setEditingPaycheck(undefined);
        }}
        paycheck={editingPaycheck}
      />
    </div>
  );
}
