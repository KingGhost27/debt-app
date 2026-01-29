/**
 * Financial Calculation Engine
 *
 * Core math for debt payoff projections, amortization,
 * and strategy comparisons.
 */

import { addMonths, format, differenceInMonths, differenceInDays } from 'date-fns';
import type {
  Debt,
  DebtSummary,
  AmortizationRow,
  PayoffPlan,
  PayoffStep,
  MonthlyPayment,
  StrategySettings,
  IncomeSource,
  BudgetSettings,
} from '../types';

// ============================================
// BASIC CALCULATIONS
// ============================================

/**
 * Calculate monthly interest for a debt
 * Formula: balance * (APR / 12 / 100)
 */
export function calculateMonthlyInterest(balance: number, apr: number): number {
  return balance * (apr / 12 / 100);
}

/**
 * Calculate credit utilization percentage
 */
export function calculateUtilization(balance: number, limit: number): number {
  if (limit <= 0) return 0;
  return (balance / limit) * 100;
}

/**
 * Calculate how much of a payment goes to principal vs interest
 */
export function splitPayment(
  balance: number,
  apr: number,
  paymentAmount: number
): { principal: number; interest: number } {
  const interest = calculateMonthlyInterest(balance, apr);
  const principal = Math.max(0, paymentAmount - interest);

  return {
    interest: Math.min(interest, paymentAmount), // Can't pay more interest than payment
    principal: Math.min(principal, balance), // Can't pay more principal than balance
  };
}

// ============================================
// DEBT SUMMARY
// ============================================

/**
 * Calculate summary statistics for all debts
 */
export function calculateDebtSummary(debts: Debt[]): DebtSummary {
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.originalBalance, 0);
  const totalMinimumPayments = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

  // Credit utilization (only for debts with credit limits)
  const debtsWithLimits = debts.filter((d) => d.creditLimit && d.creditLimit > 0);
  const totalCreditLimit = debtsWithLimits.reduce((sum, d) => sum + (d.creditLimit || 0), 0);
  const totalCreditUsed = debtsWithLimits.reduce((sum, d) => sum + d.balance, 0);
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

  // Group by category (supports both built-in and custom categories)
  const debtsByCategory = debts.reduce(
    (acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + d.balance;
      return acc;
    },
    {} as Record<string, number>
  );

  // Progress tracking
  const principalPaid = totalOriginal - totalBalance;
  const percentPaid = totalOriginal > 0 ? (principalPaid / totalOriginal) * 100 : 0;

  return {
    totalBalance,
    totalMinimumPayments,
    totalCreditLimit,
    creditUtilization,
    debtsByCategory,
    principalPaid,
    percentPaid,
  };
}

// ============================================
// AMORTIZATION SCHEDULE
// ============================================

/**
 * Generate amortization schedule for a single debt
 * Shows month-by-month breakdown until payoff
 */
export function generateAmortization(
  debt: Debt,
  monthlyPayment: number,
  startDate: Date = new Date()
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = debt.balance;
  let currentDate = startDate;

  // Safety limit to prevent infinite loops
  const maxMonths = 360; // 30 years

  while (balance > 0.01 && schedule.length < maxMonths) {
    const interest = calculateMonthlyInterest(balance, debt.apr);
    const payment = Math.min(monthlyPayment, balance + interest);
    const principal = payment - interest;

    balance = Math.max(0, balance - principal);

    schedule.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      payment: round(payment),
      principal: round(principal),
      interest: round(interest),
      balance: round(balance),
    });

    currentDate = addMonths(currentDate, 1);
  }

  return schedule;
}

/**
 * Calculate payoff date for a single debt
 */
export function calculatePayoffDate(
  debt: Debt,
  monthlyPayment: number,
  startDate: Date = new Date()
): { date: Date; months: number; totalInterest: number } {
  let balance = debt.balance;
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 360;

  while (balance > 0.01 && months < maxMonths) {
    const interest = calculateMonthlyInterest(balance, debt.apr);
    totalInterest += interest;

    const payment = Math.min(monthlyPayment, balance + interest);
    const principal = payment - interest;
    balance = Math.max(0, balance - principal);
    months++;
  }

  return {
    date: addMonths(startDate, months),
    months,
    totalInterest: round(totalInterest),
  };
}

// ============================================
// PAYOFF STRATEGY
// ============================================

/**
 * Sort debts by strategy priority
 * Avalanche: Highest APR first (saves most money)
 * Snowball: Lowest balance first (quick wins)
 */
