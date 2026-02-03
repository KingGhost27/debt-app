/**
 * Track Page
 *
 * Track upcoming and completed payments with monthly summary,
 * payment streaks, and calendar view.
 */

import { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  subMonths,
} from 'date-fns';
import { Check, Plus, Flame, CheckCircle, AlertCircle, X, Undo2, Pencil, Receipt, CreditCard, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { MiniCalendar } from '../components/ui/MiniCalendar';
import { PaymentModal } from '../components/ui/PaymentModal';
import { BillDistributionPanel } from '../components/ui/BillDistributionPanel';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, generatePayoffPlan } from '../lib/calculations';
import type { Debt, PaymentType, Payment } from '../types';

type TabType = 'upcoming' | 'complete' | 'calendar';

export function TrackPage() {
  const { debts, strategy, payments, budget, deletePayment, updateDebt, customCategories } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [preselectedDebt, setPreselectedDebt] = useState<Debt | undefined>();
  const [preselectedAmount, setPreselectedAmount] = useState<number | undefined>();
  const [preselectedType, setPreselectedType] = useState<PaymentType | undefined>();
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();

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

  // Payment streak calculation
  const paymentStreak = useMemo(() => {
    if (payments.length === 0 || debts.length === 0) {
      return { months: 0, totalPayments: 0, expectedPayments: debts.length };
    }

    const now = new Date();
    let streakMonths = 0;
    let checkMonth = subMonths(now, 1); // Start from last month

    // Check up to 24 months back
    for (let i = 0; i < 24; i++) {
      const monthStart = startOfMonth(checkMonth);
      const monthEnd = endOfMonth(checkMonth);

      // Count payments made in this month
      const paymentsInMonth = payments.filter((p) => {
        if (!p.isCompleted || !p.completedAt) return false;
        const date = parseISO(p.completedAt);
        return date >= monthStart && date <= monthEnd;
      });

      // If at least one payment was made, count as streak month
      if (paymentsInMonth.length > 0) {
        streakMonths++;
        checkMonth = subMonths(checkMonth, 1);
      } else {
        break;
      }
    }

    // Count total payments vs expected (this month)
    const thisMonthPayments = payments.filter((p) => {
      if (!p.isCompleted || !p.completedAt) return false;
      return isSameMonth(parseISO(p.completedAt), now);
    }).length;

    return {
      months: streakMonths,
      totalPayments: thisMonthPayments,
      expectedPayments: debts.length,
    };
  }, [payments, debts]);

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
      <div className="min-h-screen">
        <PageHeader title="Tracking" subtitle="Record your transactions" />
        <div className="px-4">
          <EmptyState
            icon={CreditCard}
            title="No Debts to Track"
            description="Add your debts first to start tracking payments and building your streak."
            action={{ label: 'Add Debts', href: '/debts' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Tracking"
        subtitle="Record your transactions"
        action={
          <button
            onClick={() => openPaymentModal()}
            className="flex items-center gap-1 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Log Payment
          </button>
        }
      />

      <div className="px-4 py-6 space-y-4">
        {/* This Month Summary Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-gray-500">THIS MONTH</h2>
            <span className="text-sm text-gray-400">{format(new Date(), 'MMMM yyyy')}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(thisMonthStats.paid)}
              </p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(thisMonthStats.remaining)}
              </p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
            <div className="text-center">
              {thisMonthStats.onTrack ? (
                <>
                  <div className="flex justify-center">
                    <CheckCircle size={28} className="text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 font-medium">On Track</p>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <AlertCircle size={28} className="text-red-500" />
                  </div>
                  <p className="text-xs text-red-600 font-medium">
                    {thisMonthStats.overdueCount} Overdue
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment Streak Card */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} className={paymentStreak.months > 0 ? 'text-orange-500' : 'text-gray-300'} />
            <h2 className="text-sm font-medium">Payment Streak</h2>
          </div>
          {paymentStreak.months > 0 ? (
            <p className="text-lg font-bold text-gray-900">
              {paymentStreak.months} month{paymentStreak.months !== 1 ? 's' : ''} of payments!
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Make your first payment to start a streak!
            </p>
          )}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>This month's progress</span>
              <span>
                {paymentStreak.totalPayments}/{paymentStreak.expectedPayments} payments
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
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
            <div className="flex gap-2 mt-3 flex-wrap">
              {paymentStreak.months >= 1 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  1 Month
                </span>
              )}
              {paymentStreak.months >= 3 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  3 Months
                </span>
              )}
              {paymentStreak.months >= 6 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  6 Months
                </span>
              )}
              {paymentStreak.months >= 12 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  1 Year!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {(['upcoming', 'complete', 'calendar'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
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
                  <h3 className="text-lg font-semibold mb-3">
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
                          className={`card flex items-center gap-4 ${
                            alreadyPaid ? 'opacity-60 bg-green-50' : ''
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              alreadyPaid ? 'bg-green-100' : 'bg-gray-100'
                            }`}
                          >
                            {alreadyPaid ? (
                              <Check size={20} className="text-green-600" />
                            ) : (
                              <span className="text-lg">💳</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {payment.debtName}
                              {alreadyPaid && (
                                <span className="ml-2 text-xs text-green-600">Paid</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(monthDate, 'MMM')} {debt.dueDay},{' '}
                              {format(monthDate, 'yyyy')}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className={`font-semibold ${alreadyPaid ? 'text-green-600' : ''}`}>
                                {formatCurrency(alreadyPaid && paidPayment ? paidPayment.amount : payment.amount)}
                              </p>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
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
                                className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                                title="Mark as paid (click to edit amount)"
                              >
                                <Check size={18} />
                              </button>
                            ) : (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => paidPayment && openPaymentModal(debt, undefined, undefined, paidPayment)}
                                  className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-primary-100 hover:text-primary-600 transition-colors"
                                  title="Edit payment"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => paidPayment && handleDeletePayment(paidPayment.id, paidPayment.debtId, paidPayment.principal)}
                                  className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
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
              <div className="text-center py-8">
                <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Set your monthly budget to see upcoming payments.</p>
                <a
                  href="/plan"
                  className="inline-block mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                >
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
              <div className="text-center py-8">
                <Receipt size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="font-medium text-gray-700 mb-1">No Completed Payments</p>
                <p className="text-sm text-gray-500 mb-4">
                  Mark payments as complete or log them manually.
                </p>
                <button
                  onClick={() => openPaymentModal()}
                  className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                >
                  Log Your First Payment
                </button>
              </div>
            ) : (
              completedPayments.map((payment) => {
                const debt = debts.find((d) => d.id === payment.debtId);

                return (
                  <div key={payment.id} className="card flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{debt?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {payment.completedAt
                          ? format(parseISO(payment.completedAt), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
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
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
                        title="Edit payment"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment.id, payment.debtId, payment.principal)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
    </div>
  );
}
