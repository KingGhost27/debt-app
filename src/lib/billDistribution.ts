/**
 * Bill Distribution Analysis
 *
 * Analyzes how bills are distributed across pay periods
 * and suggests optimal due dates to balance payments.
 */

import {
  endOfMonth,
  isSameDay,
} from 'date-fns';
import type { Debt, IncomeSource } from '../types';
import { getPaydaysInMonth } from './calculations';

// ============================================
// TYPES
// ============================================

export interface PayPeriod {
  id: string;
  startDay: number;
  endDay: number;
  payDate: Date;
  bills: Debt[];
  totalAmount: number;
}

export interface BillSuggestion {
  debtId: string;
  debtName: string;
  currentDueDay: number;
  suggestedDueDay: number;
  reason: string;
  amountImpact: number;
}

export interface DistributionAnalysis {
  payPeriods: PayPeriod[];
  isBalanced: boolean;
  balanceScore: number; // 0-100, higher = more balanced
  totalBillAmount: number;
  suggestions: BillSuggestion[];
  message: string;
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Analyze pay periods for a given month based on income sources
 */
export function analyzePayPeriods(
  incomeSources: IncomeSource[],
  monthDate: Date = new Date()
): PayPeriod[] {
  // Get all paydays from all income sources
  const allPaydays: Date[] = [];

  incomeSources.forEach((source) => {
    const paydays = getPaydaysInMonth(source, monthDate);
    allPaydays.push(...paydays);
  });

  if (allPaydays.length === 0) {
    return [];
  }

  // Sort paydays chronologically
  allPaydays.sort((a, b) => a.getTime() - b.getTime());

  // Remove duplicates (same day)
  const uniquePaydays = allPaydays.filter(
    (date, index, arr) =>
      index === 0 || !isSameDay(date, arr[index - 1])
  );

  // Create pay periods
  const monthEnd = endOfMonth(monthDate);
  const periods: PayPeriod[] = [];

  for (let i = 0; i < uniquePaydays.length; i++) {
    const payDate = uniquePaydays[i];
    const startDay = payDate.getDate();

    // End day is the day before next payday, or end of month
    let endDay: number;
    if (i < uniquePaydays.length - 1) {
      endDay = uniquePaydays[i + 1].getDate() - 1;
    } else {
      endDay = monthEnd.getDate();
    }

    periods.push({
      id: `period-${i}`,
      startDay,
      endDay,
      payDate,
      bills: [],
      totalAmount: 0,
    });
  }

  // Handle bills due before first payday (assign to first period)
  if (periods.length > 0 && periods[0].startDay > 1) {
    periods[0].startDay = 1;
  }

  return periods;
}

/**
 * Assign bills to their respective pay periods
 */
export function assignBillsToPeriods(
  debts: Debt[],
  payPeriods: PayPeriod[]
): PayPeriod[] {
  // Create a copy to avoid mutating
  const periods = payPeriods.map((p) => ({
    ...p,
    bills: [] as Debt[],
    totalAmount: 0,
  }));

  debts.forEach((debt) => {
    // Find which period this bill falls into
    const period = periods.find(
      (p) => debt.dueDay >= p.startDay && debt.dueDay <= p.endDay
    );

    if (period) {
      period.bills.push(debt);
      period.totalAmount += debt.minimumPayment;
    } else if (periods.length > 0) {
      // If due day is before first period start, assign to first period
      periods[0].bills.push(debt);
      periods[0].totalAmount += debt.minimumPayment;
    }
  });

  return periods;
}

/**
 * Calculate how balanced the bill distribution is
 * Returns a score from 0-100 (100 = perfectly balanced)
 */
export function calculateBalanceScore(payPeriods: PayPeriod[]): number {
  if (payPeriods.length <= 1) {
    return 100; // Can't be unbalanced with 0 or 1 period
  }

  const amounts = payPeriods.map((p) => p.totalAmount);
  const total = amounts.reduce((sum, a) => sum + a, 0);

  if (total === 0) {
    return 100; // No bills = perfectly balanced
  }

  const average = total / amounts.length;

  // Calculate variance
  const variance =
    amounts.reduce((sum, a) => sum + Math.pow(a - average, 2), 0) /
    amounts.length;

  // Normalize variance to a 0-100 score
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = average > 0 ? stdDev / average : 0;

  // Convert to score (0% CV = 100 score, 100% CV = 0 score)
  const score = Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));

  return Math.round(score);
}

