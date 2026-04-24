/**
 * Free/Pro tier limits and feature gates.
 *
 * Single source of truth for what's free vs Pro. Edit here to tune the
 * tier strategy without hunting through components.
 */

import type { ThemePreset } from '../types';

export const FREE_LIMITS = {
  DEBTS: 4,
  INCOME_SOURCES: 2,
  EXPENSE_ENTRIES: 10,
  CUSTOM_CATEGORIES: 3,
} as const;

export const FREE_THEMES: ReadonlyArray<ThemePreset> = [
  'default',      // Lavender Dream
  'my-melody',    // Rose Milk
  'cinnamoroll',  // Cloud Nine
];

export function isThemeFree(preset: ThemePreset): boolean {
  return FREE_THEMES.includes(preset);
}

export type ProFeature =
  | 'unlimited_debts'
  | 'unlimited_income_sources'
  | 'unlimited_expense_entries'
  | 'unlimited_custom_categories'
  | 'premium_themes'
  | 'asset_tracking'
  | 'interest_vs_principal_chart'
  | 'payment_history'
  | 'bill_calendar'
  | 'bill_distribution'
  | 'data_export';

export const PRO_FEATURE_COPY: Record<ProFeature, { title: string; description: string }> = {
  unlimited_debts: {
    title: 'Unlimited Debts',
    description: `Track all your debts. Free plan is limited to ${FREE_LIMITS.DEBTS}.`,
  },
  unlimited_income_sources: {
    title: 'Multiple Income Sources',
    description: `Track every paycheck. Free plan is limited to ${FREE_LIMITS.INCOME_SOURCES} sources.`,
  },
  unlimited_expense_entries: {
    title: 'Full Expense Tracker',
    description: `Log every expense. Free plan is limited to ${FREE_LIMITS.EXPENSE_ENTRIES} entries.`,
  },
  unlimited_custom_categories: {
    title: 'Unlimited Custom Categories',
    description: `Create as many categories as you need. Free plan is limited to ${FREE_LIMITS.CUSTOM_CATEGORIES}.`,
  },
  premium_themes: {
    title: 'All Kawaii Themes',
    description: 'Unlock all 9 kawaii themes — Kuromi, Hello Kitty, Keroppi, and more.',
  },
  asset_tracking: {
    title: 'Asset Tracking',
    description: 'Track savings, 401(k), Roth IRA, and see your full net worth.',
  },
  interest_vs_principal_chart: {
    title: 'Interest vs Principal Chart',
    description: 'See exactly how much of each payment reduces your balance.',
  },
  payment_history: {
    title: 'Payment History & Streaks',
    description: 'Review every payment and build a streak you can see.',
  },
  bill_calendar: {
    title: 'Bill Calendar',
    description: 'See every upcoming bill in a calendar view.',
  },
  bill_distribution: {
    title: 'Bill Distribution Panel',
    description: 'Automatically split your bills across paychecks.',
  },
  data_export: {
    title: 'Data Export',
    description: 'Export your data to CSV or JSON for backup and analysis.',
  },
};