export function sortDebtsByStrategy(debts: Debt[], strategy: 'avalanche' | 'snowball'): Debt[] {
  return [...debts].sort((a, b) => {
    if (strategy === 'avalanche') {
      // Highest APR first
      return b.apr - a.apr;
    } else {
      // Lowest balance first
      return a.balance - b.balance;
    }
  });
}

// ============================================
// FULL PAYOFF PLAN
// ============================================

/**
 * Generate complete payoff plan with strategy
 *
 * This is the main calculation that powers the Plan page.
 * It simulates month-by-month payments and tracks when each debt is paid off.
 */
export function generatePayoffPlan(
  debts: Debt[],
  settings: StrategySettings,
  startDate: Date = new Date()
): PayoffPlan {
  if (debts.length === 0) {
    return {
      debtFreeDate: format(startDate, 'yyyy-MM-dd'),
      totalPayments: 0,
      totalInterest: 0,
      steps: [],
      monthlyBreakdown: [],
    };
  }

  // Clone debts so we don't mutate originals
  let activeDebts = debts.map((d) => ({ ...d }));
  const sortedPriority = sortDebtsByStrategy(debts, settings.strategy);

  const monthlyFunding = settings.recurringFunding.amount;
  const totalMinimums = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

  // If funding is less than minimums, we can't make progress
  if (monthlyFunding < totalMinimums) {
    console.warn('Monthly funding is less than total minimum payments');
  }

  const steps: PayoffStep[] = [];
  const monthlyBreakdown: MonthlyPayment[] = [];
  let currentDate = startDate;
  let currentStep: PayoffStep = {
    stepNumber: 1,
    completionDate: '',
    debtsPayingMinimum: activeDebts.map((d) => d.id),
    debtReceivingExtra: sortedPriority[0]?.id || null,
    milestonesInStep: [],
  };

  let totalPayments = 0;
  let totalInterest = 0;
  const maxMonths = 360;
  let monthCount = 0;

  while (activeDebts.length > 0 && monthCount < maxMonths) {
    const monthPayments: MonthlyPayment['payments'] = [];

    // Calculate extra payment (funding minus all minimums)
    const currentMinimums = activeDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const extraPayment = Math.max(0, monthlyFunding - currentMinimums);

    // Find the debt getting extra payments (highest priority that's still active)
    const priorityDebt = sortedPriority.find((p) => activeDebts.some((a) => a.id === p.id));

    // Process each active debt
    for (const debt of activeDebts) {
      const isGettingExtra = debt.id === priorityDebt?.id;
      const paymentAmount = debt.minimumPayment + (isGettingExtra ? extraPayment : 0);

      // Calculate interest and principal split
      const interest = calculateMonthlyInterest(debt.balance, debt.apr);
      const actualPayment = Math.min(paymentAmount, debt.balance + interest);
      const principal = actualPayment - Math.min(interest, actualPayment);

      // Update balance
      debt.balance = Math.max(0, debt.balance - principal);

      totalPayments += actualPayment;
      totalInterest += Math.min(interest, actualPayment);

      monthPayments.push({
        debtId: debt.id,
        debtName: debt.name,
        amount: round(actualPayment),
        principal: round(principal),
        interest: round(Math.min(interest, actualPayment)),
        remainingBalance: round(debt.balance),
        type: isGettingExtra ? 'extra' : 'minimum',
      });
    }

    // Record monthly breakdown
    monthlyBreakdown.push({
      month: format(currentDate, 'yyyy-MM'),
      payments: monthPayments,
      totalPayment: round(monthPayments.reduce((sum, p) => sum + p.amount, 0)),
      totalPrincipal: round(monthPayments.reduce((sum, p) => sum + p.principal, 0)),
      totalInterest: round(monthPayments.reduce((sum, p) => sum + p.interest, 0)),
    });

    // Check for paid off debts
    const paidOff = activeDebts.filter((d) => d.balance <= 0.01);

    for (const debt of paidOff) {
      const originalDebt = debts.find((d) => d.id === debt.id)!;
      currentStep.milestonesInStep.push({
        debtId: debt.id,
        debtName: debt.name,
        payoffDate: format(currentDate, 'yyyy-MM-dd'),
        totalPaid: originalDebt.originalBalance,
        interestPaid: 0, // Would need to track this separately
      });
    }

    // Remove paid off debts
    activeDebts = activeDebts.filter((d) => d.balance > 0.01);

    // If debts were paid off, finalize current step and start new one
    if (paidOff.length > 0 && activeDebts.length > 0) {
      currentStep.completionDate = format(currentDate, 'yyyy-MM-dd');
      steps.push(currentStep);

      const newPriorityDebt = sortedPriority.find((p) => activeDebts.some((a) => a.id === p.id));

      currentStep = {
        stepNumber: steps.length + 1,
        completionDate: '',
        debtsPayingMinimum: activeDebts.filter((d) => d.id !== newPriorityDebt?.id).map((d) => d.id),
        debtReceivingExtra: newPriorityDebt?.id || null,
        milestonesInStep: [],
      };
    }

    currentDate = addMonths(currentDate, 1);
    monthCount++;
  }

  // Finalize last step
  if (currentStep.milestonesInStep.length > 0 || steps.length === 0) {
    currentStep.completionDate = format(addMonths(currentDate, -1), 'yyyy-MM-dd');
    steps.push(currentStep);
  }

  return {
    debtFreeDate: format(addMonths(currentDate, -1), 'yyyy-MM-dd'),
    totalPayments: round(totalPayments),
    totalInterest: round(totalInterest),
    steps,
    monthlyBreakdown,
  };
}

