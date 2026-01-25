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
} from '../types';
import { DEFAULT_APP_DATA, DEFAULT_STRATEGY } from '../types';
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
  isLoading: boolean;

  // Debt operations
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  // Payment operations
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  markPaymentComplete: (id: string) => void;
  deletePayment: (id: string) => void;

  // Strategy operations
  updateStrategy: (updates: Partial<StrategySettings>) => void;

  // Settings operations
  updateSettings: (updates: Partial<UserSettings>) => void;

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
    isLoading,

    addDebt,
    updateDebt,
    deleteDebt,

    addPayment,
    markPaymentComplete,
    deletePayment,

    updateStrategy,
    updateSettings,

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
