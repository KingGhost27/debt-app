/**
 * Dashboard helpers: turn the debts and the active payoff plan into the
 * ranch trail (signposts in payoff order) and find the next bill due.
 * Pure functions, no debt math: they only read what the plan already says.
 */

import { addMonths, differenceInCalendarDays, getDaysInMonth, startOfDay } from 'date-fns';
import type { Debt, PayoffPlan } from '../types';
import type { RanchDebt } from '../components/ranch/RanchScene';

export interface TrailDebt {
  debt: Debt;
  /** 1-based place in the active strategy's payoff order (paid debts first). */
  rank: number;
  status: RanchDebt['status'];
}

const money0 = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/** Debts in the order the active strategy clears them: paid first, then plan order, then any the plan never clears. */
export function orderDebts(debts: Debt[], plan: PayoffPlan): TrailDebt[] {
  const planOrder: string[] = [];
  plan.steps.forEach((s) => s.milestonesInStep.forEach((m) => planOrder.push(m.debtId)));
  const paid = debts.filter((d) => d.balance <= 0).sort((a, b) => a.originalBalance - b.originalBalance);
  const active = debts.filter((d) => d.balance > 0);
  const inPlan = planOrder.map((id) => active.find((d) => d.id === id)).filter((d): d is Debt => !!d);
  const rest = active.filter((d) => !planOrder.includes(d.id)).sort((a, b) => a.balance - b.balance);
  const ordered = [...paid, ...inPlan, ...rest];
  const focusId = [...inPlan, ...rest][0]?.id;
  return ordered.map((debt, i) => ({
    debt,
    rank: i + 1,
    status: debt.balance <= 0 ? 'paid' : debt.id === focusId ? 'focus' : 'upcoming',
  }));
}

/**
 * Signposts: a paid debt sits at the share of the original total cleared by
 * then; an unpaid debt sits at the paid share plus the balance still ahead of
 * it, so the last post lands on the debt-free flag.
 */
export function toRanchDebts(ordered: TrailDebt[], paidShare: number): RanchDebt[] {
  const total = ordered.reduce((s, t) => s + Math.max(0, t.debt.originalBalance), 0);
  if (total <= 0) return [];
  let clearedOriginal = 0;
  let ahead = 0;
  return ordered.map(({ debt, status }) => {
    let position: number;
    if (status === 'paid') {
      clearedOriginal += debt.originalBalance;
      position = Math.min(clearedOriginal / total, Math.max(0.02, paidShare - 0.015));
    } else {
      ahead += debt.balance;
      position = Math.min(1, paidShare + ahead / total);
    }
    return {
      id: debt.id,
      name: debt.name,
      position,
      status,
      detail: status === 'focus' ? `${money0(debt.balance)} left` : undefined,
    };
  });
}

export interface NextDue {
  debt: Debt;
  date: Date;
  days: number;
}

/** The unpaid debt whose due day comes next (today counts). */
export function nextDue(debts: Debt[], now: Date = new Date()): NextDue | null {
  const today = startOfDay(now);
  let best: NextDue | null = null;
  for (const debt of debts) {
    if (debt.balance <= 0 || !debt.dueDay) continue;
    const at = (base: Date) =>
      new Date(base.getFullYear(), base.getMonth(), Math.min(debt.dueDay, getDaysInMonth(base)));
    let date = at(today);
    if (date < today) date = at(addMonths(today, 1));
    const days = differenceInCalendarDays(date, today);
    if (!best || days < best.days) best = { debt, date, days };
  }
  return best;
}
