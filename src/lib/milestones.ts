/**
 * Milestone & Streak Computation Utilities
 *
 * Pure functions for computing progress milestones, debt payoff timelines,
 * and payment streaks from existing app data.
 */

import { parseISO, startOfMonth, endOfMonth, subMonths, isSameMonth } from 'date-fns';
import type { Debt, Payment, PayoffPlan, MonthlyPayment } from '../types';

// ============================================
// TYPES
// ============================================

export interface OverallMilestone {
  percent: number;
  label: string;
  emoji: string;
  isReached: boolean;
  estimatedDate?: string; // ISO date when milestone is/was crossed
  amountAtMilestone: number; // Dollar amount paid at this milestone
}

export interface DebtTimelineEntry {
  debtId: string;
  debtName: string;
  payoffDate: string;
  currentBalance: number;
  originalBalance: number;
  percentPaid: number;
  isCompleted: boolean;
}

export interface StreakData {
  consecutiveMonths: number;
  currentMonthOnTrack: boolean;
  longestStreak: number;
  totalCompletedPayments: number;
  thisMonthPayments: number;
}

// ============================================
// OVERALL MILESTONES (25%, 50%, 75%, 100%)
// ============================================

const MILESTONE_DEFINITIONS = [
  { percent: 25, label: 'Quarter Way!', emoji: '🌟' },
  { percent: 50, label: 'Halfway!', emoji: '🎯' },
  { percent: 75, label: 'Almost There!', emoji: '🔥' },
  { percent: 100, label: 'Debt Free!', emoji: '🎉' },
];

export function computeOverallMilestones(
  percentPaid: number,
  totalOriginalBalance: number,
  monthlyBreakdown: MonthlyPayment[]
): OverallMilestone[] {
  return MILESTONE_DEFINITIONS.map(({ percent, label, emoji }) => {
    const amountAtMilestone = totalOriginalBalance * (percent / 100);
    const isReached = percentPaid >= percent;

    // Estimate when this milestone is/was crossed by walking the monthly breakdown
    let estimatedDate: string | undefined;
    if (monthlyBreakdown.length > 0) {
      let cumulativePrincipal = 0;
      const targetPrincipal = totalOriginalBalance * (percent / 100);

      for (const month of monthlyBreakdown) {
        cumulativePrincipal += month.totalPrincipal;
        if (cumulativePrincipal >= targetPrincipal) {
          estimatedDate = month.month + '-01';
          break;
        }
      }
    }

    return {
      percent,
      label,
      emoji,
      isReached,
      estimatedDate,
      amountAtMilestone,
    };
  });
}

// ============================================
// DEBT PAYOFF TIMELINE
// ============================================

export function computeDebtPayoffTimeline(
  debts: Debt[],
  plan: PayoffPlan
): DebtTimelineEntry[] {
  // Collect all milestones from plan steps
  const milestoneMap = new Map<string, { payoffDate: string; totalPaid: number }>();
  for (const step of plan.steps) {
    for (const milestone of step.milestonesInStep) {
      milestoneMap.set(milestone.debtId, {
        payoffDate: milestone.payoffDate,
        totalPaid: milestone.totalPaid,
      });
    }
  }

  return debts
    .map((debt) => {
      const milestone = milestoneMap.get(debt.id);
      const percentPaid =
        debt.originalBalance > 0
          ? Math.min(100, ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100)
          : 0;

      return {
        debtId: debt.id,
        debtName: debt.name,
        payoffDate: milestone?.payoffDate || plan.debtFreeDate,
        currentBalance: debt.balance,
        originalBalance: debt.originalBalance,
        percentPaid,
        isCompleted: debt.balance <= 0,
      };
    })
    .sort((a, b) => {
      // Completed debts first, then by payoff date
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
      return a.payoffDate.localeCompare(b.payoffDate);
    });
}

// ============================================
// PAYMENT STREAK
// ============================================

export function computePaymentStreak(
  payments: Payment[],
  debts: Debt[]
): StreakData {
  if (payments.length === 0 || debts.length === 0) {
    return {
      consecutiveMonths: 0,
      currentMonthOnTrack: false,
      longestStreak: 0,
      totalCompletedPayments: 0,
      thisMonthPayments: 0,
    };
  }

  const now = new Date();

  // Calculate consecutive streak (starting from last month)
  let streakMonths = 0;
  let checkMonth = subMonths(now, 1);

  for (let i = 0; i < 24; i++) {
    const monthStart = startOfMonth(checkMonth);
    const monthEnd = endOfMonth(checkMonth);

    const paymentsInMonth = payments.filter((p) => {
      if (!p.isCompleted || !p.completedAt) return false;
      const date = parseISO(p.completedAt);
      return date >= monthStart && date <= monthEnd;
    });

    if (paymentsInMonth.length > 0) {
      streakMonths++;
      checkMonth = subMonths(checkMonth, 1);
    } else {
      break;
    }
  }

  // Calculate longest streak ever
  let longestStreak = 0;
  let currentRun = 0;
  // Check last 36 months
  for (let i = 0; i < 36; i++) {
    const checkDate = subMonths(now, i + 1);
    const monthStart = startOfMonth(checkDate);
    const monthEnd = endOfMonth(checkDate);

    const hasPayment = payments.some((p) => {
      if (!p.isCompleted || !p.completedAt) return false;
      const date = parseISO(p.completedAt);
      return date >= monthStart && date <= monthEnd;
    });

    if (hasPayment) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 0;
    }
  }
  longestStreak = Math.max(longestStreak, streakMonths);

  // This month stats
  const thisMonthPayments = payments.filter((p) => {
    if (!p.isCompleted || !p.completedAt) return false;
    return isSameMonth(parseISO(p.completedAt), now);
  }).length;

  const totalCompletedPayments = payments.filter((p) => p.isCompleted).length;
  const currentMonthOnTrack = thisMonthPayments > 0;

  return {
    consecutiveMonths: streakMonths,
    currentMonthOnTrack,
    longestStreak,
    totalCompletedPayments,
    thisMonthPayments,
  };
}
