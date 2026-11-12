/**
 * Ranch lab providers (dev-only).
 *
 * FixtureAppProvider fills the real AppContext with in-memory state seeded from
 * the synthetic fixtures. Nothing here talks to Supabase or the network.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { AppContext, type AppContextType } from '../../context/AppContext';
import { AuthContext, type AuthContextType } from '../../context/AuthContext';
import { SubscriptionFixtureContext } from '../../hooks/useSubscription';
import type { MilestoneEvent, CelebrationStats } from '../../types/celebrations';
import type { AppData, Asset, ThemeSettings } from '../../types';

const nowIso = () => new Date().toISOString();
const noop = async () => {};

const FIXTURE_USER = {
  id: 'lab-user',
  email: 'mia@example.com',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-04-01T00:00:00.000Z',
} as User;

const FIXTURE_AUTH: AuthContextType = {
  user: FIXTURE_USER,
  session: null,
  isLoading: false,
  authError: null,
  isPasswordRecovery: false,
  retryAuth: () => {},
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: noop,
  resetPasswordForEmail: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
};

function FixtureAppProvider({ initial, children }: { initial: AppData; children: ReactNode }) {
  const [data, setData] = useState<AppData>(initial);
  const [celebrationEvent, setCelebrationEvent] = useState<MilestoneEvent | null>(null);
  const [celebrationStats, setCelebrationStats] = useState<CelebrationStats | null>(null);
  const [landingHandoff, setLandingHandoff] = useState<{ count: number } | null>(null); // never set in the lab

  const patch = useCallback((fn: (prev: AppData) => AppData) => setData(fn), []);

  const value = useMemo<AppContextType>(() => {
    const stamp = () => ({ id: uuidv4(), createdAt: nowIso(), updatedAt: nowIso() });
    const budgetPatch = (fn: (b: AppData['budget']) => AppData['budget']) =>
      patch((p) => ({ ...p, budget: fn(p.budget) }));
    const setThemeSettings = async (theme: ThemeSettings) =>
      patch((p) => ({ ...p, settings: { ...p.settings, theme } }));

    return {
      debts: data.debts,
      payments: data.payments,
      strategy: data.strategy,
      settings: data.settings,
      customCategories: data.customCategories,
      budget: data.budget,
      assets: data.assets,
      subscriptions: data.subscriptions,
      receivedPaychecks: data.receivedPaychecks,
      isLoading: false,
      syncStatus: 'idle',

      addDebt: async (d) => patch((p) => ({ ...p, debts: [...p.debts, { ...d, ...stamp() }] })),
      updateDebt: async (id, u) =>
        patch((p) => ({ ...p, debts: p.debts.map((d) => (d.id === id ? { ...d, ...u, updatedAt: nowIso() } : d)) })),
      deleteDebt: async (id) => patch((p) => ({ ...p, debts: p.debts.filter((d) => d.id !== id) })),

      addPayment: async (pm) => patch((p) => ({ ...p, payments: [...p.payments, { ...pm, id: uuidv4() }] })),
      updatePayment: async (id, u) =>
        patch((p) => ({ ...p, payments: p.payments.map((x) => (x.id === id ? { ...x, ...u } : x)) })),
      markPaymentComplete: async (id) =>
        patch((p) => ({
          ...p,
          payments: p.payments.map((x) => (x.id === id ? { ...x, isCompleted: true, completedAt: nowIso() } : x)),
        })),
      deletePayment: async (id) => patch((p) => ({ ...p, payments: p.payments.filter((x) => x.id !== id) })),

      updateStrategy: async (u) => patch((p) => ({ ...p, strategy: { ...p.strategy, ...u } })),
      updateSettings: async (u) => patch((p) => ({ ...p, settings: { ...p.settings, ...u } })),
      updateTheme: setThemeSettings,
      updateCategoryColor: async (categoryId, color) =>
        patch((p) => ({
          ...p,
          settings: { ...p.settings, categoryColors: { ...p.settings.categoryColors, [categoryId]: color } },
        })),

      addCustomCategory: async (c) =>
        patch((p) => ({ ...p, customCategories: [...p.customCategories, { ...c, id: uuidv4(), createdAt: nowIso() }] })),
      updateCustomCategory: async (id, u) =>
        patch((p) => ({ ...p, customCategories: p.customCategories.map((c) => (c.id === id ? { ...c, ...u } : c)) })),
      deleteCustomCategory: async (id) =>
        patch((p) => ({ ...p, customCategories: p.customCategories.filter((c) => c.id !== id) })),

      updateBudget: async (u) => budgetPatch((b) => ({ ...b, ...u })),
      addIncomeSource: async (s) => budgetPatch((b) => ({ ...b, incomeSources: [...b.incomeSources, { ...s, ...stamp() }] })),
      updateIncomeSource: async (id, u) =>
        budgetPatch((b) => ({
          ...b,
          incomeSources: b.incomeSources.map((s) => (s.id === id ? { ...s, ...u, updatedAt: nowIso() } : s)),
        })),
      deleteIncomeSource: async (id) =>
        budgetPatch((b) => ({ ...b, incomeSources: b.incomeSources.filter((s) => s.id !== id) })),

      addOneTimeFunding: async (f) =>
        patch((p) => ({
          ...p,
          strategy: { ...p.strategy, oneTimeFundings: [...p.strategy.oneTimeFundings, { ...f, id: uuidv4(), isApplied: false }] },
        })),
      updateOneTimeFunding: async (id, u) =>
        patch((p) => ({
          ...p,
          strategy: {
            ...p.strategy,
            oneTimeFundings: p.strategy.oneTimeFundings.map((f) => (f.id === id ? { ...f, ...u } : f)),
          },
        })),
      deleteOneTimeFunding: async (id) =>
        patch((p) => ({
          ...p,
          strategy: { ...p.strategy, oneTimeFundings: p.strategy.oneTimeFundings.filter((f) => f.id !== id) },
        })),

      addAsset: async (a) =>
        patch((p) => {
          const s = stamp();
          const asset: Asset = {
            ...a, ...s,
            balanceHistory: [{ id: uuidv4(), date: s.createdAt, balance: a.balance, note: 'Initial balance' }],
          };
          return { ...p, assets: [...p.assets, asset] };
        }),
      updateAsset: async (id, u) =>
        patch((p) => ({ ...p, assets: p.assets.map((a) => (a.id === id ? { ...a, ...u, updatedAt: nowIso() } : a)) })),
      deleteAsset: async (id) => patch((p) => ({ ...p, assets: p.assets.filter((a) => a.id !== id) })),
      updateAssetBalance: async (id, balance, note) =>
        patch((p) => ({
          ...p,
          assets: p.assets.map((a) =>
            a.id === id
              ? {
                  ...a, balance, updatedAt: nowIso(),
                  balanceHistory: [...a.balanceHistory, { id: uuidv4(), date: nowIso(), balance, note }],
                }
              : a,
          ),
        })),

      addSubscription: async (s) =>
        patch((p) => ({ ...p, subscriptions: [...p.subscriptions, { ...s, ...stamp() }] })),
      updateSubscription: async (id, u) =>
        patch((p) => ({
          ...p,
          subscriptions: p.subscriptions.map((s) => (s.id === id ? { ...s, ...u, updatedAt: nowIso() } : s)),
        })),
      deleteSubscription: async (id) =>
        patch((p) => ({ ...p, subscriptions: p.subscriptions.filter((s) => s.id !== id) })),

      addPaycheck: async (c) =>
        patch((p) => ({ ...p, receivedPaychecks: [...p.receivedPaychecks, { ...c, ...stamp() }] })),
      updatePaycheck: async (id, u) =>
        patch((p) => ({
          ...p,
          receivedPaychecks: p.receivedPaychecks.map((c) => (c.id === id ? { ...c, ...u, updatedAt: nowIso() } : c)),
        })),
      deletePaycheck: async (id) =>
        patch((p) => ({ ...p, receivedPaychecks: p.receivedPaychecks.filter((c) => c.id !== id) })),

      // The lab never touches files or storage: export/import are inert here.
      exportAppData: () => {},
      exportPaymentHistory: () => {},
      importAppData: noop,
      clearAllData: async () =>
        patch((p) => ({ ...p, debts: [], payments: [], assets: [], subscriptions: [], receivedPaychecks: [] })),

      celebrationEvent,
      celebrationStats,
      triggerCelebration: (event, stats) => {
        setCelebrationEvent(event);
        setCelebrationStats(stats);
      },
      dismissCelebration: () => {
        setCelebrationEvent(null);
        setCelebrationStats(null);
      },
      landingHandoff,
      consumeLandingHandoff: () => setLandingHandoff(null),
    };
  }, [data, patch, celebrationEvent, celebrationStats, landingHandoff]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function FixtureProviders({
  initial,
  isPro,
  children,
}: {
  initial: AppData;
  isPro: boolean;
  children: ReactNode;
}) {
  const sub = useMemo(
    () => ({
      isPro,
      provider: isPro ? ('stripe' as const) : null,
      planType: isPro ? ('annual' as const) : null,
      status: isPro ? ('active' as const) : null,
      stripeCustomerId: null,
      currentPeriodEnd: isPro ? '2027-09-01T00:00:00.000Z' : null,
      cancelAtPeriodEnd: false,
      isLoading: false,
    }),
    [isPro],
  );
  return (
    <AuthContext.Provider value={FIXTURE_AUTH}>
      <SubscriptionFixtureContext.Provider value={sub}>
        <FixtureAppProvider initial={initial}>{children}</FixtureAppProvider>
      </SubscriptionFixtureContext.Provider>
    </AuthContext.Provider>
  );
}
