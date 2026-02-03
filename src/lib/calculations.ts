/**
 * Financial Calculation Engine
 *
 * Core math for debt payoff projections, amortization,
 * and strategy comparisons.
 */

import {
  addMonths,
  addDays,
  format,
  differenceInMonths,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
} from 'date-fns';
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
  Asset,
  AssetType,
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

  // Track which one-time fundings have been applied
  const appliedFundingIds = new Set<string>();

  while (activeDebts.length > 0 && monthCount < maxMonths) {
    const monthPayments: MonthlyPayment['payments'] = [];
    const currentMonthStr = format(currentDate, 'yyyy-MM');

    // Calculate extra payment (funding minus all minimums)
    const currentMinimums = activeDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
    let extraPayment = Math.max(0, monthlyFunding - currentMinimums);

    // Add any one-time fundings that fall in this month
    for (const funding of settings.oneTimeFundings) {
      if (appliedFundingIds.has(funding.id)) continue;
      const fundingMonth = funding.date.slice(0, 7); // Extract 'yyyy-MM'
      if (fundingMonth === currentMonthStr) {
        extraPayment += funding.amount;
        appliedFundingIds.add(funding.id);
      }
    }

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

// ============================================
// BILL DUE DATE HELPERS
// ============================================

/**
 * Format a day number as an ordinal string
 * e.g., 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th"
 */
export function formatOrdinal(day: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Get the next due date for a bill based on its due day
 * Handles month rollovers and shorter months (clamps to last day of month)
 */
export function getNextDueDate(dueDay: number, fromDate: Date = new Date()): Date {
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);

  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Helper to clamp day to valid day in given month/year
  const clampDay = (year: number, month: number, day: number): number => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    return Math.min(day, lastDayOfMonth);
  };

  // If due day is today or later this month, use current month
  if (dueDay >= currentDay) {
    const clampedDay = clampDay(currentYear, currentMonth, dueDay);
    const dueDate = new Date(currentYear, currentMonth, clampedDay);
    if (dueDate >= today) {
      return dueDate;
    }
  }

  // Otherwise, use next month
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear++;
  }

  const clampedDay = clampDay(nextYear, nextMonth, dueDay);
  return new Date(nextYear, nextMonth, clampedDay);
}

// ============================================
// PAYDAY CALCULATIONS
// ============================================

/**
 * Get all paydays for an income source within a given month
 * Uses nextPayDate and payFrequency to calculate recurring paydays
 */
export function getPaydaysInMonth(source: IncomeSource, monthDate: Date): Date[] {
  if (!source.nextPayDate) return [];

  const paydays: Date[] = [];
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const nextPay = parseISO(source.nextPayDate);

  // For semi-monthly, we need special handling (1st & 15th or 15th & last)
  if (source.payFrequency === 'semi-monthly') {
    // Get the day of month from nextPayDate
    const payDay = nextPay.getDate();

    // Determine the two pay days based on the reference date
    let payDay1: number;
    let payDay2: number;

    if (payDay <= 15) {
      // First half reference means 1st & 15th pattern (or similar)
      payDay1 = payDay;
      payDay2 = payDay + 14; // Roughly 2 weeks later
      if (payDay2 > 28) payDay2 = 28; // Clamp to avoid month-end issues
    } else {
      // Second half reference means 15th & end-of-month pattern
      payDay1 = payDay - 14;
      if (payDay1 < 1) payDay1 = 1;
      payDay2 = payDay;
    }

    // Add both paydays for this month
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const lastDay = endOfMonth(monthDate).getDate();

    const date1 = new Date(year, month, Math.min(payDay1, lastDay));
    const date2 = new Date(year, month, Math.min(payDay2, lastDay));

    paydays.push(date1, date2);
    return paydays;
  }

  // For weekly, bi-weekly, monthly - iterate from first occurrence
  const intervalDays =
    source.payFrequency === 'weekly' ? 7 :
    source.payFrequency === 'bi-weekly' ? 14 :
    0; // monthly handled separately

  if (source.payFrequency === 'monthly') {
    // Monthly: same day each month
    const payDay = nextPay.getDate();
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const lastDay = endOfMonth(monthDate).getDate();
    const date = new Date(year, month, Math.min(payDay, lastDay));
    return [date];
  }

  // Weekly or bi-weekly: find all occurrences in the month
  // Start from a date well before the month and iterate forward
  let currentPayday = new Date(nextPay);

  // Go backwards to find a starting point before or at month start
  while (currentPayday > monthStart) {
    currentPayday = addDays(currentPayday, -intervalDays);
  }

  // Now iterate forward and collect all paydays in the month
  const maxIterations = 10; // Safety limit
  let iterations = 0;

  while (currentPayday <= monthEnd && iterations < maxIterations) {
    if (isWithinInterval(currentPayday, { start: monthStart, end: monthEnd })) {
      paydays.push(new Date(currentPayday));
    }
    currentPayday = addDays(currentPayday, intervalDays);
    iterations++;
  }

  return paydays;
}

