/**
 * Core data types for the Debt Payoff App
 *
 * These models represent all the data needed to track debts,
 * plan payoff strategies, and visualize progress.
 */

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

export interface Debt {
  id: string;
  name: string;                    // e.g., "Chase", "Ally", "Mohela"
  category: DebtCategory;
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
}

export interface AppData {
  version: string;                 // For migration support
  debts: Debt[];
  payments: Payment[];             // Historical and upcoming
  strategy: StrategySettings;
  settings: UserSettings;
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

export const DEFAULT_SETTINGS: UserSettings = {
  userName: '',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
};

export const DEFAULT_APP_DATA: AppData = {
  version: '1.0.0',
  debts: [],
  payments: [],
  strategy: DEFAULT_STRATEGY,
  settings: DEFAULT_SETTINGS,
};

// ============================================
// UTILITY TYPES
// ============================================

export interface DebtSummary {
  totalBalance: number;
  totalMinimumPayments: number;
  totalCreditLimit: number;
  creditUtilization: number;       // Percentage
  debtsByCategory: Record<DebtCategory, number>;
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
  student_loan: { label: 'Student Loan', color: '#22c55e' },
  personal_loan: { label: 'Personal Loan', color: '#f59e0b' },
  auto_loan: { label: 'Auto Loan', color: '#06b6d4' },
  mortgage: { label: 'Mortgage', color: '#ec4899' },
  medical: { label: 'Medical', color: '#ef4444' },
  other: { label: 'Other', color: '#6b7280' },
};
