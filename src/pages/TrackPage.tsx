/**
 * Track Page - the ranch ledger.
 *
 * Track upcoming and completed payments with the month's progress, the
 * on-time streak as a picket fence, a bill calendar, paychecks and
 * subscriptions. Every module sits on the ranch ground as a ranch card with a
 * plank heading; styled in track.css from the --ranch-* tokens. The payment
 * history view adapts the 21st.dev Activity Heatmap Calendar
 * (see components/ui/ActivityHeatmap.tsx).
 */

import { useState, useMemo, type ComponentType } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
} from 'date-fns';
import {
  AlertCircle, CalendarClock, CalendarDays, Check, CheckCircle2, CreditCard, Flame, Pencil, Plus, Receipt,
  Repeat, Target, Undo2, Wallet, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SubscriptionsPage } from './SubscriptionsPage';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Plank } from '../components/dashboard/RanchPanels';
import { MiniCalendar } from '../components/ui/MiniCalendar';
import { PaymentModal } from '../components/ui/PaymentModal';
import { PaycheckModal } from '../components/ui/PaycheckModal';
import { PayPeriodSummary } from '../components/ui/PayPeriodSummary';
import { BillDistributionPanel } from '../components/ui/BillDistributionPanel';
import { PaymentStreakCard } from '../components/ui/PaymentStreakCard';
import { ActivityHeatmap } from '../components/ui/ActivityHeatmap';
import { EmptyState } from '../components/ui/EmptyState';
import { ProLockedOverlay } from '../components/ui/ProLockedOverlay';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { PRO_FEATURE_COPY } from '../lib/tierLimits';
import { formatCurrency, generatePayoffPlan } from '../lib/calculations';
import { computePaymentStreak } from '../lib/milestones';
import type { Debt, PaymentType, Payment, ReceivedPaycheck } from '../types';
import './track.css';

type TabType = 'upcoming' | 'complete' | 'calendar' | 'paychecks' | 'subs';

const TABS: { id: TabType; label: string; icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }> }[] = [
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'complete', label: 'Complete', icon: CheckCircle2 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'paychecks', label: 'Paychecks', icon: Wallet },
  { id: 'subs', label: 'Subs', icon: Repeat },
];

const money0 = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const typeOf = (t: string) => (t === 'extra' ? { cls: ' is-extra', label: 'Extra' } : t === 'one_time' ? { cls: ' is-one', label: 'One-time' } : { cls: '', label: 'Min' });

