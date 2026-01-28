/**
 * Main App Component
 *
 * Sets up routing and wraps the app with context providers.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { DebtsPage } from './pages/DebtsPage';
import { StrategyPage } from './pages/StrategyPage';
import { PlanPage } from './pages/PlanPage';
import { TrackPage } from './pages/TrackPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="debts" element={<DebtsPage />} />
            <Route path="strategy" element={<StrategyPage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="track" element={<TrackPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