/**
 * Get all pay cycle end dates for an income source within a given month
 * Uses payCycleEndDate and payFrequency to calculate recurring cycle ends
 */
export function getPayCycleEndsInMonth(source: IncomeSource, monthDate: Date): Date[] {
  if (!source.payCycleEndDate) return [];

  const cycleEnds: Date[] = [];
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const nextCycleEnd = parseISO(source.payCycleEndDate);

  // For semi-monthly, we need special handling
  if (source.payFrequency === 'semi-monthly') {
    const cycleDay = nextCycleEnd.getDate();

    let cycleDay1: number;
    let cycleDay2: number;

    if (cycleDay <= 15) {
      cycleDay1 = cycleDay;
      cycleDay2 = cycleDay + 14;
      if (cycleDay2 > 28) cycleDay2 = 28;
    } else {
      cycleDay1 = cycleDay - 14;
      if (cycleDay1 < 1) cycleDay1 = 1;
      cycleDay2 = cycleDay;
    }

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const lastDay = endOfMonth(monthDate).getDate();

    const date1 = new Date(year, month, Math.min(cycleDay1, lastDay));
    const date2 = new Date(year, month, Math.min(cycleDay2, lastDay));

    cycleEnds.push(date1, date2);
    return cycleEnds;
  }

  // For weekly, bi-weekly, monthly
  const intervalDays =
    source.payFrequency === 'weekly' ? 7 :
    source.payFrequency === 'bi-weekly' ? 14 :
    0;

  if (source.payFrequency === 'monthly') {
    const cycleDay = nextCycleEnd.getDate();
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const lastDay = endOfMonth(monthDate).getDate();
    const date = new Date(year, month, Math.min(cycleDay, lastDay));
    return [date];
  }

  // Weekly or bi-weekly
  let currentCycleEnd = new Date(nextCycleEnd);

  while (currentCycleEnd > monthStart) {
    currentCycleEnd = addDays(currentCycleEnd, -intervalDays);
  }

  const maxIterations = 10;
  let iterations = 0;

  while (currentCycleEnd <= monthEnd && iterations < maxIterations) {
    if (isWithinInterval(currentCycleEnd, { start: monthStart, end: monthEnd })) {
      cycleEnds.push(new Date(currentCycleEnd));
    }
    currentCycleEnd = addDays(currentCycleEnd, intervalDays);
    iterations++;
  }

  return cycleEnds;
}

// ============================================
// NET WORTH CALCULATIONS
// ============================================

/**
 * Calculate total assets value
 */
export function calculateTotalAssets(assets: Asset[]): number {
  return assets.reduce((sum, asset) => sum + asset.balance, 0);
}

/**
 * Calculate total debt value
 */
export function calculateTotalDebt(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + debt.balance, 0);
}

/**
 * Calculate net worth (assets minus debts)
 */
export function calculateNetWorth(assets: Asset[], debts: Debt[]): number {
  return calculateTotalAssets(assets) - calculateTotalDebt(debts);
}

/**
 * Group assets by type with totals
 */
export function calculateAssetsByType(assets: Asset[]): Record<AssetType, number> {
  return assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + asset.balance;
    return acc;
  }, {} as Record<AssetType, number>);
}

/**
 * Calculate total balance history over time
 * Returns an array of {date, totalBalance} sorted by date
 */
export function calculateAssetBalanceHistory(
  assets: Asset[]
): { date: string; totalBalance: number }[] {
  if (assets.length === 0) return [];

  // Collect all history entries with asset reference
  const allEntries: { date: string; assetId: string; balance: number }[] = [];

  for (const asset of assets) {
    for (const entry of asset.balanceHistory) {
      allEntries.push({
        date: entry.date,
        assetId: asset.id,
        balance: entry.balance,
      });
    }
  }

  // Sort by date
  allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Build running totals
  const assetBalances: Record<string, number> = {};
  const result: { date: string; totalBalance: number }[] = [];

  for (const entry of allEntries) {
    assetBalances[entry.assetId] = entry.balance;
    const totalBalance = Object.values(assetBalances).reduce((sum, bal) => sum + bal, 0);
    result.push({ date: entry.date, totalBalance });
  }

  return result;
}
