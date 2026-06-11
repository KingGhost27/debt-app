/**
 * AppShell — Responsive Layout System
 *
 * Two surfaces from one codebase:
 *  - Below md  → the original portrait column + kawaii BottomNav. This is the
 *                Play Store (TWA) app; it stays pixel-identical to before.
 *  - md and up → a persistent left Sidebar, no bottom bar, content in a
 *                comfortable centered column beside the sidebar.
 *
 * Replaces the old single-column Layout. The branch is pure CSS/Tailwind
 * responsive classes — no JS user-agent or innerWidth sniffing.
 */

import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../hooks/useTheme';
import { useApp } from '../../context/AppContext';
import { getThemeDecorations } from '../../lib/themes';
import { Cloud, Check } from 'lucide-react';
import { useNotificationChecker } from '../../hooks/useNotifications';

export function AppShell() {
  // Apply theme on mount and when theme changes
  useTheme();

  // Check for upcoming bills once per day
  useNotificationChecker();

  const { settings, syncStatus } = useApp();
  const decorations = getThemeDecorations(settings.theme);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background emojis for wider screens */}
      <div
        className="hidden sm:block fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        {decorations.floatingEmojis.flatMap((emoji, emojiIdx) =>
          Array.from({ length: 4 }, (_, i) => {
            const idx = emojiIdx * 4 + i;
            const isLeft = idx % 2 === 0;
            const top = (idx * 17 + 5) % 90;
            const horizontal = 2 + ((idx * 7) % 12);
            return (
              <span
                key={`bg-${idx}`}
                className="absolute text-2xl opacity-20 dark:opacity-10 animate-kawaii-float"
                style={{
                  top: `${top}%`,
                  ...(isLeft ? { left: `${horizontal}%` } : { right: `${horizontal}%` }),
                  animationDelay: `${idx * 1.2}s`,
                  animationDuration: `${6 + (idx % 4) * 2}s`,
                  fontSize: `${1.2 + (idx % 3) * 0.5}rem`,
                }}
              >
                {emoji}
              </span>
            );
          })
        )}
      </div>

      {/* Desktop sidebar (hidden below md) */}
      <Sidebar />

      {/* Content area — flexes to fill space beside the sidebar */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        {/* App container: portrait column on mobile, comfortable column beside sidebar on desktop */}
        <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col relative shadow-xl shadow-black/5 md:shadow-none">
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

          {/* Page content — pb-20 clears the bottom nav on mobile; not needed on desktop */}
          <main className="flex-1 pb-20 md:pb-10 relative z-10">
            <Outlet />
          </main>

          {/* Sync status indicator */}
          {syncStatus !== 'idle' && (
            <div
              className={`fixed bottom-[72px] md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-md border transition-all duration-300 pointer-events-none ${
                syncStatus === 'syncing'
                  ? 'bg-white/90 text-gray-500 border-gray-200'
                  : 'bg-green-50/90 text-green-600 border-green-200'
              }`}
            >
              {syncStatus === 'syncing' ? (
                <>
                  <Cloud size={12} className="animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={12} />
                  Saved
                </>
              )}
            </div>
          )}

          {/* Bottom navigation (mobile only — hidden at md+) */}
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
