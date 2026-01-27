/**
 * Main Layout Component
 *
 * Wraps all pages with bottom navigation.
 * Adds padding at bottom to account for fixed nav.
 * Applies theme on mount via useTheme hook.
 */

import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useTheme } from '../../hooks/useTheme';

export function Layout() {
  // Apply theme on mount and when theme changes
  useTheme();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
