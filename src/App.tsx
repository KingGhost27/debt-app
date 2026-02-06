/**
 * Main App Component
 *
 * Sets up routing and wraps the app with context providers.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { DebtsPage } from './pages/DebtsPage';
import { AssetsPage } from './pages/AssetsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { PlanPage } from './pages/PlanPage';
import { TrackPage } from './pages/TrackPage';
import { SettingsPage } from './pages/SettingsPage';
import { MorePage } from './pages/MorePage';

function App() {
  return (
    <AppProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="debts" element={<DebtsPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="strategy" element={<Navigate to="/plan" replace />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="track" element={<TrackPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="more" element={<MorePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
