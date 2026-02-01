/**
 * Core data types for the Debt Payoff App
 *
 * These models represent all the data needed to track debts,
 * plan payoff strategies, and visualize progress.
 */

// ============================================
// THEME TYPES
// ============================================

export type ThemePreset = 'default' | 'my-melody' | 'kuromi' | 'custom';

export interface ThemeColors {
  primary50: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary800: string;
  primary900: string;
  accent: string;
  accentLight: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface ThemeSettings {
  preset: ThemePreset;
  customColors?: ThemeColors;
  darkMode?: boolean;
}

// ============================================
// CUSTOM CATEGORY TYPES
// ============================================

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;                   // Optional emoji
  createdAt: string;
}

// ============================================
// DEBT TYPES
// ============================================

export type DebtCategory =
  | 'credit_card'
  | 'student_loan'
  | 'personal_loan'
  | 'auto_loan'
  | 'mortgage'
  | 'medical'
  | 'other';

// Extended to support custom categories (custom category ID as string)
export type DebtCategoryExtended = DebtCategory | string;

export interface Debt {
  id: string;
  name: string;                    // e.g., "Chase", "Ally", "Mohela"
  category: DebtCategoryExtended;  // Built-in or custom category
  balance: number;                 // Current balance owed
  originalBalance: number;         // Starting balance (for progress tracking)
  apr: number;                     // Annual Percentage Rate (e.g., 15.99)
  minimumPayment: number;          // Required monthly minimum
  dueDay: number;                  // Day of month payment is due (1-31)

  // Optional fields for credit-based debts
  creditLimit?: number;            // Credit limit (for utilization calc)

  // Metadata
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}

// ============================================
// PAYMENT & TRANSACTION TYPES
// ============================================

export type PaymentType = 'minimum' | 'extra' | 'one_time' | 'funding';

export interface Payment {
  id: string;
  debtId: string;                  // Which debt this payment is for
  amount: number;
  principal: number;               // Portion that goes to principal
  interest: number;                // Portion that goes to interest
  date: string;                    // ISO date string
  type: PaymentType;
  isCompleted: boolean;
  completedAt?: string;            // When marked as paid
}

export interface RecurringFunding {
  amount: number;                  // Total monthly amount for debt payments
  dayOfMonth: number;              // When funding arrives (e.g., 1st of month)
  extraAmount: number;             // Amount beyond minimums
}

export interface OneTimeFunding {
  id: string;
  name: string;                    // e.g., "Tax Refund", "Bonus"
  amount: number;
  date: string;                    // When expected
  isApplied: boolean;
}

// ============================================
// STRATEGY TYPES
// ============================================

export type PayoffStrategy = 'avalanche' | 'snowball';

// Avalanche: Pay highest APR first (saves most money)
// Snowball: Pay lowest balance first (psychological wins)

export interface StrategySettings {
  strategy: PayoffStrategy;
  recurringFunding: RecurringFunding;
  oneTimeFundings: OneTimeFunding[];
}

// ============================================
// INCOME & BUDGET TYPES
// ============================================

export type PayFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
export type EmploymentType = 'salary' | 'hourly';

export interface PaycheckDeductions {
  federalTax: number;      // Federal income tax withholding (%)
  stateTax: number;        // State income tax (%)
  medicare: number;        // Medicare tax, typically 1.45% (FICA)
  socialSecurity: number;  // Social Security tax, typically 6.2% (FICA)
  retirement401k: number;  // 401k/retirement contribution (%)
  other: number;           // Other deductions: HSA, insurance, union dues, etc.
}

export const DEFAULT_DEDUCTIONS: PaycheckDeductions = {
  federalTax: 0,
  stateTax: 0,
  medicare: 1.45,
  socialSecurity: 6.2,
  retirement401k: 0,
  other: 0,
};

