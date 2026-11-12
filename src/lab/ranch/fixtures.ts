/**
 * Ranch lab fixtures: synthetic sample data (persona "Mia"). Dev-only.
 * Every record is made up. Shapes follow src/types.
 */

import type {
  AppData,
  Asset,
  Debt,
  IncomeSource,
  Payment,
  ReceivedPaycheck,
  Subscription,
  ThemeSettings,
} from '../../types';
import { DEFAULT_DEDUCTIONS } from '../../types';

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 15, 0, 0)).toISOString();
/** Date-only (YYYY-MM-DD), the form the real forms store for date fields. */
const day = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const STAMP = iso(2026, 4, 1);

const debt = (
  id: string,
  name: string,
  category: string,
  balance: number,
  originalBalance: number,
  apr: number,
  minimumPayment: number,
  dueDay: number,
  creditLimit?: number,
): Debt => ({
  id, name, category, balance, originalBalance, apr, minimumPayment, dueDay,
  ...(creditLimit ? { creditLimit } : {}),
  createdAt: STAMP, updatedAt: STAMP,
});

const DEBTS: Debt[] = [
  debt('lab-store', 'Store card', 'credit_card', 640, 1200, 26.99, 35, 14, 1500),
  debt('lab-visa', 'Blue Visa', 'credit_card', 3240, 4100, 24.49, 96, 21, 5000),
  debt('lab-car', 'Car loan', 'auto_loan', 8450, 14000, 6.9, 289, 28),
  debt('lab-student', 'Student loan', 'student_loan', 11900, 13500, 5.5, 142, 1),
  debt('lab-medical', 'Medical bill', 'medical', 0, 950, 0, 0, 21),
];

const pay = (
  id: string, debtId: string, amount: number, date: string, interestShare = 0.15,
): Payment => ({
  id, debtId, amount,
  interest: Math.round(amount * interestShare * 100) / 100,
  principal: Math.round(amount * (1 - interestShare) * 100) / 100,
  date: date.slice(0, 10), type: 'minimum', isCompleted: true, completedAt: date,
});

/** One completed payment mid-month for each of the last 7 months before this one. */
function streakPayments(): Payment[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (i + 1), 12, 15));
    return pay(`lab-streak-${i}`, i % 2 ? 'lab-car' : 'lab-visa', i % 2 ? 289 : 96, d.toISOString());
  });
}

const PAYMENTS: Payment[] = [
  { ...pay('lab-p1', 'lab-store', 120, iso(2026, 11, 7), 0.2), type: 'extra' },
  pay('lab-p2', 'lab-car', 289, iso(2026, 11, 3), 0.1),
  pay('lab-p3', 'lab-visa', 96, iso(2026, 10, 28), 0.5),
  { ...pay('lab-p4', 'lab-medical', 95, iso(2026, 10, 21), 0), type: 'extra' },
  ...streakPayments(),
];

const INCOME: IncomeSource[] = [
  {
    id: 'lab-income', name: 'Day job', type: 'salary', payFrequency: 'bi-weekly', amount: 1900,
    deductions: { ...DEFAULT_DEDUCTIONS, federalTax: 8, stateTax: 0, retirement401k: 3 },
    nextPayDate: day(2026, 11, 21), payCycleEndDate: day(2026, 11, 21),
    createdAt: STAMP, updatedAt: STAMP,
  },
];

const PAYCHECKS: ReceivedPaycheck[] = [
  {
    id: 'lab-check', incomeSourceId: 'lab-income', payDate: day(2026, 11, 7),
    payPeriodStart: day(2026, 10, 25), payPeriodEnd: day(2026, 11, 7),
    expectedAmount: 1640, actualAmount: 1640, createdAt: iso(2026, 11, 7), updatedAt: iso(2026, 11, 7),
  },
];

const sub = (id: string, name: string, amount: number, category: Subscription['category'], next: string): Subscription => ({
  id, name, amount, category, frequency: { value: 1, unit: 'months' },
  nextBillingDate: next, isActive: true, createdAt: STAMP, updatedAt: STAMP,
});

const SUBSCRIPTIONS: Subscription[] = [
  sub('lab-sub1', 'Streamly', 15.49, 'entertainment', day(2026, 11, 16)),
  sub('lab-sub2', 'Tunebox', 10.99, 'entertainment', day(2026, 11, 19)),
  sub('lab-sub3', 'Cloud storage', 2.99, 'software', day(2026, 11, 24)),
  sub('lab-sub4', 'Gym', 24, 'health', day(2026, 12, 1)),
];

const asset = (id: string, name: string, type: Asset['type'], balance: number, institution: string, rate?: number): Asset => ({
  id, name, type, balance, institution, interestRate: rate,
  balanceHistory: [
    { id: `${id}-h1`, date: day(2026, 9, 30), balance: Math.round(balance * 0.93), note: 'Initial balance' },
    { id: `${id}-h2`, date: day(2026, 10, 31), balance },
  ],
  createdAt: STAMP, updatedAt: STAMP,
});

const ASSETS: Asset[] = [
  asset('lab-a1', 'Emergency fund', 'savings', 1850, 'Sample Credit Union', 4.2),
  asset('lab-a2', 'Checking', 'checking', 1240, 'Sample Bank'),
  asset('lab-a3', 'Roth IRA', 'roth_ira', 3400, 'Sample Brokerage'),
];

export function buildFixtureData(opts: { empty: boolean; theme: ThemeSettings }): AppData {
  return {
    version: '1.4.0',
    debts: opts.empty ? [] : DEBTS,
    payments: opts.empty ? [] : PAYMENTS,
    strategy: {
      strategy: 'snowball',
      recurringFunding: { amount: 850, dayOfMonth: 7, extraAmount: 288 },
      oneTimeFundings: [],
    },
    settings: {
      userName: 'Mia', currency: 'USD', dateFormat: 'MM/DD/YYYY',
      theme: opts.theme, categoryColors: {}, tutorialCompleted: true,
    },
    customCategories: [{ id: 'lab-cat1', name: 'Buy now, pay later', color: '#14b8a6', icon: '🛍️', createdAt: STAMP }],
    budget: {
      incomeSources: INCOME,
      monthlyExpenses: 1480,
      debtAllocationAmount: 850,
      expenseEntries: [
        { id: 'lab-e1', name: 'Rent share', category: 'housing', amount: 900 },
        { id: 'lab-e2', name: 'Groceries', category: 'groceries', amount: 380 },
        { id: 'lab-e3', name: 'Phone + internet', category: 'utilities', amount: 110 },
        { id: 'lab-e4', name: 'Gas', category: 'transport', amount: 90 },
      ],
    },
    assets: ASSETS,
    subscriptions: SUBSCRIPTIONS,
    receivedPaychecks: opts.empty ? [] : PAYCHECKS,
  };
}
