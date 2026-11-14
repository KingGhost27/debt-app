/**
 * Ranch lab (dev-only): renders the real app shell and pages against fixture
 * data, with no sign-in and no Supabase. Mounted by App.tsx only when
 * import.meta.env.DEV and the path is /lab/ranch.
 *
 *   ?page=dashboard|debts|plan|track|subscriptions|assets|settings|onboarding
 *   ?theme=<ThemePreset id>   ?empty=1   ?dark=1   ?pro=0 (free tier)
 *
 * Navigation runs in a MemoryRouter so the real nav links stay inside the lab;
 * LabUrlSync mirrors the current page back into ?page=.
 */

import { useEffect, useMemo } from 'react';
import { MemoryRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ToastProvider } from '../../components/ui/Toast';
import { Layout } from '../../components/layout/Layout';
import { HomePage } from '../../pages/HomePage';
import { DebtsPage } from '../../pages/DebtsPage';
import { AssetsPage } from '../../pages/AssetsPage';
import { SubscriptionsPage } from '../../pages/SubscriptionsPage';
import { PlanPage } from '../../pages/PlanPage';
import { TrackPage } from '../../pages/TrackPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { OnboardingPage } from '../../pages/OnboardingPage';
import { THEME_PRESETS } from '../../lib/themes';
import type { ThemePreset } from '../../types';
import { buildFixtureData } from './fixtures';
import { FixtureProviders } from './FixtureProviders';

const PAGES = ['dashboard', 'debts', 'plan', 'track', 'subscriptions', 'assets', 'settings', 'onboarding'] as const;

function LabUrlSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = pathname.replace(/^\//, '');
    if (!(PAGES as readonly string[]).includes(page)) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('page') === page) return;
    url.searchParams.set('page', page);
    window.history.replaceState(null, '', url);
  }, [pathname]);
  return null;
}

function Onboarding() {
  const navigate = useNavigate();
  return <OnboardingPage onComplete={() => navigate('/dashboard')} onSkip={() => navigate('/dashboard')} />;
}

export default function RanchLab() {
  const { page, initial, isPro } = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    const requested = q.get('page') ?? 'dashboard';
    const themeId = q.get('theme') ?? 'default';
    const preset = (themeId in THEME_PRESETS ? themeId : 'default') as ThemePreset;
    return {
      page: (PAGES as readonly string[]).includes(requested) ? requested : 'dashboard',
      isPro: q.get('pro') !== '0',
      initial: buildFixtureData({
        empty: q.get('empty') === '1',
        paid: q.get('paid') != null && Number.isFinite(Number(q.get('paid'))) ? Number(q.get('paid')) : undefined,
        theme: { preset, darkMode: q.get('dark') === '1' },
      }),
    };
  }, []);

  return (
    <MemoryRouter initialEntries={[`/${page}`]}>
      <FixtureProviders initial={initial} isPro={isPro}>
        <ToastProvider>
          <LabUrlSync />
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<HomePage />} />
              <Route path="debts" element={<DebtsPage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="plan" element={<PlanPage />} />
              <Route path="track" element={<TrackPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </FixtureProviders>
    </MemoryRouter>
  );
}
