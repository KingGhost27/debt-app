/**
 * useMilestoneDetection
 *
 * Detects when users cross debt milestone thresholds and triggers
 * celebration events. Uses localStorage to prevent duplicate celebrations.
 *
 * Milestone types: progress (25/50/75/100%), debt paid off, interest saved,
 * payment streaks, first payment.
 */

import { useEffect } from 'react';
import { generatePayoffPlan } from '../lib';
import { computePaymentStreak } from '../lib/milestones';
import type { Debt, Payment, StrategySettings } from '../types';
import type { MilestoneEvent, CelebrationStats, MilestoneType } from '../types/celebrations';

const LS_CELEBRATED_KEY = 'cowculator_celebrated';

function getCelebratedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_CELEBRATED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function markCelebrated(key: string): void {
  const keys = getCelebratedKeys();
  keys.add(key);
  try {
    localStorage.setItem(LS_CELEBRATED_KEY, JSON.stringify([...keys]));
  } catch {}
}

function hasCelebrated(key: string): boolean {
  return getCelebratedKeys().has(key);
}

/** Priority order: higher index = lower priority */
const MILESTONE_PRIORITY: MilestoneType[] = [
  'debt_free',
  'debt_paid_off',
  'progress_75',
  'progress_50',
  'progress_25',
  'interest_5000',
  'interest_1000',
  'interest_500',
  'streak_6',
  'streak_3',
  'first_payment',
];

function getMilestonePriority(type: MilestoneType): number {
  const idx = MILESTONE_PRIORITY.indexOf(type);
  return idx === -1 ? 999 : idx;
}

interface UseMilestoneDetectionOptions {
  debts: Debt[];
  payments: Payment[];
  strategy: StrategySettings;
  userName: string;
  triggerCelebration: (event: MilestoneEvent, stats: CelebrationStats) => void;
  currentCelebration: MilestoneEvent | null;
}

export function useMilestoneDetection({
  debts,
  payments,
  strategy,
  userName,
  triggerCelebration,
  currentCelebration,
}: UseMilestoneDetectionOptions): void {
  useEffect(() => {
    // Don't queue another celebration if one is already showing
    if (currentCelebration) return;
    if (debts.length === 0) return;

    const completedPayments = payments.filter((p) => p.isCompleted);

    // ─── Core stats ───────────────────────────────────────────────
    const totalOriginal = debts.reduce((sum, d) => sum + (d.originalBalance ?? d.balance), 0);
    const totalPaid = completedPayments.reduce((sum, p) => sum + (p.principal ?? 0), 0);
    const percentPaid = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;
    const totalInterestSaved = completedPayments.reduce((sum, p) => sum + (p.interest ?? 0), 0);

    // Streak
    const streakData = computePaymentStreak(payments, debts);
    const streakMonths = streakData.consecutiveMonths;

    // Payoff date from plan
    let debtFreeDate = 'Unknown';
    try {
      const plan = generatePayoffPlan(debts, strategy);
      debtFreeDate = plan.debtFreeDate;
    } catch {}

    const stats: CelebrationStats = {
      userName,
      totalOriginal,
      totalPaid,
      percentPaid,
      interestSaved: totalInterestSaved,
      debtFreeDate,
    };

    // ─── Collect pending (uncelebrated) milestones ────────────────
    const pending: Array<{ event: MilestoneEvent; key: string }> = [];

    const addIfNew = (key: string, event: MilestoneEvent) => {
      if (!hasCelebrated(key)) {
        pending.push({ event, key });
      }
    };

    // Progress milestones
    if (percentPaid >= 25) {
      addIfNew('progress_25', {
        type: 'progress_25',
        isFullHerd: false,
        headline: "YOU'RE QUARTER WAY THERE! 🌟",
        subtext: 'Great start — 25% of your debt is crushed!',
      });
    }
    if (percentPaid >= 50) {
      addIfNew('progress_50', {
        type: 'progress_50',
        isFullHerd: false,
        headline: "HALFWAY THERE! 🎯",
        subtext: "You're officially past the midpoint. Keep going!",
      });
    }
    if (percentPaid >= 75) {
      addIfNew('progress_75', {
        type: 'progress_75',
        isFullHerd: false,
        headline: 'SO CLOSE! 🔥',
        subtext: "75% done — you can see the finish line from here!",
      });
    }
    if (percentPaid >= 100) {
      addIfNew('debt_free', {
        type: 'debt_free',
        isFullHerd: true,
        headline: 'YOU ARE DEBT FREE! 🎉',
        subtext: "Every debt is gone. This is the moment. You did it!",
      });
    }

    // Individual debt payoffs
    for (const debt of debts) {
      if (debt.balance <= 0) {
        const key = `debt_paid_off_${debt.id}`;
        addIfNew(key, {
          type: 'debt_paid_off',
          isFullHerd: true,
          headline: `${debt.name.toUpperCase()} IS PAID OFF! 🎊`,
          subtext: `One less debt. You are unstoppable!`,
          debtName: debt.name,
          debtId: debt.id,
        });
      }
    }

    // Interest saved milestones
    if (totalInterestSaved >= 500) {
      addIfNew('interest_500', {
        type: 'interest_500',
        isFullHerd: false,
        headline: 'SAVED $500 IN INTEREST! 💰',
        subtext: "That's real money back in your pocket.",
      });
    }
    if (totalInterestSaved >= 1000) {
      addIfNew('interest_1000', {
        type: 'interest_1000',
        isFullHerd: false,
        headline: 'SAVED $1,000 IN INTEREST! 💰💰',
        subtext: 'Four digits saved. You are a money wizard.',
      });
    }
    if (totalInterestSaved >= 5000) {
      addIfNew('interest_5000', {
        type: 'interest_5000',
        isFullHerd: false,
        headline: 'SAVED $5,000 IN INTEREST! 🤑',
        subtext: "Five thousand dollars that stayed yours. Incredible.",
      });
    }

    // Payment streaks
    if (streakMonths >= 3) {
      addIfNew('streak_3', {
        type: 'streak_3',
        isFullHerd: false,
        headline: '3-MONTH STREAK! 🔥',
        subtext: 'Three months of consistent payments. Momentum is everything.',
      });
    }
    if (streakMonths >= 6) {
      addIfNew('streak_6', {
        type: 'streak_6',
        isFullHerd: false,
        headline: '6-MONTH STREAK! ⚡',
        subtext: 'Half a year of crushing it. You are a machine.',
      });
    }

    // First payment
    if (completedPayments.length === 1) {
      addIfNew('first_payment', {
        type: 'first_payment',
        isFullHerd: false,
        headline: 'FIRST PAYMENT LOGGED! 🌱',
        subtext: "Every journey starts with a single step. You've started!",
      });
    }

    if (pending.length === 0) return;

    // ─── Priority: fire the highest-priority uncelebrated milestone ─
    const winner = pending.sort((a, b) =>
      getMilestonePriority(a.event.type) - getMilestonePriority(b.event.type)
    )[0];

    // Build final stats (attach debtName for share card)
    const finalStats: CelebrationStats = {
      ...stats,
      paidOffDebtName: winner.event.debtName,
    };

    markCelebrated(winner.key);
    triggerCelebration(winner.event, finalStats);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, debts]);
}