export interface IncomeSource {
  id: string;
  name: string;                    // e.g., "Primary Job", "Side Gig"
  type: EmploymentType;
  payFrequency: PayFrequency;
  // For salary/fixed income
  amount?: number;                 // Per-period amount (gross)
  // For hourly income
  hourlyRate?: number;
  hoursPerWeek?: number;
  isPartTime?: boolean;
  // Paycheck deductions (percentages)
  deductions?: PaycheckDeductions;
  // Payday configuration
  nextPayDate?: string;            // ISO date of next expected payday
  payCycleEndDate?: string;        // ISO date of next pay cycle end
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSettings {
  incomeSources: IncomeSource[];
  monthlyExpenses: number;         // Total monthly expenses
  debtAllocationAmount: number;    // Fixed amount to allocate to debt
  debtAllocationPercent?: number;  // Alternative: percentage of available
}

// ============================================
// PAYOFF PLAN TYPES
// ============================================

export interface PayoffMilestone {
  debtId: string;
  debtName: string;
  payoffDate: string;              // ISO date string
  totalPaid: number;               // Total paid to this debt
  interestPaid: number;            // Total interest paid
}

export interface PayoffStep {
  stepNumber: number;
  completionDate: string;
  debtsPayingMinimum: string[];    // Debt IDs paying minimum
  debtReceivingExtra: string | null; // Debt ID getting extra payments
  milestonesInStep: PayoffMilestone[]; // Debts paid off in this step
}

export interface PayoffPlan {
  debtFreeDate: string;            // When all debts are paid
  totalPayments: number;           // Total amount paid
  totalInterest: number;           // Total interest paid
  steps: PayoffStep[];
  monthlyBreakdown: MonthlyPayment[];
}

export interface MonthlyPayment {
  month: string;                   // "2026-01" format
  payments: {
    debtId: string;
    debtName: string;
    amount: number;
    principal: number;
    interest: number;
    remainingBalance: number;
    type: 'minimum' | 'extra';
  }[];
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
}

// ============================================
// AMORTIZATION TYPES
// ============================================

export interface AmortizationRow {
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

// ============================================
// APP STATE & STORAGE TYPES
// ============================================

export interface UserSettings {
  userName: string;
  currency: string;                // e.g., "USD"
  dateFormat: string;              // e.g., "MM/DD/YYYY"
  theme: ThemeSettings;            // Theme preference
  categoryColors: Record<string, string>; // Override colors for categories
}

export interface AppData {
  version: string;                 // For migration support
  debts: Debt[];
  payments: Payment[];             // Historical and upcoming
  strategy: StrategySettings;
  settings: UserSettings;
  customCategories: CustomCategory[]; // User-defined categories
  budget: BudgetSettings;          // Income & budget settings
  exportedAt?: string;             // For import/export
}

// Default values
export const DEFAULT_STRATEGY: StrategySettings = {
  strategy: 'avalanche',
  recurringFunding: {
    amount: 0,
    dayOfMonth: 1,
    extraAmount: 0,
  },
  oneTimeFundings: [],
};

export const DEFAULT_THEME: ThemeSettings = {
  preset: 'default',
  darkMode: false,
};

export const DEFAULT_SETTINGS: UserSettings = {
  userName: '',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  theme: DEFAULT_THEME,
  categoryColors: {},
};

export const DEFAULT_BUDGET: BudgetSettings = {
  incomeSources: [],
  monthlyExpenses: 0,
  debtAllocationAmount: 0,
};

export const DEFAULT_APP_DATA: AppData = {
  version: '1.1.0',
  debts: [],
  payments: [],
  strategy: DEFAULT_STRATEGY,
  settings: DEFAULT_SETTINGS,
  customCategories: [],
  budget: DEFAULT_BUDGET,
};

// ============================================
// UTILITY TYPES
// ============================================

export interface DebtSummary {
  totalBalance: number;
  totalMinimumPayments: number;
  totalCreditLimit: number;
  creditUtilization: number;       // Percentage
  debtsByCategory: Record<string, number>; // Supports both built-in and custom categories
  principalPaid: number;
  percentPaid: number;
}

export interface CategoryInfo {
  category: DebtCategory;
  label: string;
  color: string;
}

export const CATEGORY_INFO: Record<DebtCategory, { label: string; color: string }> = {
  credit_card: { label: 'Credit Card', color: '#8b5cf6' },
  student_loan: { label: 'Student Loan', color: '#f59e0b' },
  personal_loan: { label: 'Personal Loan', color: '#22c55e' },
  auto_loan: { label: 'Auto Loan', color: '#3b82f6' },
  mortgage: { label: 'Mortgage', color: '#ec4899' },
  medical: { label: 'Medical', color: '#ef4444' },
  other: { label: 'Other', color: '#6b7280' },
};
