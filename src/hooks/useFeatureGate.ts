/**
 * useFeatureGate
 *
 * Single hook that wraps useSubscription + app data to answer
 * "can the current user do X right now?" for every tier-gated action.
 */

import { useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { useApp } from '../context/AppContext';
import { FREE_LIMITS, isThemeFree } from '../lib/tierLimits';
import type { ThemePreset } from '../types';

export interface FeatureGate {
  isPro: boolean;
  isLoading: boolean;

  // Counts
  debtCount: number;
  incomeSourceCount: number;
  expenseEntryCount: number;
  customCategoryCount: number;

  // Can-add checks (true = allowed)
  canAddDebt: boolean;
  canAddIncomeSource: boolean;
  canAddExpenseEntry: boolean;
  canAddCustomCategory: boolean;

  // Feature-lock checks (true = locked)
  isAssetTrackingLocked: boolean;
  isInterestVsPrincipalLocked: boolean;
  isPaymentHistoryLocked: boolean;
  isBillCalendarLocked: boolean;
  isBillDistributionLocked: boolean;
  isDataExportLocked: boolean;

  isThemeLocked: (preset: ThemePreset) => boolean;
}

export function useFeatureGate(): FeatureGate {
  const { isPro, isLoading } = useSubscription();
  const { debts, budget, customCategories } = useApp();

  const debtCount = debts.length;
  const incomeSourceCount = budget.incomeSources.length;
  const expenseEntryCount = budget.expenseEntries?.length ?? 0;
  const customCategoryCount = customCategories.length;

  const isThemeLocked = useCallback(
    (preset: ThemePreset) => !isPro && !isThemeFree(preset),
    [isPro]
  );

  return {
    isPro,
    isLoading,

    debtCount,
    incomeSourceCount,
    expenseEntryCount,
    customCategoryCount,

    canAddDebt: isPro || debtCount < FREE_LIMITS.DEBTS,
    canAddIncomeSource: isPro || incomeSourceCount < FREE_LIMITS.INCOME_SOURCES,
    canAddExpenseEntry: isPro || expenseEntryCount < FREE_LIMITS.EXPENSE_ENTRIES,
    canAddCustomCategory: isPro || customCategoryCount < FREE_LIMITS.CUSTOM_CATEGORIES,

    isAssetTrackingLocked: !isPro,
    isInterestVsPrincipalLocked: !isPro,
    isPaymentHistoryLocked: !isPro,
    isBillCalendarLocked: !isPro,
    isBillDistributionLocked: !isPro,
    isDataExportLocked: !isPro,

    isThemeLocked,
  };
}
