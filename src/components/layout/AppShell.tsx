/**
 * AppShell — the ranch frame around every signed-in page.
 *
 *  - lg and up → a persistent left rail (Sidebar), page content beside it.
 *  - below lg  → a slim top bar (TopBar) and a bottom tab bar (BottomNav).
 *
 * The ground is the active theme's ranch ground token; there is no frame or
 * pattern. `.ranch-ui` scopes the shared ranch UI layer (ranch-ui.css) to
 * everything rendered in here, so every page picks up the ranch look. Pages
 * choose their own width: the dashboard scene runs edge to edge, other pages'
 * content is capped at a readable width by ranch-ui.css.
 *
 * Branching is pure CSS (no width sniffing). The shell uses `overflow-x: clip`,
 * never `hidden`: hidden would make a scroll container and break the sticky rail.
 */

import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useTheme } from '../../hooks/useTheme';
import { useApp } from '../../context/AppContext';
import { Cloud, Check } from 'lucide-react';
import { useNotificationChecker } from '../../hooks/useNotifications';
import './ranch-ui.css';

export function AppShell() {
  // Apply theme on mount and when theme changes
  useTheme();

  // Check for upcoming bills once per day
  useNotificationChecker();

  const { syncStatus } = useApp();

  return (
    <div className="ranch-ui rui-shell">
      <Sidebar />
      <div className="rui-main">
        <TopBar />
        <main className="rui-page">
          <Outlet />
        </main>
        {syncStatus !== 'idle' && (
          <div className="rui-sync" role="status">
            {syncStatus === 'syncing' ? (
              <>
                <Cloud size={14} className="animate-pulse" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <Check size={14} aria-hidden="true" />
                Saved
              </>
            )}
          </div>
        )}
        <BottomNav />
      </div>
    </div>
  );
}
