/**
 * App Context
 *
 * Global state management for the debt payoff app.
 * Handles debts, payments, strategy settings, and persistence.
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
} from '../types';
import { DEFAULT_APP_DATA, DEFAULT_STRATEGY, DEFAULT_BUDGET } from '../types';
import { saveData, loadData, exportData, importData } from '../lib/storage';

// ============================================
// CONTEXT TYPES
// ============================================

interface AppContextType {
  // Data
  debts: Debt[];
  payments: Payment[];
  strategy: StrategySettings;
  settings: UserSettings;
  customCategories: CustomCategory[];
  budget: BudgetSettings;
  isLoading: boolean;

  // Debt operations
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  // Payment operations
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  markPaymentComplete: (id: string) => void;
  deletePayment: (id: string) => void;

  // Strategy operations
  updateStrategy: (updates: Partial<StrategySettings>) => void;

  // Settings operations
  updateSettings: (updates: Partial<UserSettings>) => void;
  updateTheme: (theme: ThemeSettings) => void;
  updateCategoryColor: (categoryId: string, color: string) => void;

  // Custom category operations
  addCustomCategory: (category: Omit<CustomCategory, 'id' | 'createdAt'>) => void;
  updateCustomCategory: (id: string, updates: Partial<CustomCategory>) => void;
  deleteCustomCategory: (id: string) => void;

  // Budget operations
  updateBudget: (updates: Partial<BudgetSettings>) => void;
  addIncomeSource: (source: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => void;
  deleteIncomeSource: (id: string) => void;

  // One-time funding operations
  addOneTimeFunding: (funding: Omit<OneTimeFunding, 'id' | 'isApplied'>) => void;
  updateOneTimeFunding: (id: string, updates: Partial<OneTimeFunding>) => void;
  deleteOneTimeFunding: (id: string) => void;

  // Import/Export
  exportAppData: () => void;
  importAppData: (file: File) => Promise<void>;
  clearAllData: () => void;
}

// ============================================
// CONTEXT CREATION
// ============================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
    setIsLoading(false);
  }, []);

  // Save data whenever it changes (after initial load)
  useEffect(() => {
    if (!isLoading) {
      saveData(data);
    }
  }, [data, isLoading]);

  // ==========================================
  // DEBT OPERATIONS
  // ==========================================

  const addDebt = useCallback((debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newDebt: Debt = {
      ...debtData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    setData((prev) => ({
      ...prev,
      debts: [...prev.debts, newDebt],
    }));
  }, []);

  const updateDebt = useCallback((id: string, updates: Partial<Debt>) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.map((debt) =>
        debt.id === id
          ? { ...debt, ...updates, updatedAt: new Date().toISOString() }
          : debt
      ),
    }));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.filter((debt) => debt.id !== id),
      // Also remove associated payments
      payments: prev.payments.filter((p) => p.debtId !== id),
    }));
  }, []);

  // ==========================================
  // PAYMENT OPERATIONS
  // ==========================================

  const addPayment = useCallback((paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: uuidv4(),
    };

    setData((prev) => ({
      ...prev,
      payments: [...prev.payments, newPayment],
    }));
  }, []);

  const updatePayment = useCallback((id: string, updates: Partial<Payment>) => {
    setData((prev) => ({
      ...prev,
      payments: prev.payments.map((payment) =>
        payment.id === id ? { ...payment, ...updates } : payment
      ),
    }));
  }, []);

  const markPaymentComplete = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      payments: prev.payments.map((payment) =>
        payment.id === id
          ? { ...payment, isCompleted: true, completedAt: new Date().toISOString() }
          : payment
      ),
    }));
  }, []);

  const deletePayment = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }));
  }, []);

  // ==========================================
  // STRATEGY OPERATIONS
  // ==========================================

  const updateStrategy = useCallback((updates: Partial<StrategySettings>) => {
    setData((prev) => ({
      ...prev,
      strategy: { ...prev.strategy, ...updates },
    }));
  }, []);

  // ==========================================
  // SETTINGS OPERATIONS
  // ==========================================

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  // ==========================================
  // THEME OPERATIONS
  // ==========================================

  const updateTheme = useCallback((theme: ThemeSettings) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme },
    }));
  }, []);

  const updateCategoryColor = useCallback((categoryId: string, color: string) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        categoryColors: { ...prev.settings.categoryColors, [categoryId]: color },
      },
    }));
  }, []);

  // ==========================================
  // CUSTOM CATEGORY OPERATIONS
  // ==========================================

  const addCustomCategory = useCallback((categoryData: Omit<CustomCategory, 'id' | 'createdAt'>) => {
    const newCategory: CustomCategory = {
      ...categoryData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      customCategories: [...prev.customCategories, newCategory],
    }));
  }, []);

  const updateCustomCategory = useCallback((id: string, updates: Partial<CustomCategory>) => {
    setData((prev) => ({
      ...prev,
      customCategories: prev.customCategories.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      ),
    }));
  }, []);

  const deleteCustomCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      customCategories: prev.customCategories.filter((cat) => cat.id !== id),
    }));
  }, []);

  // ==========================================
  // BUDGET OPERATIONS
  // ==========================================

  const updateBudget = useCallback((updates: Partial<BudgetSettings>) => {
    setData((prev) => ({
      ...prev,
      budget: { ...prev.budget, ...updates },
    }));
  }, []);

  const addIncomeSource = useCallback((sourceData: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newSource: IncomeSource = {
      ...sourceData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    setData((prev) => ({
      ...prev,
      budget: {
        ...prev.budget,
        incomeSources: [...prev.budget.incomeSources, newSource],
      },
    }));
  }, []);

  const updateIncomeSource = useCallback((id: string, updates: Partial<IncomeSource>) => {
    setData((prev) => ({
      ...prev,
      budget: {
        ...prev.budget,
        incomeSources: prev.budget.incomeSources.map((source) =>
          source.id === id
            ? { ...source, ...updates, updatedAt: new Date().toISOString() }
            : source
        ),
      },
    }));
  }, []);

  const deleteIncomeSource = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      budget: {
        ...prev.budget,
        incomeSources: prev.budget.incomeSources.filter((source) => source.id !== id),
      },
    }));
  }, []);

  // ==========================================
  // ONE-TIME FUNDING OPERATIONS
  // ==========================================

  const addOneTimeFunding = useCallback((fundingData: Omit<OneTimeFunding, 'id' | 'isApplied'>) => {
    const newFunding: OneTimeFunding = {
      ...fundingData,
      id: uuidv4(),
      isApplied: false,
    };

    setData((prev) => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        oneTimeFundings: [...prev.strategy.oneTimeFundings, newFunding],
      },
    }));
  }, []);

  const updateOneTimeFunding = useCallback((id: string, updates: Partial<OneTimeFunding>) => {
    setData((prev) => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        oneTimeFundings: prev.strategy.oneTimeFundings.map((funding) =>
          funding.id === id ? { ...funding, ...updates } : funding
        ),
      },
    }));
  }, []);

  const deleteOneTimeFunding = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        oneTimeFundings: prev.strategy.oneTimeFundings.filter((funding) => funding.id !== id),
      },
    }));
  }, []);

  // ==========================================
  // IMPORT/EXPORT
  // ==========================================

  const exportAppData = useCallback(() => {
    exportData(data);
  }, [data]);

  const importAppData = useCallback(async (file: File) => {
    const imported = await importData(file);
    setData(imported);
  }, []);

  const clearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      setData({
        ...DEFAULT_APP_DATA,
        strategy: { ...DEFAULT_STRATEGY },
        budget: { ...DEFAULT_BUDGET },
      });
    }
  }, []);

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
    isLoading,

    addDebt,
    updateDebt,
    deleteDebt,

    addPayment,
    updatePayment,
    markPaymentComplete,
    deletePayment,

    updateStrategy,
    updateSettings,
    updateTheme,
    updateCategoryColor,

    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,

    updateBudget,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,

    addOneTimeFunding,
    updateOneTimeFunding,
    deleteOneTimeFunding,

    exportAppData,
    importAppData,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
