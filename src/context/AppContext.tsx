/**
 * App Context
 *
 * Global state management for the debt payoff app.
 * Reads/writes data from Supabase, with localStorage as offline cache.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  AppData,
  Debt,
  Payment,
  StrategySettings,
  UserSettings,
  CustomCategory,
  BudgetSettings,
  IncomeSource,
  ThemeSettings,
  OneTimeFunding,
  Asset,
  Subscription,
  ReceivedPaycheck,
} from '../types';
import { DEFAULT_APP_DATA, DEFAULT_STRATEGY, DEFAULT_BUDGET } from '../types';
import { exportData, exportPaymentsCSV, importData } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ============================================
// CONTEXT TYPES
// ============================================

interface AppContextType {
  debts: Debt[];
  payments: Payment[];
  strategy: StrategySettings;
  settings: UserSettings;
  customCategories: CustomCategory[];
  budget: BudgetSettings;
  assets: Asset[];
  subscriptions: Subscription[];
  receivedPaychecks: ReceivedPaycheck[];
  isLoading: boolean;

  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>;
  markPaymentComplete: (id: string) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  updateStrategy: (updates: Partial<StrategySettings>) => Promise<void>;

  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateTheme: (theme: ThemeSettings) => Promise<void>;
  updateCategoryColor: (categoryId: string, color: string) => Promise<void>;

  addCustomCategory: (category: Omit<CustomCategory, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomCategory: (id: string, updates: Partial<CustomCategory>) => Promise<void>;
  deleteCustomCategory: (id: string) => Promise<void>;

  updateBudget: (updates: Partial<BudgetSettings>) => Promise<void>;
  addIncomeSource: (source: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;

  addOneTimeFunding: (funding: Omit<OneTimeFunding, 'id' | 'isApplied'>) => Promise<void>;
  updateOneTimeFunding: (id: string, updates: Partial<OneTimeFunding>) => Promise<void>;
  deleteOneTimeFunding: (id: string) => Promise<void>;

  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'balanceHistory'>) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  updateAssetBalance: (id: string, newBalance: number, note?: string) => Promise<void>;

  addSubscription: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;

  addPaycheck: (paycheck: Omit<ReceivedPaycheck, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePaycheck: (id: string, updates: Partial<ReceivedPaycheck>) => Promise<void>;
  deletePaycheck: (id: string) => Promise<void>;

  exportAppData: () => void;
  exportPaymentHistory: () => void;
  importAppData: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;
}

// ============================================
// HELPERS
// ============================================

const LS_KEY = 'debtapp_cache';

function saveCache(data: AppData) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

function loadCache(): AppData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {}
  return DEFAULT_APP_DATA;
}

// ============================================
// CONTEXT
// ============================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => loadCache());
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('debtapp_cache'));

  // ------------------------------------------
  // LOAD ALL DATA FROM SUPABASE ON LOGIN
  // ------------------------------------------
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      if (!localStorage.getItem('debtapp_cache')) setIsLoading(true);

      const [
        { data: debts },
        { data: payments },
        { data: strategy },
        { data: budget },
        { data: categories },
        { data: assets },
        { data: subscriptions },
        { data: paychecks },
        { data: profile },
      ] = await Promise.all([
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('payments').select('*').eq('user_id', user.id),
        supabase.from('strategy_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('budget_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('custom_categories').select('*').eq('user_id', user.id),
        supabase.from('assets').select('*').eq('user_id', user.id),
        supabase.from('subscriptions').select('*').eq('user_id', user.id),
        supabase.from('received_paychecks').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);

      const loaded: AppData = {
        version: '1.4.0',
        debts: (debts ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          balance: Number(d.balance),
          originalBalance: Number(d.original_balance),
          apr: Number(d.apr),
          minimumPayment: Number(d.minimum_payment),
          dueDay: d.due_day,
          creditLimit: d.credit_limit != null ? Number(d.credit_limit) : undefined,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })),
        payments: (payments ?? []).map((p) => ({
          id: p.id,
          debtId: p.debt_id,
          amount: Number(p.amount),
          principal: Number(p.principal),
          interest: Number(p.interest),
          date: p.date,
          type: p.type,
          isCompleted: p.is_completed,
          completedAt: p.completed_at ?? undefined,
          note: p.note ?? undefined,
        })),
        strategy: strategy
          ? {
              strategy: strategy.strategy as 'avalanche' | 'snowball',
              recurringFunding: strategy.recurring_funding as StrategySettings['recurringFunding'],
              oneTimeFundings: (strategy.one_time_fundings as OneTimeFunding[]) ?? [],
            }
          : DEFAULT_STRATEGY,
        budget: budget
          ? {
              incomeSources: (budget.income_sources as IncomeSource[]) ?? [],
              monthlyExpenses: Number(budget.monthly_expenses),
              debtAllocationAmount: Number(budget.debt_allocation_amount),
              debtAllocationPercent: budget.debt_allocation_percent != null ? Number(budget.debt_allocation_percent) : undefined,
              expenseEntries: budget.expense_entries ?? [],
            }
          : DEFAULT_BUDGET,
        customCategories: (categories ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon ?? undefined,
          createdAt: c.created_at,
        })),
        assets: (assets ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: Number(a.balance),
          balanceHistory: a.balance_history ?? [],
          institution: a.institution ?? undefined,
          interestRate: a.interest_rate != null ? Number(a.interest_rate) : undefined,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        })),
        subscriptions: (subscriptions ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          amount: Number(s.amount),
          frequency: s.frequency,
          nextBillingDate: s.next_billing_date,
          category: s.category,
          isActive: s.is_active,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })),
        receivedPaychecks: (paychecks ?? []).map((p) => ({
          id: p.id,
          incomeSourceId: p.income_source_id,
          payDate: p.pay_date,
          payPeriodStart: p.pay_period_start,
          payPeriodEnd: p.pay_period_end,
          expectedAmount: Number(p.expected_amount),
          actualAmount: Number(p.actual_amount),
          note: p.note ?? undefined,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
        settings: profile
          ? {
              userName: profile.user_name ?? '',
              currency: profile.currency ?? 'USD',
              dateFormat: profile.date_format ?? 'MM/DD/YYYY',
              theme: profile.theme ?? { preset: 'default', darkMode: false },
              categoryColors: profile.category_colors ?? {},
            }
          : DEFAULT_APP_DATA.settings,
      };

      setData(loaded);
      saveCache(loaded);
      setIsLoading(false);
    };

    load();
  }, [user]);

  // Helper to update state + cache together
  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveCache(next);
      return next;
    });
  }, []);

  // ==========================================
  // DEBT OPERATIONS
  // ==========================================

  const addDebt = useCallback(async (debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const newDebt: Debt = { ...debtData, id: uuidv4(), createdAt: now, updatedAt: now };

    await supabase.from('debts').insert({
      id: newDebt.id,
      user_id: user.id,
      name: newDebt.name,
      category: newDebt.category,
      balance: newDebt.balance,
      original_balance: newDebt.originalBalance,
      apr: newDebt.apr,
      minimum_payment: newDebt.minimumPayment,
      due_day: newDebt.dueDay,
      credit_limit: newDebt.creditLimit ?? null,
      created_at: newDebt.createdAt,
      updated_at: newDebt.updatedAt,
    });

    update((prev) => ({ ...prev, debts: [...prev.debts, newDebt] }));
  }, [user, update]);

  const updateDebt = useCallback(async (id: string, updates: Partial<Debt>) => {
    if (!user) return;
    const now = new Date().toISOString();

    await supabase.from('debts').update({
      name: updates.name,
      category: updates.category,
      balance: updates.balance,
      original_balance: updates.originalBalance,
      apr: updates.apr,
      minimum_payment: updates.minimumPayment,
      due_day: updates.dueDay,
      credit_limit: updates.creditLimit ?? null,
      updated_at: now,
    }).eq('id', id).eq('user_id', user.id);

    update((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => d.id === id ? { ...d, ...updates, updatedAt: now } : d),
    }));
  }, [user, update]);

  const deleteDebt = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('debts').delete().eq('id', id).eq('user_id', user.id);
    await supabase.from('payments').delete().eq('debt_id', id).eq('user_id', user.id);
    update((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
      payments: prev.payments.filter((p) => p.debtId !== id),
    }));
  }, [user, update]);

  // ==========================================
  // PAYMENT OPERATIONS
  // ==========================================

  const addPayment = useCallback(async (paymentData: Omit<Payment, 'id'>) => {
    if (!user) return;
    const newPayment: Payment = { ...paymentData, id: uuidv4() };

    await supabase.from('payments').insert({
      id: newPayment.id,
      user_id: user.id,
      debt_id: newPayment.debtId,
      amount: newPayment.amount,
      principal: newPayment.principal,
      interest: newPayment.interest,
      date: newPayment.date,
      type: newPayment.type,
      is_completed: newPayment.isCompleted,
      completed_at: newPayment.completedAt ?? null,
      note: newPayment.note ?? null,
    });

    update((prev) => ({ ...prev, payments: [...prev.payments, newPayment] }));
  }, [user, update]);

  const updatePayment = useCallback(async (id: string, updates: Partial<Payment>) => {
    if (!user) return;
    await supabase.from('payments').update({
      amount: updates.amount,
      is_completed: updates.isCompleted,
      completed_at: updates.completedAt ?? null,
      note: updates.note ?? null,
    }).eq('id', id).eq('user_id', user.id);

    update((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => p.id === id ? { ...p, ...updates } : p),
    }));
  }, [user, update]);

  const markPaymentComplete = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    await updatePayment(id, { isCompleted: true, completedAt: now });
  }, [updatePayment]);

  const deletePayment = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('payments').delete().eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== id) }));
  }, [user, update]);

  // ==========================================
  // STRATEGY OPERATIONS
  // ==========================================

  const updateStrategy = useCallback(async (updates: Partial<StrategySettings>) => {
    if (!user) return;
    update((prev) => {
      const next = { ...prev.strategy, ...updates };
      supabase.from('strategy_settings').update({
        strategy: next.strategy,
        recurring_funding: next.recurringFunding,
        one_time_fundings: next.oneTimeFundings,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
      return { ...prev, strategy: next };
    });
  }, [user, update]);

  // ==========================================
  // SETTINGS OPERATIONS
  // ==========================================

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;
    update((prev) => {
      const next = { ...prev.settings, ...updates };
      supabase.from('profiles').update({
        user_name: next.userName,
        currency: next.currency,
        date_format: next.dateFormat,
        theme: next.theme,
        category_colors: next.categoryColors,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      return { ...prev, settings: next };
    });
  }, [user, update]);

  const updateTheme = useCallback(async (theme: ThemeSettings) => {
    await updateSettings({ theme });
  }, [updateSettings]);

  const updateCategoryColor = useCallback(async (categoryId: string, color: string) => {
    update((prev) => {
      const next = { ...prev.settings, categoryColors: { ...prev.settings.categoryColors, [categoryId]: color } };
      supabase.from('profiles').update({ category_colors: next.categoryColors, updated_at: new Date().toISOString() }).eq('id', user?.id);
      return { ...prev, settings: next };
    });
  }, [user, update]);

  // ==========================================
  // CUSTOM CATEGORY OPERATIONS
  // ==========================================

  const addCustomCategory = useCallback(async (categoryData: Omit<CustomCategory, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newCategory: CustomCategory = { ...categoryData, id: uuidv4(), createdAt: new Date().toISOString() };
    await supabase.from('custom_categories').insert({
      id: newCategory.id,
      user_id: user.id,
      name: newCategory.name,
      color: newCategory.color,
      icon: newCategory.icon ?? null,
      created_at: newCategory.createdAt,
    });
    update((prev) => ({ ...prev, customCategories: [...prev.customCategories, newCategory] }));
  }, [user, update]);

  const updateCustomCategory = useCallback(async (id: string, updates: Partial<CustomCategory>) => {
    if (!user) return;
    await supabase.from('custom_categories').update({ name: updates.name, color: updates.color, icon: updates.icon ?? null }).eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, customCategories: prev.customCategories.map((c) => c.id === id ? { ...c, ...updates } : c) }));
  }, [user, update]);

  const deleteCustomCategory = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('custom_categories').delete().eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, customCategories: prev.customCategories.filter((c) => c.id !== id) }));
  }, [user, update]);

  // ==========================================
  // BUDGET OPERATIONS
  // ==========================================

  const saveBudget = useCallback(async (budget: BudgetSettings) => {
    if (!user) return;
    await supabase.from('budget_settings').update({
      income_sources: budget.incomeSources,
      monthly_expenses: budget.monthlyExpenses,
      debt_allocation_amount: budget.debtAllocationAmount,
      debt_allocation_percent: budget.debtAllocationPercent ?? null,
      expense_entries: budget.expenseEntries ?? [],
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
  }, [user]);

  const updateBudget = useCallback(async (updates: Partial<BudgetSettings>) => {
    update((prev) => {
      const next = { ...prev.budget, ...updates };
      saveBudget(next);
      return { ...prev, budget: next };
    });
  }, [update, saveBudget]);

  const addIncomeSource = useCallback(async (sourceData: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newSource: IncomeSource = { ...sourceData, id: uuidv4(), createdAt: now, updatedAt: now };
    update((prev) => {
      const next = { ...prev.budget, incomeSources: [...prev.budget.incomeSources, newSource] };
      saveBudget(next);
      return { ...prev, budget: next };
    });
  }, [update, saveBudget]);

  const updateIncomeSource = useCallback(async (id: string, updates: Partial<IncomeSource>) => {
    update((prev) => {
      const next = {
        ...prev.budget,
        incomeSources: prev.budget.incomeSources.map((s) => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s),
      };
      saveBudget(next);
      return { ...prev, budget: next };
    });
  }, [update, saveBudget]);

  const deleteIncomeSource = useCallback(async (id: string) => {
    update((prev) => {
      const next = { ...prev.budget, incomeSources: prev.budget.incomeSources.filter((s) => s.id !== id) };
      saveBudget(next);
      return { ...prev, budget: next };
    });
  }, [update, saveBudget]);

  // ==========================================
  // ONE-TIME FUNDING OPERATIONS
  // ==========================================

  const addOneTimeFunding = useCallback(async (fundingData: Omit<OneTimeFunding, 'id' | 'isApplied'>) => {
    const newFunding: OneTimeFunding = { ...fundingData, id: uuidv4(), isApplied: false };
    update((prev) => {
      const next = { ...prev.strategy, oneTimeFundings: [...prev.strategy.oneTimeFundings, newFunding] };
      supabase.from('strategy_settings').update({ one_time_fundings: next.oneTimeFundings, updated_at: new Date().toISOString() }).eq('user_id', user?.id);
      return { ...prev, strategy: next };
    });
  }, [user, update]);

  const updateOneTimeFunding = useCallback(async (id: string, updates: Partial<OneTimeFunding>) => {
    update((prev) => {
      const next = { ...prev.strategy, oneTimeFundings: prev.strategy.oneTimeFundings.map((f) => f.id === id ? { ...f, ...updates } : f) };
      supabase.from('strategy_settings').update({ one_time_fundings: next.oneTimeFundings, updated_at: new Date().toISOString() }).eq('user_id', user?.id);
      return { ...prev, strategy: next };
    });
  }, [user, update]);

  const deleteOneTimeFunding = useCallback(async (id: string) => {
    update((prev) => {
      const next = { ...prev.strategy, oneTimeFundings: prev.strategy.oneTimeFundings.filter((f) => f.id !== id) };
      supabase.from('strategy_settings').update({ one_time_fundings: next.oneTimeFundings, updated_at: new Date().toISOString() }).eq('user_id', user?.id);
      return { ...prev, strategy: next };
    });
  }, [user, update]);

  // ==========================================
  // ASSET OPERATIONS
  // ==========================================

  const addAsset = useCallback(async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'balanceHistory'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const newAsset: Asset = {
      ...assetData,
      id: uuidv4(),
      balanceHistory: [{ id: uuidv4(), date: now, balance: assetData.balance, note: 'Initial balance' }],
      createdAt: now,
      updatedAt: now,
    };
    await supabase.from('assets').insert({
      id: newAsset.id,
      user_id: user.id,
      name: newAsset.name,
      type: newAsset.type,
      balance: newAsset.balance,
      balance_history: newAsset.balanceHistory,
      institution: newAsset.institution ?? null,
      interest_rate: newAsset.interestRate ?? null,
      created_at: newAsset.createdAt,
      updated_at: newAsset.updatedAt,
    });
    update((prev) => ({ ...prev, assets: [...prev.assets, newAsset] }));
  }, [user, update]);

  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from('assets').update({
      name: updates.name,
      type: updates.type,
      balance: updates.balance,
      institution: updates.institution ?? null,
      interest_rate: updates.interestRate ?? null,
      updated_at: now,
    }).eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, assets: prev.assets.map((a) => a.id === id ? { ...a, ...updates, updatedAt: now } : a) }));
  }, [user, update]);

  const deleteAsset = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('assets').delete().eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, assets: prev.assets.filter((a) => a.id !== id) }));
  }, [user, update]);

  const updateAssetBalance = useCallback(async (id: string, newBalance: number, note?: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    update((prev) => {
      const asset = prev.assets.find((a) => a.id === id);
      if (!asset) return prev;
      const newHistory = [...asset.balanceHistory, { id: uuidv4(), date: now, balance: newBalance, note }];
      supabase.from('assets').update({ balance: newBalance, balance_history: newHistory, updated_at: now }).eq('id', id).eq('user_id', user.id);
      return { ...prev, assets: prev.assets.map((a) => a.id === id ? { ...a, balance: newBalance, balanceHistory: newHistory, updatedAt: now } : a) };
    });
  }, [user, update]);

  // ==========================================
  // SUBSCRIPTION OPERATIONS
  // ==========================================

  const addSubscription = useCallback(async (subData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const newSub: Subscription = { ...subData, id: uuidv4(), createdAt: now, updatedAt: now };
    await supabase.from('subscriptions').insert({
      id: newSub.id,
      user_id: user.id,
      name: newSub.name,
      amount: newSub.amount,
      frequency: newSub.frequency,
      next_billing_date: newSub.nextBillingDate,
      category: newSub.category,
      is_active: newSub.isActive,
      created_at: newSub.createdAt,
      updated_at: newSub.updatedAt,
    });
    update((prev) => ({ ...prev, subscriptions: [...prev.subscriptions, newSub] }));
  }, [user, update]);

  const updateSubscription = useCallback(async (id: string, updates: Partial<Subscription>) => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from('subscriptions').update({
      name: updates.name,
      amount: updates.amount,
      frequency: updates.frequency,
      next_billing_date: updates.nextBillingDate,
      category: updates.category,
      is_active: updates.isActive,
      updated_at: now,
    }).eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, subscriptions: prev.subscriptions.map((s) => s.id === id ? { ...s, ...updates, updatedAt: now } : s) }));
  }, [user, update]);

  const deleteSubscription = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('subscriptions').delete().eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, subscriptions: prev.subscriptions.filter((s) => s.id !== id) }));
  }, [user, update]);

  // ==========================================
  // PAYCHECK OPERATIONS
  // ==========================================

  const addPaycheck = useCallback(async (paycheckData: Omit<ReceivedPaycheck, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const newPaycheck: ReceivedPaycheck = { ...paycheckData, id: uuidv4(), createdAt: now, updatedAt: now };
    await supabase.from('received_paychecks').insert({
      id: newPaycheck.id,
      user_id: user.id,
      income_source_id: newPaycheck.incomeSourceId,
      pay_date: newPaycheck.payDate,
      pay_period_start: newPaycheck.payPeriodStart,
      pay_period_end: newPaycheck.payPeriodEnd,
      expected_amount: newPaycheck.expectedAmount,
      actual_amount: newPaycheck.actualAmount,
      note: newPaycheck.note ?? null,
      created_at: newPaycheck.createdAt,
      updated_at: newPaycheck.updatedAt,
    });
    update((prev) => ({ ...prev, receivedPaychecks: [...(prev.receivedPaychecks ?? []), newPaycheck] }));
  }, [user, update]);

  const updatePaycheck = useCallback(async (id: string, updates: Partial<ReceivedPaycheck>) => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from('received_paychecks').update({
      actual_amount: updates.actualAmount,
      note: updates.note ?? null,
      updated_at: now,
    }).eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, receivedPaychecks: (prev.receivedPaychecks ?? []).map((p) => p.id === id ? { ...p, ...updates, updatedAt: now } : p) }));
  }, [user, update]);

  const deletePaycheck = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('received_paychecks').delete().eq('id', id).eq('user_id', user.id);
    update((prev) => ({ ...prev, receivedPaychecks: (prev.receivedPaychecks ?? []).filter((p) => p.id !== id) }));
  }, [user, update]);

  // ==========================================
  // IMPORT / EXPORT / CLEAR
  // ==========================================

  const exportAppData = useCallback(() => { exportData(data); }, [data]);
  const exportPaymentHistory = useCallback(() => { exportPaymentsCSV(data); }, [data]);

  const importAppData = useCallback(async (file: File) => {
    const imported = await importData(file);
    setData(imported);
    saveCache(imported);
  }, []);

  const clearAllData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      supabase.from('debts').delete().eq('user_id', user.id),
      supabase.from('payments').delete().eq('user_id', user.id),
      supabase.from('custom_categories').delete().eq('user_id', user.id),
      supabase.from('assets').delete().eq('user_id', user.id),
      supabase.from('subscriptions').delete().eq('user_id', user.id),
      supabase.from('received_paychecks').delete().eq('user_id', user.id),
      supabase.from('strategy_settings').update({ strategy: 'avalanche', recurring_funding: DEFAULT_STRATEGY.recurringFunding, one_time_fundings: [] }).eq('user_id', user.id),
      supabase.from('budget_settings').update({ income_sources: [], monthly_expenses: 0, debt_allocation_amount: 0, expense_entries: [] }).eq('user_id', user.id),
    ]);
    const cleared = { ...DEFAULT_APP_DATA, strategy: { ...DEFAULT_STRATEGY }, budget: { ...DEFAULT_BUDGET } };
    setData(cleared);
    saveCache(cleared);
  }, [user]);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value: AppContextType = {
    debts: data.debts,
    payments: data.payments,
    strategy: data.strategy,
    settings: data.settings,
    customCategories: data.customCategories,
    budget: data.budget,
    assets: data.assets,
    subscriptions: data.subscriptions,
    receivedPaychecks: data.receivedPaychecks ?? [],
    isLoading,

    addDebt, updateDebt, deleteDebt,
    addPayment, updatePayment, markPaymentComplete, deletePayment,
    updateStrategy,
    updateSettings, updateTheme, updateCategoryColor,
    addCustomCategory, updateCustomCategory, deleteCustomCategory,
    updateBudget, addIncomeSource, updateIncomeSource, deleteIncomeSource,
    addOneTimeFunding, updateOneTimeFunding, deleteOneTimeFunding,
    addAsset, updateAsset, deleteAsset, updateAssetBalance,
    addSubscription, updateSubscription, deleteSubscription,
    addPaycheck, updatePaycheck, deletePaycheck,
    exportAppData, exportPaymentHistory, importAppData, clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
