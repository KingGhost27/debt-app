/**
 * Sidebar — Desktop Navigation (md+ only)
 *
 * The desktop counterpart to BottomNav. Hidden below md (where the bottom nav
 * takes over). Shows the Debtsy brand, the same nav items as the bottom nav,
 * and a Settings link — so wide screens get a real app layout instead of a
 * stretched phone column.
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Settings, Sparkles } from 'lucide-react';
import { navItems } from './navItems';
import { DebtsyCow } from '../ui/DebtsyCow';

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 shrink-0 sticky top-0 h-screen bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-primary-100/60 dark:border-gray-800 z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <DebtsyCow size={44} animated />
        <div className="leading-tight">
          <span className="block text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Debtsy
          </span>
          <span className="block text-[11px] font-medium text-primary-400 tracking-wide">
            your payoff buddy
          </span>
        </div>
      </div>

      {/* Decorative gradient divider */}
      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isMatchPath = item.matchPaths?.some((p) =>
            location.pathname.startsWith(p)
          );

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => {
                const active = isActive || !!isMatchPath;
                return `group relative flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                  active
                    ? 'text-primary-600 bg-primary-50/90 dark:bg-primary-900/20 shadow-sm'
                    : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50/50 dark:hover:bg-gray-800/50'
                }`;
              }}
            >
              {({ isActive }) => {
                const active = isActive || !!isMatchPath;
                return (
                  <>
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary-500" />
                    )}
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 2}
                      fill={active && item.fillWhenActive ? 'currentColor' : 'none'}
                      className={`transition-transform duration-200 ${
                        active ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <Sparkles
                        size={12}
                        className="ml-auto text-primary-400 animate-kawaii-pulse"
                      />
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings pinned at bottom */}
      <div className="px-4 pb-8">
        <div className="mx-2 mb-3 h-px bg-gradient-to-r from-transparent via-primary-200/70 to-transparent" />
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              isActive
                ? 'text-primary-600 bg-primary-50/90 dark:bg-primary-900/20'
                : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50/50 dark:hover:bg-gray-800/50'
            }`
          }
        >
          <Settings size={20} strokeWidth={2} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
