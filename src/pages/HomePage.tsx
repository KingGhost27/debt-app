/**
 * Home Page (Dashboard) - the ranch.
 *
 * The scene leads: the trail from the barn to the debt-free flag is the
 * user's real progress, each debt is a signpost placed where the active
 * strategy clears it, and the greeting, headline, figures and "Log a
 * payment" sit over the sky. Logging a payment plays the walk-the-trail move
 * and the figures roll. Below the scene: up next, latest paycheck, on-time
 * streak, the debts, recent payments, milestones, and the longer modules
 * (payoff timeline, bills, analytics, calendar, history, categories, summary).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  BarChart3, CalendarCheck, Check, ClipboardList, Flame, PieChart as PieChartIcon, Plus, Receipt,
  Sparkles, Trophy, TrendingDown, Wallet, ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import {
  calculateDebtSummary,
  generatePayoffPlan,
  formatTimeUntil,
  formatCurrency,
  formatPercent,
  calculatePayPeriodRemaining,
} from '../lib/calculations';
import { computeOverallMilestones, computeDebtPayoffTimeline, computePaymentStreak } from '../lib/milestones';
import { sceneKeyForPreset } from '../lib/ranchScenes';
import { nextDue, orderDebts, toRanchDebts } from '../lib/dashboardTrail';
import { RanchScene, type RanchWalk } from '../components/ranch/RanchScene';
import { Plank, RanchSection } from '../components/dashboard/RanchPanels';
import { RollingNumber } from '../components/ui/RollingNumber';
import { ProgressRing } from '../components/ui/ProgressRing';
import { DebtOverTimeChart } from '../components/ui/DebtOverTimeChart';
import { MilestoneTracker } from '../components/ui/MilestoneTracker';
import { DebtPayoffTimeline } from '../components/ui/DebtPayoffTimeline';
import { UpcomingBills } from '../components/ui/UpcomingBills';
import { MiniCalendar } from '../components/ui/MiniCalendar';
import { PaymentModal } from '../components/ui/PaymentModal';
import { InterestVsPrincipalChart } from '../components/analytics/InterestVsPrincipalChart';
import { DebtBreakdownChart } from '../components/analytics/DebtBreakdownChart';
import { PaymentHistorySummary } from '../components/analytics/PaymentHistorySummary';
import { ProLockedOverlay } from '../components/ui/ProLockedOverlay';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { PRO_FEATURE_COPY } from '../lib/tierLimits';
import { CATEGORY_INFO } from '../types';
import './dashboard.css';

const money0 = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const getEncouragement = (percentPaid: number) => {
  if (percentPaid >= 100) return "You did it! You're debt-free!";
  if (percentPaid >= 75) return "Almost there! You're doing amazing!";
  if (percentPaid >= 50) return "Halfway there! Keep going!";
  if (percentPaid >= 25) return "Great progress! You've got this!";
  if (percentPaid > 0) return "Every payment counts!";
  return "Let's start your journey!";
};

const dueLabel = (days: number) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`);

export function HomePage() {
  const {
    debts, strategy, settings, customCategories, budget, payments, subscriptions, receivedPaychecks,
    landingHandoff, consumeLandingHandoff,
  } = useApp();
  const { isInterestVsPrincipalLocked, isPaymentHistoryLocked, isBillCalendarLocked } = useFeatureGate();
  const { showToast } = useToast();

  // Landing-page welcome: fires once if a brand-new account just had its
  // public-calculator debts seeded by AppContext (ref guard covers StrictMode).
  const landingToastFiredRef = useRef(false);
  useEffect(() => {
    if (!landingHandoff || landingToastFiredRef.current) return;
    landingToastFiredRef.current = true;
    const n = landingHandoff.count;
    showToast(
      `Welcome to Cowculator! 🐄 We saved your ${n} debt${n === 1 ? '' : 's'} so you don't have to re-enter them.`,
      'success'
    );
    consumeLandingHandoff();
  }, [landingHandoff, consumeLandingHandoff, showToast]);

  const summary = useMemo(() => calculateDebtSummary(debts), [debts]);
  const plan = useMemo(() => generatePayoffPlan(debts, strategy), [debts, strategy]);

  const debtFreeDate = plan.debtFreeDate ? parseISO(plan.debtFreeDate) : null;
  const timeUntilDebtFree = debtFreeDate ? formatTimeUntil(debtFreeDate) : null;
  const paidShare = Math.max(0, Math.min(1, summary.percentPaid / 100));
  const allPaid = debts.length > 0 && summary.totalBalance <= 0;

  const ordered = useMemo(() => orderDebts(debts, plan), [debts, plan]);
  const ranchDebts = useMemo(() => toRanchDebts(ordered, paidShare), [ordered, paidShare]);
  const focus = ordered.find((t) => t.status === 'focus')?.debt ?? null;
  const due = useMemo(() => nextDue(debts), [debts]);

  // Latest paycheck and what is left after bills
  const paycheckSummary = useMemo(() => {
    if (receivedPaychecks.length === 0) return null;
    const latest = [...receivedPaychecks].sort(
      (a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime()
    )[0];
    const incomeSource = budget.incomeSources.find((s) => s.id === latest.incomeSourceId);
    const period = calculatePayPeriodRemaining(latest, debts, subscriptions, true, payments);
    return {
      paycheck: latest,
      sourceName: incomeSource?.name || 'Unknown',
      remaining: period.remaining,
      totalBills: period.totalBills,
      totalSubscriptions: period.totalSubscriptions,
      unpaidBillCount: period.bills.filter((b) => !b.isPaid).length,
    };
  }, [receivedPaychecks, budget.incomeSources, debts, subscriptions, payments]);

  const totalOriginalBalance = useMemo(() => debts.reduce((s, d) => s + d.originalBalance, 0), [debts]);
  const overallMilestones = useMemo(
    () => computeOverallMilestones(summary.percentPaid, totalOriginalBalance, plan.monthlyBreakdown),
    [summary.percentPaid, totalOriginalBalance, plan.monthlyBreakdown]
  );
  const debtTimeline = useMemo(() => computeDebtPayoffTimeline(debts, plan), [debts, plan]);
  const streak = useMemo(() => computePaymentStreak(payments, debts), [payments, debts]);

  const categories = useMemo(
    () =>
      Object.entries(summary.debtsByCategory)
        .filter(([, balance]) => balance > 0)
        .map(([category, balance]) => ({
          category,
          balance,
          ...CATEGORY_INFO[category as keyof typeof CATEGORY_INFO],
        }))
        .sort((a, b) => b.balance - a.balance),
    [summary.debtsByCategory]
  );

  const completedPayments = useMemo(
    () => payments.filter((p) => p.isCompleted).sort((a, b) => b.date.localeCompare(a.date)),
    [payments]
  );

  // Strategy savings: interest saved by paying the funded amount vs minimums only
  const savings = useMemo(() => {
    if (debts.length === 0) return 0;
    const minOnly = generatePayoffPlan(debts, {
      ...strategy,
      recurringFunding: { ...strategy.recurringFunding, amount: summary.totalMinimumPayments },
    });
    return minOnly.totalInterest - plan.totalInterest;
  }, [debts, strategy, summary.totalMinimumPayments, plan.totalInterest]);

  /* ---- log a payment + walk the trail ---- */
  const [payOpen, setPayOpen] = useState(false);
  const [walk, setWalk] = useState<RanchWalk | null>(null);
  const [cheer, setCheer] = useState(false);
  const armed = useRef<{ share: number } | null>(null);
  const lastShare = useRef(paidShare);

  const openPayment = useCallback(() => {
    armed.current = { share: lastShare.current };
    setPayOpen(true);
  }, []);
  const closePayment = useCallback(() => {
    setPayOpen(false);
    // Stay armed just long enough for the saved payment to land in state.
    window.setTimeout(() => { armed.current = null; }, 1500);
  }, []);

  useEffect(() => {
    const prev = lastShare.current;
    lastShare.current = paidShare;
    if (armed.current && paidShare > prev + 1e-6) {
      setWalk({ id: Date.now(), from: armed.current.share });
      armed.current = null;
      setCheer(true);
    }
  }, [paidShare]);
  useEffect(() => {
    if (!cheer) return;
    const t = window.setTimeout(() => setCheer(false), 7000);
    return () => window.clearTimeout(t);
  }, [cheer]);

  const name = settings.userName?.trim() || '';
  const sceneKey = sceneKeyForPreset(settings.theme?.preset);
  const goalLabel = debts.length > 0 && debtFreeDate && !allPaid ? `Debt-free · ${format(debtFreeDate, 'MMM yyyy')}` : 'Debt-free';
  const strategyName = strategy.strategy === 'avalanche' ? 'Avalanche, highest rate first' : 'Snowball, smallest balance first';

  // The greeting lives in the friend's bubble (no label above the headline).
  const hi = name ? `Hi, ${name}.` : 'Hi there.';
  const friendLine = cheer
    ? `Look at you go${name ? `, ${name}` : ''}. That is real progress.`
    : debts.length === 0
      ? `${hi} Add a debt and the trail starts.`
      : due && due.days <= 14
        ? `${hi} ${due.days === 0 ? `${due.debt.name} is due today.` : `${due.days} day${due.days === 1 ? '' : 's'} till ${due.debt.name}'s due.`}`
        : `${hi} ${getEncouragement(summary.percentPaid)}`;

  /* ---- hero copy ---- */
  let line1: string;
  let line2: string;
  if (debts.length === 0) {
    line1 = 'Your trail';
    line2 = 'starts here';
  } else if (allPaid) {
    line1 = "You're";
    line2 = 'Debt-free!';
  } else if (debtFreeDate) {
    line1 = 'Debt-free in';
    line2 = format(debtFreeDate, 'MMM yyyy');
  } else {
    line1 = 'Payments are short';
    line2 = 'Raise your plan';
  }

  const scene = (
    <div className="dash-scene">
      <RanchScene
        sceneKey={sceneKey}
        paidShare={debts.length ? paidShare : 0}
        debts={ranchDebts}
        goalLabel={goalLabel}
        friendLine={friendLine}
        walk={walk}
        actions={
          debts.length === 0 ? (
            <div className="dash-act">
              <Link to="/debts" className="dash-btn">
                <Plus size={20} aria-hidden="true" /> Add your first debt
              </Link>
              <span className="dash-hint dash-hint-phone">Debtsy will map them onto the trail.</span>
            </div>
          ) : (
            <div className="dash-act">
              <button type="button" className="dash-btn" onClick={openPayment}>
                <Plus size={20} aria-hidden="true" /> Log a payment
              </button>
              {focus && (
                <span className="dash-hint dash-hint-phone">
                  Next: {money0(focus.minimumPayment)} to {focus.name}
                </span>
              )}
            </div>
          )
        }
      >
        <h1 className={`dash-h1${debtFreeDate && debts.length > 0 ? '' : allPaid ? '' : ' is-long'}`}>
          <span className="l1">{line1}</span>
          <span className="l2">{line2}</span>
        </h1>
        {debts.length > 0 && (
          <p className="dash-money">
            <RollingNumber value={summary.totalBalance} /> left · <RollingNumber value={summary.principalPaid} /> paid (
            {Math.round(summary.percentPaid)}%)
          </p>
        )}
      </RanchScene>
    </div>
  );

  if (debts.length === 0) {
    return (
      <div className="dash animate-page-enter">
        {scene}
        <div className="dash-content">
          <section className="rui-card dash-start">
            <Plank>Getting started</Plank>
            <ol className="dash-steps">
              <li><span className="dash-rank">1</span><div><h3>Add your debts</h3><p>Balances, rates and minimums. Each one becomes a signpost.</p></div><Link to="/debts" className="dash-ghost">Add a debt</Link></li>
              <li><span className="dash-rank">2</span><div><h3>Add your income</h3><p>So we know what is left to put toward them.</p></div><Link to="/track" className="dash-ghost">Add income</Link></li>
              <li><span className="dash-rank">3</span><div><h3>See your plan</h3><p>Your debt-free date, in the order that saves you the most.</p></div><Link to="/plan" className="dash-ghost">Open plan</Link></li>
            </ol>
          </section>
        </div>
      </div>
    );
  }

  /* milestones list, in plain words */
  const paidDebts = ordered.filter((t) => t.status === 'paid');
  const reached = overallMilestones.filter((m) => m.isReached);
  const nextPct = overallMilestones.find((m) => !m.isReached);

  const streakPickets = Math.min(streak.consecutiveMonths, 10);

  return (
    <div className="dash animate-page-enter">
      {scene}

      <div className="dash-content">
        {/* Up next / paycheck / streak */}
        <div className="rui-card dash-today">
          <div className="dash-cell">
            <h2 className="dash-ch"><span className="dash-ic"><CalendarCheck size={18} aria-hidden="true" /></span>Up next</h2>
            {due ? (
              <>
                <p className="dash-big"><span className="dash-dot" aria-hidden="true" /><span className="dash-who">{due.debt.name}</span> <span className="num">{money0(due.debt.minimumPayment)}</span></p>
                <p className="dash-sub">
                  Due {format(due.date, 'EEE MMM d')} · {dueLabel(due.days)}
                  {due.days <= 7 && <span className="rui-badge soon">Due soon</span>}
                </p>
              </>
            ) : (
              <p className="dash-sub">Nothing due. Every debt is paid.</p>
            )}
            {focus && (
              <p className="dash-sub">
                Focus: {focus.name}
                {(() => {
                  const m = plan.steps.flatMap((s) => s.milestonesInStep).find((x) => x.debtId === focus.id);
                  return m ? `, paid off by ${format(parseISO(m.payoffDate), 'MMMM yyyy')}` : '';
                })()}
              </p>
            )}
          </div>

          <div className="dash-cell">
            <h2 className="dash-ch"><span className="dash-ic"><Wallet size={18} aria-hidden="true" /></span>Latest paycheck</h2>
            {paycheckSummary ? (
              <>
                <p className="dash-big">
                  <RollingNumber className="num" value={paycheckSummary.remaining} />
                  <span className="dash-unit">{paycheckSummary.remaining >= 0 ? 'left to assign' : 'short after bills'}</span>
                </p>
                <p className="dash-sub">
                  {money0(paycheckSummary.paycheck.actualAmount)} from {paycheckSummary.sourceName}, received {format(new Date(paycheckSummary.paycheck.payDate + 'T12:00:00'), 'MMM d')}
                </p>
                <p className="dash-sub">
                  Bills ({paycheckSummary.unpaidBillCount} unpaid) + subs {money0(paycheckSummary.totalBills + paycheckSummary.totalSubscriptions)} · pay period {format(new Date(paycheckSummary.paycheck.payPeriodStart + 'T12:00:00'), 'MMM d')} to {format(new Date(paycheckSummary.paycheck.payPeriodEnd + 'T12:00:00'), 'MMM d')}
                </p>
                <Link to="/track" className="dash-ghost">
                  {paycheckSummary.remaining > 0 ? `Assign ${money0(paycheckSummary.remaining)}` : 'View details'} <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p className="dash-sub">No paycheck logged yet. Log one and we will show what is left after bills.</p>
                <Link to="/track" className="dash-ghost">Log a paycheck</Link>
              </>
            )}
          </div>

          <div className="dash-cell">
            <h2 className="dash-ch"><span className="dash-ic"><Flame size={18} aria-hidden="true" /></span>On-time streak</h2>
            {isPaymentHistoryLocked ? (
              <ProLockedOverlay
                title={PRO_FEATURE_COPY.payment_history.title}
                description={PRO_FEATURE_COPY.payment_history.description}
                compact
              />
            ) : (
              <>
                <div className="dash-fence" role="img" aria-label={`${streak.consecutiveMonths} months in a row`}>
                  {Array.from({ length: streakPickets }, (_, i) => (
                    <span key={i} className="dash-pk"><Picket checked /></span>
                  ))}
                  <span className="dash-pk is-next"><Picket /></span>
                </div>
                <p className="dash-sub">
                  <b>{streak.consecutiveMonths}</b> {streak.consecutiveMonths === 1 ? 'month' : 'months'} in a row
                  {streak.currentMonthOnTrack && <span className="rui-badge ok"><Check size={13} aria-hidden="true" />On track</span>}
                </p>
                <p className="dash-sub">
                  {streak.totalCompletedPayments} payments total
                  {streak.longestStreak > streak.consecutiveMonths ? ` · best ${streak.longestStreak} months` : ''}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Left column: the debts, then the payoff timeline and bills */}
        <div className="dash-main">
        <section className="rui-card dash-debts">
          <div className="dash-sec-h">
            <Plank>Your debts</Plank>
            <p className="dash-note">
              {strategyName} · <b>{money0(strategy.recurringFunding.amount)}</b>/mo (<b>{money0(summary.totalMinimumPayments)}</b> minimums
              {strategy.recurringFunding.amount > summary.totalMinimumPayments ? <> + <b>{money0(strategy.recurringFunding.amount - summary.totalMinimumPayments)}</b> extra</> : null}) · about <b>{money0(plan.totalInterest)}</b> interest to go
            </p>
          </div>
          <ul className="dash-dl">
            {ordered.map(({ debt, rank, status }) => {
              const pct = debt.originalBalance > 0 ? Math.max(0, Math.min(100, ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100)) : 0;
              const dueIn = status === 'paid' ? null : nextDue([debt]);
              const soon = dueIn && dueIn.days <= 7;
              return (
                <li key={debt.id} className={`dash-drow is-${status}`}>
                  <span className="dash-rank">{status === 'paid' ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : rank}</span>
                  <div className="dash-dname">
                    <h3>
                      {debt.name}
                      {status === 'focus' && <span className="rui-badge focus"><Sparkles size={13} aria-hidden="true" />Focus</span>}
                      {soon && <span className="rui-badge soon">Due soon</span>}
                      {status === 'paid' && <span className="rui-badge ok"><Check size={13} aria-hidden="true" />Paid off</span>}
                    </h3>
                    <p className="dash-dmeta">
                      {status === 'paid'
                        ? `${money0(debt.originalBalance)} cleared`
                        : `${formatPercent(debt.apr, 2)} APR · min ${money0(debt.minimumPayment)}${dueIn ? ` · due ${format(dueIn.date, 'EEE MMM d')}` : ''}`}
                    </p>
                  </div>
                  <div className="dash-dbar">
                    <span className="dash-track"><i style={{ width: `${pct}%` }} /></span>
                    <span className="dash-pct">{Math.round(pct)}% paid</span>
                  </div>
                  <div className="dash-damt">
                    <RollingNumber className="num" value={debt.balance} />
                    <span>left of {money0(debt.originalBalance)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

          {debtTimeline.length > 0 && (
            <RanchSection title="Payoff timeline" note="When each debt gets paid off" icon={<ClipboardList size={18} aria-hidden="true" />}>
              <DebtPayoffTimeline timeline={debtTimeline} />
            </RanchSection>
          )}

          <UpcomingBills debts={debts} customCategories={customCategories} payments={payments} incomeSources={budget.incomeSources} subscriptions={subscriptions} />
        </div>

        {/* Side: recent payments, milestones, numbers */}
        <div className="dash-side">
          {!isPaymentHistoryLocked && completedPayments.length > 0 && (
            <section className="rui-card dash-recent">
              <div className="dash-sec-h"><Plank>Recent payments</Plank></div>
              <ul className="dash-rl">
                {completedPayments.slice(0, 4).map((p) => {
                  const d = debts.find((x) => x.id === p.debtId);
                  return (
                    <li key={p.id}>
                      <span className="d">{format(parseISO(p.date), 'MMM d')}</span>
                      <span className="n">{d?.name ?? 'Deleted debt'}</span>
                      <span className="a num">−{money0(p.amount)}</span>
                      <span className={`b${d && d.balance <= 0 ? ' zero' : ''}`}>
                        {d ? (d.balance <= 0 ? `Balance $0 · paid off` : `Balance now ${money0(d.balance)}`) : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="rui-card dash-miles">
            <div className="dash-sec-h"><Plank icon={null}>Milestones</Plank></div>
            <ul className="dash-ml">
              {paidDebts[0] && (
                <li><span className="mk"><Check size={15} strokeWidth={3} aria-hidden="true" /></span><div>First debt paid off<small>{paidDebts[0].debt.name}</small></div></li>
              )}
              {reached.map((m) => (
                <li key={m.percent}><span className="mk"><Check size={15} strokeWidth={3} aria-hidden="true" /></span><div>{m.percent}% paid<small>{money0(m.amountAtMilestone)} paid down</small></div></li>
              ))}
              {focus ? (
                <li><span className="mk next"><Trophy size={15} aria-hidden="true" /></span><div>Next: {focus.name} gone<small>{money0(focus.balance)} to go</small></div></li>
              ) : nextPct ? (
                <li><span className="mk next"><Trophy size={15} aria-hidden="true" /></span><div>Next: {nextPct.percent}% paid<small>{money0(nextPct.amountAtMilestone - summary.principalPaid)} to go</small></div></li>
              ) : null}
            </ul>
            <div className="dash-ms-track">
              <MilestoneTracker milestones={overallMilestones} percentPaid={summary.percentPaid} />
            </div>
          </section>

          <section className="rui-card dash-nums">
            <div className="dash-sec-h"><Plank>The numbers</Plank></div>
            <dl className="dash-stats">
              <div><dt>Total interest</dt><dd className="bad num">{formatCurrency(plan.totalInterest)}</dd></div>
              <div><dt>Monthly payment</dt><dd className="num">{formatCurrency(strategy.recurringFunding.amount)}</dd></div>
              <div><dt>Debts</dt><dd className="num">{debts.length}</dd></div>
              <div><dt>Time left</dt><dd className="good num">{timeUntilDebtFree || 'N/A'}</dd></div>
              {summary.totalCreditLimit > 0 && (
                <div className="is-bar">
                  <dt>Credit used</dt>
                  <dd className={`num${summary.creditUtilization > 30 ? ' bad' : ' good'}`}>{formatPercent(summary.creditUtilization, 0)}</dd>
                  <span className="dash-track" role="img" aria-label={`${formatPercent(summary.creditUtilization, 0)} of credit limit used`}>
                    <i style={{ width: `${Math.min(100, Math.max(0, summary.creditUtilization))}%`, background: summary.creditUtilization > 30 ? 'var(--ranch-focus)' : 'var(--ranch-ok-fill)' }} />
                  </span>
                  <small>
                    {formatCurrency(debts.filter((d) => d.creditLimit).reduce((sum, d) => sum + d.balance, 0))} of {formatCurrency(summary.totalCreditLimit)}
                  </small>
                </div>
              )}
            </dl>
            {savings > 0 && (
              <p className="dash-save">
                <Wallet size={18} aria-hidden="true" />
                <span>Saving <b>{formatCurrency(savings)}</b> in interest by paying extra with {strategy.strategy === 'avalanche' ? 'Avalanche' : 'Snowball'}.</span>
              </p>
            )}
          </section>
        </div>

        {/* The rest of the ranch */}
        <div className="dash-more">
          {plan.monthlyBreakdown && plan.monthlyBreakdown.length > 0 && (
            <RanchSection title="Analytics" note="Charts and detailed breakdowns" icon={<BarChart3 size={18} aria-hidden="true" />}>
              <div className="dash-charts">
                <div>
                  <p className="dash-ct"><TrendingDown size={15} aria-hidden="true" />Debt over time</p>
                  <DebtOverTimeChart plan={plan} startingBalance={summary.totalBalance} />
                </div>
                <div className="dash-rule">
                  <p className="dash-ct"><PieChartIcon size={15} aria-hidden="true" />Interest vs principal</p>
                  {isInterestVsPrincipalLocked ? (
                    <ProLockedOverlay
                      title={PRO_FEATURE_COPY.interest_vs_principal_chart.title}
                      description={PRO_FEATURE_COPY.interest_vs_principal_chart.description}
                      compact
                    />
                  ) : (
                    <InterestVsPrincipalChart monthlyBreakdown={plan.monthlyBreakdown} />
                  )}
                </div>
                {debts.length > 1 && (
                  <div className="dash-rule">
                    <p className="dash-ct"><BarChart3 size={15} aria-hidden="true" />Debt breakdown</p>
                    <DebtBreakdownChart monthlyBreakdown={plan.monthlyBreakdown} debts={debts} />
                  </div>
                )}
              </div>
            </RanchSection>
          )}

          {isBillCalendarLocked ? (
            <ProLockedOverlay
              title={PRO_FEATURE_COPY.bill_calendar.title}
              description={PRO_FEATURE_COPY.bill_calendar.description}
              compact
            />
          ) : (
            <MiniCalendar debts={debts} incomeSources={budget.incomeSources} customCategories={customCategories} />
          )}

          {completedPayments.length > 0 && (
            <RanchSection title="Payment history" note="Your actual payments" icon={<Receipt size={18} aria-hidden="true" />}>
              {isPaymentHistoryLocked ? (
                <ProLockedOverlay
                  title={PRO_FEATURE_COPY.payment_history.title}
                  description={PRO_FEATURE_COPY.payment_history.description}
                  compact
                />
              ) : (
                <PaymentHistorySummary payments={payments} />
              )}
            </RanchSection>
          )}

          {categories.length > 0 && (
            <RanchSection title="Categories" note="Debts by category" icon={<Sparkles size={18} aria-hidden="true" />}>
              <ul className="dash-cats">
                {categories.slice(0, 4).map((cat) => {
                  const categoryDebts = debts.filter((d) => d.category === cat.category);
                  const originalTotal = categoryDebts.reduce((s, d) => s + d.originalBalance, 0);
                  const pct = originalTotal > 0 ? ((originalTotal - cat.balance) / originalTotal) * 100 : 0;
                  return (
                    <li key={cat.category}>
                      <ProgressRing percentage={pct} size={56} strokeWidth={6} color={cat.color} backgroundColor={`${cat.color}20`} className="flex-shrink-0" />
                      <div className="dash-cat-n">
                        <p style={{ color: cat.color }}>{cat.label}</p>
                        {categoryDebts.map((d) => <span key={d.id}>{d.name}</span>)}
                      </div>
                      <div className="dash-cat-b"><span>Balance</span><b className="num">{formatCurrency(cat.balance)}</b></div>
                    </li>
                  );
                })}
              </ul>
            </RanchSection>
          )}

          <RanchSection title="Summary" note="Full breakdown" icon={<Sparkles size={18} aria-hidden="true" />}>
            <dl className="dash-sum">
              <div><dt>Total debt</dt><dd>{formatCurrency(summary.totalBalance)}</dd></div>
              <div><dt>Monthly minimums</dt><dd>{formatCurrency(summary.totalMinimumPayments)}</dd></div>
              <div><dt>Total interest</dt><dd className="bad">{formatCurrency(plan.totalInterest)}</dd></div>
              <div><dt>Number of debts</dt><dd>{debts.length}</dd></div>
            </dl>
          </RanchSection>
        </div>
      </div>

      <PaymentModal isOpen={payOpen} onClose={closePayment} preselectedDebt={focus ?? undefined} />
      <span className="ranch-sr" aria-live="polite">{cheer ? 'Payment saved.' : ''}</span>
    </div>
  );
}

function Picket({ checked = false }: { checked?: boolean }) {
  return (
    <svg viewBox="0 0 22 44" aria-hidden="true">
      <path className="pk-b" d="M2 12 L11 2 L20 12 V42 H2 Z" />
      {checked && <path className="pk-c" d="M6 27 l4 4 7 -8" />}
    </svg>
  );
}
