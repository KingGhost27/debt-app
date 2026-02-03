/**
 * Main Layout Component - Kawaii Edition
 *
 * Wraps all pages with bottom navigation and floating decorations.
 * Adds cute background patterns based on the selected theme.
 */

import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useTheme } from '../../hooks/useTheme';
import { useApp } from '../../context/AppContext';
import { getThemeDecorations } from '../../lib/themes';

export function Layout() {
  // Apply theme on mount and when theme changes
  useTheme();

  const { settings } = useApp();
  const decorations = getThemeDecorations(settings.theme);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Floating decorations */}
      <div className="decorations" aria-hidden="true">
        {decorations.floatingEmojis.map((emoji, index) => (
          <span
            key={index}
            className="decoration"
            style={{
              animationDelay: `${index * 1.5}s`,
              fontSize: index % 2 === 0 ? '1.5rem' : '1.2rem',
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Page content */}
      <main className="flex-1 pb-20 relative z-10">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