// ============================================
// TIME FORMATTING
// ============================================

/**
 * Format the time until debt-free as "X years Y months"
 */
export function formatTimeUntil(targetDate: Date, fromDate: Date = new Date()): string {
  const totalMonths = differenceInMonths(targetDate, fromDate);

  if (totalMonths < 0) return 'Already debt-free!';
  if (totalMonths === 0) {
    const days = differenceInDays(targetDate, fromDate);
    return `${days} days`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;

  return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
}

/**
 * Format days until a date
 */
export function formatDaysUntil(targetDate: Date, fromDate: Date = new Date()): string {
  const days = differenceInDays(targetDate, fromDate);

  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';

  return `${days} days`;
}

// ============================================
// UTILITY
// ============================================

/**
 * Round to 2 decimal places (for money)
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency in compact notation for large amounts
 * e.g., $1,234,567 -> $1.2M
 */
export function formatCompactCurrency(amount: number, currency: string = 'USD'): string {
  if (amount >= 100000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  // For amounts under 100k, show full format but with fewer decimals for display
  if (amount >= 10000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return formatCurrency(amount, currency);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================
// INCOME CALCULATIONS
// ============================================

/**
 * Calculate gross monthly income from a single income source
 */
export function calculateGrossMonthlyIncome(source: IncomeSource): number {
  if (source.type === 'salary' && source.amount) {
    switch (source.payFrequency) {
      case 'weekly':
        return (source.amount * 52) / 12;
      case 'bi-weekly':
        return (source.amount * 26) / 12;
      case 'semi-monthly':
        return source.amount * 2;
      case 'monthly':
        return source.amount;
    }
  } else if (source.type === 'hourly' && source.hourlyRate && source.hoursPerWeek) {
    const weeklyPay = source.hourlyRate * source.hoursPerWeek;
    return (weeklyPay * 52) / 12;
  }
  return 0;
}

/**
 * Calculate total deduction percentage from an income source
 */
export function calculateTotalDeductionPercent(source: IncomeSource): number {
  if (!source.deductions) return 0;

  const d = source.deductions;
  return (
    d.federalTax +
    d.stateTax +
    d.medicare +
    d.socialSecurity +
    d.retirement401k +
    d.other
  );
}

/**
 * Calculate net (take-home) monthly income from a single income source
 * Applies all deductions to the gross income
 */
export function calculateNetMonthlyIncome(source: IncomeSource): number {
  const gross = calculateGrossMonthlyIncome(source);
  const deductionPercent = calculateTotalDeductionPercent(source);
  const deductionAmount = gross * (deductionPercent / 100);
  return Math.max(0, gross - deductionAmount);
}

/**
 * Calculate monthly income from a single income source
 * @deprecated Use calculateNetMonthlyIncome for accurate take-home pay
 */
export function calculateMonthlyIncome(source: IncomeSource): number {
  return calculateNetMonthlyIncome(source);
}

/**
 * Calculate total gross monthly income from all sources
 */
export function calculateTotalGrossMonthlyIncome(sources: IncomeSource[]): number {
  return sources.reduce((sum, source) => sum + calculateGrossMonthlyIncome(source), 0);
}

/**
 * Calculate total net (take-home) monthly income from all sources
 */
export function calculateTotalMonthlyIncome(sources: IncomeSource[]): number {
  return sources.reduce((sum, source) => sum + calculateNetMonthlyIncome(source), 0);
}

/**
 * Calculate available amount for debt payoff
 */
export function calculateAvailableForDebt(budget: BudgetSettings): number {
  const totalIncome = calculateTotalMonthlyIncome(budget.incomeSources);
  const available = totalIncome - budget.monthlyExpenses;
  return Math.max(0, available);
}