export function TrackPage() {
  const { debts, strategy, payments, budget, deletePayment, updateDebt, customCategories, receivedPaychecks, deletePaycheck, subscriptions } = useApp();
  const { isBillCalendarLocked, isBillDistributionLocked } = useFeatureGate();
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

  const tabKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === activeTab);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
    if (e.key === 'ArrowLeft') n = (i + TABS.length - 1) % TABS.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = TABS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    setActiveTab(TABS[n].id);
    (e.currentTarget.querySelector(`[data-tab="${TABS[n].id}"]`) as HTMLButtonElement | null)?.focus();
  };

  // Paid amount per day, for the payment history heatmap
  const paidByDay = useMemo(() => {
    const byDay = new Map<string, number>();
    completedPayments.forEach((p) => {
      if (!p.completedAt) return;
      const key = format(parseISO(p.completedAt), 'yyyy-MM-dd');
      byDay.set(key, (byDay.get(key) ?? 0) + p.amount);
    });
    return [...byDay.entries()].map(([date, value]) => ({ date, value }));
  }, [completedPayments]);

  if (debts.length === 0) {
    return (
      <div className="trk animate-page-enter">
        <PageHeader title="Tracking" subtitle="Record your transactions" />
        <div className="trk-body">
          <EmptyState
            icon={CreditCard}
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
    <div className="trk animate-page-enter">
      <PageHeader
        title="Tracking"
        subtitle="Record your transactions"
        action={
          <button type="button" onClick={() => openPaymentModal()} className="trk-btn" aria-label="Log Payment">
            <Plus size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Log Payment</span>
          </button>
        }
      />

      <div className="trk-body">
        <div className="trk-top">
          {/* This Month */}
          <section className="rui-card trk-mod">
            <div className="trk-mod-h">
              <Plank icon={<Target size={18} aria-hidden="true" />}>This Month</Plank>
              <span className="trk-note">{format(new Date(), 'MMMM yyyy')}</span>
            </div>
            <dl className="trk-figs">
              <div className="trk-fig">
                <dt>Paid</dt>
                <dd className="num is-ok">{formatCurrency(thisMonthStats.paid)}</dd>
              </div>
              <div className="trk-fig">
                <dt>Remaining</dt>
                <dd className="num">{formatCurrency(thisMonthStats.remaining)}</dd>
              </div>
              {thisMonthStats.onTrack ? (
                <div className="trk-status is-ok">
                  <CheckCircle2 size={24} aria-hidden="true" />
                  On Track
                </div>
              ) : (
                <div className="trk-status is-bad">
                  <AlertCircle size={24} aria-hidden="true" />
                  {thisMonthStats.overdueCount} Overdue
                </div>
              )}
            </dl>
            {thisMonthStats.expected > 0 && (
              <div className="trk-prog">
                <div className="trk-prog-t">
                  <span>Planned for {format(new Date(), 'MMMM')}</span>
                  <b className="num">{money0(thisMonthStats.paid)} of {money0(thisMonthStats.expected)}</b>
                </div>
                <div className="trk-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, (thisMonthStats.paid / thisMonthStats.expected) * 100))} aria-label="Paid so far this month">
                  <i style={{ width: `${Math.min(100, (thisMonthStats.paid / thisMonthStats.expected) * 100)}%` }} />
                </div>
              </div>
            )}
          </section>

          {/* Payment Streak */}
          <PaymentStreakCard
            streak={streakData}
            progress={{ done: paymentStreak.totalPayments, expected: paymentStreak.expectedPayments }}
          />
        </div>

        {/* Tabs */}
        <div className="trk-tabs" role="tablist" aria-label="Tracking views" onKeyDown={tabKeys}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              data-tab={id}
              aria-selected={activeTab === id}
              tabIndex={activeTab === id ? 0 : -1}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={17} aria-hidden={true} />
              {label}
            </button>
          ))}
        </div>

        {/* Upcoming Tab */}
        {activeTab === 'upcoming' && (
          <div className="trk-stack" role="tabpanel">
            {Object.entries(upcomingByMonth).map(([monthKey, monthPayments]) => {
              const monthDate = parseISO(`${monthKey}-01`);

              return (
                <section key={monthKey} className="trk-sec">
                  <div className="trk-sec-h">
                    <Plank icon={<CalendarDays size={18} aria-hidden="true" />}>{format(monthDate, 'MMMM yyyy')}</Plank>
                  </div>

                  <ul className="rui-card trk-list">
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
                        const tag = typeOf(alreadyPaid && paidPayment ? paidPayment.type : payment.type);

                        return (
                          <li key={`${monthKey}-${payment.debtId}`} className={alreadyPaid ? 'is-paid' : ''}>
                            <div className="trk-row">
                              <div className="trk-row-main">
                                <span className="trk-ic">
                                  {alreadyPaid ? <Check size={19} strokeWidth={3} aria-hidden="true" /> : <CreditCard size={18} aria-hidden="true" />}
                                </span>
                                <span className="trk-n">
                                  <b>
                                    <span>{payment.debtName}</span>
                                    {alreadyPaid && <span className="rui-badge ok">Paid</span>}
                                  </b>
                                  <small>{format(monthDate, 'MMM')} {debt.dueDay}, {format(monthDate, 'yyyy')}</small>
                                </span>
                                <span className="trk-amt">
                                  <b className="num">{formatCurrency(alreadyPaid && paidPayment ? paidPayment.amount : payment.amount)}</b>
                                  <span className={`trk-type${tag.cls}`}>{tag.label}</span>
                                </span>
                              </div>
                              <div className="trk-acts">
                                {!alreadyPaid ? (
                                  <button
                                    type="button"
                                    onClick={() => openPaymentModal(debt, payment.amount, payment.type as PaymentType)}
                                    className="trk-go"
                                    title="Mark as paid (click to edit amount)"
                                    aria-label={`Mark ${payment.debtName} as paid`}
                                  >
                                    <Check size={20} aria-hidden="true" />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => paidPayment && openPaymentModal(debt, undefined, undefined, paidPayment)}
                                      className="trk-icon-btn"
                                      title="Edit payment"
                                      aria-label={`Edit ${payment.debtName} payment`}
                                    >
                                      <Pencil size={16} aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => paidPayment && handleDeletePayment(paidPayment.id, paidPayment.debtId, paidPayment.principal)}
                                      className="trk-icon-btn is-bad"
                                      title="Undo payment"
                                      aria-label={`Undo ${payment.debtName} payment`}
                                    >
                                      <Undo2 size={16} aria-hidden="true" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </section>
              );
            })}

            {Object.keys(upcomingByMonth).length === 0 && (
              <div className="rui-card trk-empty">
                <span className="trk-ic"><CalendarClock size={28} aria-hidden="true" /></span>
                <p>Set your monthly budget to see upcoming payments.</p>
                <Link to="/plan" className="trk-btn">Set Up Budget</Link>
              </div>
            )}
          </div>
        )}

        {/* Complete Tab */}
        {activeTab === 'complete' && (
          <div className="trk-stack" role="tabpanel">
            <section className="rui-card trk-mod">
              <div className="trk-mod-h">
                <Plank icon={<Flame size={18} aria-hidden="true" />}>Payment history</Plank>
                <span className="trk-note">One square, one day</span>
              </div>
              <ActivityHeatmap
                data={paidByDay}
                days={365}
                formatValue={money0}
                activeNoun="days with a payment"
                labels={{ total: 'Paid in total', active: 'Days with a payment', longest: 'Longest run', current: 'Current run' }}
              />
            </section>

            {completedPayments.length === 0 ? (
              <div className="rui-card trk-empty">
                <span className="trk-ic"><Receipt size={28} aria-hidden="true" /></span>
                <h3>No Completed Payments</h3>
                <p>Mark payments as complete or log them manually.</p>
                <button type="button" onClick={() => openPaymentModal()} className="trk-btn">
                  <Plus size={18} aria-hidden="true" />
                  Log Your First Payment
                </button>
              </div>
            ) : (
              <section className="trk-sec">
                <div className="trk-sec-h">
                  <Plank icon={<CheckCircle2 size={18} aria-hidden="true" />}>Completed</Plank>
                </div>
                <ul className="rui-card trk-list">
                  {completedPayments.map((payment) => {
                    const debt = debts.find((d) => d.id === payment.debtId);
                    const tag = typeOf(payment.type);

                    return (
                      <li key={payment.id}>
                        <div className="trk-row">
                          <div className="trk-row-main">
                            <span className="trk-ic is-ok"><Check size={19} strokeWidth={3} aria-hidden="true" /></span>
                            <span className="trk-n">
                              <b><span>{debt?.name || 'Unknown'}</span></b>
                              <small>{payment.completedAt ? format(parseISO(payment.completedAt), 'MMM d, yyyy') : 'N/A'}</small>
                              {payment.note && <small className="trk-pay-note">{payment.note}</small>}
                            </span>
                            <span className="trk-amt">
                              <b className="num is-ok">{formatCurrency(payment.amount)}</b>
                              <span className={`trk-type${tag.cls}`}>{tag.label}</span>
                            </span>
                          </div>
                          <div className="trk-acts">
                            <button
                              type="button"
                              onClick={() => debt && openPaymentModal(debt, undefined, undefined, payment)}
                              className="trk-icon-btn"
                              title="Edit payment"
                              aria-label={`Edit ${debt?.name ?? 'payment'}`}
                            >
                              <Pencil size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(payment.id, payment.debtId, payment.principal)}
                              className="trk-icon-btn is-bad"
                              title="Delete payment"
                              aria-label={`Delete ${debt?.name ?? 'payment'}`}
                            >
                              <X size={17} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="trk-stack" role="tabpanel">
            {isBillCalendarLocked ? (
              <ProLockedOverlay
                title={PRO_FEATURE_COPY.bill_calendar.title}
                description={PRO_FEATURE_COPY.bill_calendar.description}
              />
            ) : (
              <section className="rui-card trk-mod">
                <div className="trk-mod-h">
                  <Plank icon={<CalendarDays size={18} aria-hidden="true" />}>Bill Calendar</Plank>
                </div>
                <MiniCalendar
                  debts={debts}
                  incomeSources={budget.incomeSources}
                  subscriptions={subscriptions}
                  customCategories={customCategories}
                  size="large"
                />
              </section>
            )}

            {/* Bill Distribution Analysis */}
            {isBillDistributionLocked ? (
              <ProLockedOverlay
                title={PRO_FEATURE_COPY.bill_distribution.title}
                description={PRO_FEATURE_COPY.bill_distribution.description}
                compact
              />
            ) : (
              <BillDistributionPanel debts={debts} incomeSources={budget.incomeSources} />
            )}
          </div>
        )}

        {/* Paychecks Tab */}
        {activeTab === 'paychecks' && (
          <div className="trk-stack" role="tabpanel">
            <button
              type="button"
              onClick={() => {
                setEditingPaycheck(undefined);
                setIsPaycheckModalOpen(true);
              }}
              className="trk-btn is-wide"
            >
              <Plus size={18} aria-hidden="true" />
              Log Paycheck
            </button>

            {/* No income sources warning */}
            {budget.incomeSources.length === 0 && (
              <p className="trk-warn">
                Add income sources in the Budget page to log paychecks.
                <Link to="/budget">Go to Budget →</Link>
              </p>
            )}

            {/* Recent Paychecks List */}
            <section className="trk-sec">
              <div className="trk-sec-h">
                <Plank icon={<Receipt size={18} aria-hidden="true" />}>Recent Paychecks</Plank>
              </div>
              <p className="trk-note">Tap a paycheck to see your remaining balance after bills</p>

              {receivedPaychecks.length === 0 ? (
                <div className="rui-card trk-empty">
                  <span className="trk-ic"><Receipt size={28} aria-hidden="true" /></span>
                  <h3>No Paychecks Logged</h3>
                  <p>Log your actual paycheck amounts to track spending.</p>
                </div>
              ) : (
                <ul className="rui-card trk-list">
                  {[...receivedPaychecks]
                    .sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime())
                    .map((paycheck) => {
                      const source = budget.incomeSources.find((s) => s.id === paycheck.incomeSourceId);
                      const variance = paycheck.actualAmount - paycheck.expectedAmount;
                      const isExpanded = selectedPaycheck?.id === paycheck.id;

                      return (
                        <li key={paycheck.id}>
                          <div className="trk-row">
                            <button
                              type="button"
                              className="trk-row-main"
                              aria-expanded={isExpanded}
                              onClick={() => setSelectedPaycheck(isExpanded ? undefined : paycheck)}
                            >
                              <span className="trk-ic is-ok"><Wallet size={18} aria-hidden="true" /></span>
                              <span className="trk-n">
                                <b><span>{source?.name || 'Unknown Source'}</span></b>
                                <small>
                                  {format(new Date(paycheck.payDate + (paycheck.payDate.length === 10 ? 'T12:00:00' : '')), 'MMM d, yyyy')}
                                  {paycheck.note ? ` · ${paycheck.note}` : ''}
                                </small>
                              </span>
                              <span className="trk-amt">
                                <b className="num">{formatCurrency(paycheck.actualAmount)}</b>
                                {variance !== 0 && (
                                  <span className={`trk-var ${variance > 0 ? 'is-ok' : 'is-bad'}`}>
                                    {variance > 0 ? '+' : ''}
                                    {formatCurrency(variance)}
                                  </span>
                                )}
                              </span>
                            </button>
                            <div className="trk-acts">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPaycheck(paycheck);
                                  setIsPaycheckModalOpen(true);
                                }}
                                className="trk-icon-btn"
                                title="Edit paycheck"
                                aria-label="Edit paycheck"
                              >
                                <Pencil size={16} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedPaycheck?.id === paycheck.id) {
                                    setSelectedPaycheck(undefined);
                                  }
                                  deletePaycheck(paycheck.id);
                                }}
                                className="trk-icon-btn is-bad"
                                title="Delete paycheck"
                                aria-label="Delete paycheck"
                              >
                                <X size={17} aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Pay Period Summary */}
                          {isExpanded && (
                            <div className="trk-pay-open">
                              <PayPeriodSummary paycheck={paycheck} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* Subs Tab */}
        {activeTab === 'subs' && <div role="tabpanel"><SubscriptionsPage embedded /></div>}
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