/**
 * Generate suggestions for rebalancing bills
 */
export function generateSuggestions(
  payPeriods: PayPeriod[]
): BillSuggestion[] {
  if (payPeriods.length <= 1) {
    return [];
  }

  const suggestions: BillSuggestion[] = [];
  const totalAmount = payPeriods.reduce((sum, p) => sum + p.totalAmount, 0);
  const avgAmount = totalAmount / payPeriods.length;

  // Identify overloaded and underloaded periods
  const overloadedThreshold = avgAmount * 1.15;
  const underloadedThreshold = avgAmount * 0.85;

  const overloaded = payPeriods.filter((p) => p.totalAmount > overloadedThreshold);
  const underloaded = payPeriods.filter((p) => p.totalAmount < underloadedThreshold);

  if (overloaded.length === 0 || underloaded.length === 0) {
    return [];
  }

  // For each overloaded period, suggest moving bills to underloaded periods
  overloaded.forEach((period) => {
    const sortedBills = [...period.bills].sort(
      (a, b) => a.minimumPayment - b.minimumPayment
    );

    let amountToMove = period.totalAmount - avgAmount;

    sortedBills.forEach((bill) => {
      if (amountToMove <= 0) return;

      const targetPeriod = underloaded.find(
        (p) => p.totalAmount + bill.minimumPayment <= avgAmount * 1.1
      );

      if (targetPeriod) {
        const suggestedDay = Math.min(
          targetPeriod.payDate.getDate() + 3,
          targetPeriod.endDay
        );

        suggestions.push({
          debtId: bill.id,
          debtName: bill.name,
          currentDueDay: bill.dueDay,
          suggestedDueDay: suggestedDay,
          reason: `Move to lighter pay period`,
          amountImpact: bill.minimumPayment,
        });

        amountToMove -= bill.minimumPayment;
        targetPeriod.totalAmount += bill.minimumPayment;
      }
    });
  });

  return suggestions;
}

/**
 * Main analysis function - combines all analysis steps
 */
export function analyzeBillDistribution(
  debts: Debt[],
  incomeSources: IncomeSource[],
  monthDate: Date = new Date()
): DistributionAnalysis {
  const rawPeriods = analyzePayPeriods(incomeSources, monthDate);

  if (rawPeriods.length === 0) {
    return {
      payPeriods: [],
      isBalanced: true,
      balanceScore: 0,
      totalBillAmount: 0,
      suggestions: [],
      message: 'Add your income sources to analyze bill distribution.',
    };
  }

  const payPeriods = assignBillsToPeriods(debts, rawPeriods);
  const balanceScore = calculateBalanceScore(payPeriods);
  const isBalanced = balanceScore >= 80;
  const totalBillAmount = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const suggestions = isBalanced ? [] : generateSuggestions(payPeriods);

  let message: string;
  if (debts.length === 0) {
    message = 'Add debts to analyze bill distribution.';
  } else if (payPeriods.length === 1) {
    message = 'You have one pay period per month.';
  } else if (isBalanced) {
    message = 'Your bills are well distributed!';
  } else if (suggestions.length > 0) {
    message = `Bills are uneven. ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} to balance.`;
  } else {
    message = 'Bills could be more evenly distributed.';
  }

  return {
    payPeriods,
    isBalanced,
    balanceScore,
    totalBillAmount,
    suggestions,
    message,
  };
}
