/**
 * Bottom Navigation Component - Kawaii Edition
 *
 * Cute mobile-style bottom navigation bar with playful animations.
 * Shows 5 main sections: Home, Debts, Plan, Track, More
 */

import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  CreditCard,
  ClipboardList,
  CalendarCheck,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Home',
    icon: <Home size={22} strokeWidth={2} />,
    activeIcon: <Home size={22} strokeWidth={2.5} fill="currentColor" />,
  },
  {
    to: '/debts',
    label: 'Debts',
    icon: <CreditCard size={22} strokeWidth={2} />,
    activeIcon: <CreditCard size={22} strokeWidth={2.5} />,
  },
  {
    to: '/plan',
    label: 'Plan',
    icon: <ClipboardList size={22} strokeWidth={2} />,
    activeIcon: <ClipboardList size={22} strokeWidth={2.5} />,
  },
  {
    to: '/track',
    label: 'Track',
    icon: <CalendarCheck size={22} strokeWidth={2} />,
    activeIcon: <CalendarCheck size={22} strokeWidth={2.5} />,
  },
  {
    to: '/more',
    label: 'More',
    icon: <MoreHorizontal size={22} strokeWidth={2} />,
    activeIcon: <MoreHorizontal size={22} strokeWidth={2.5} />,
    matchPaths: ['/assets', '/subscriptions', '/settings'],
  },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-primary-100/50 dark:border-gray-800 px-2 pb-safe z-50 sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
      {/* Decorative gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-300 to-transparent opacity-50" />

      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isMatchPath = item.matchPaths?.some(p => location.pathname.startsWith(p));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => {
                const active = isActive || !!isMatchPath;
                return `nav-item relative flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 ${
                  active
                    ? 'text-primary-600 bg-primary-50/80'
                    : 'text-gray-400 hover:text-primary-400 hover:bg-primary-50/50'
                }`;
              }}
            >
              {({ isActive }) => {
                const active = isActive || !!isMatchPath;
                return (
                  <>
                    {/* Active indicator dot */}
                    {active && (
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                        <Sparkles size={10} className="text-primary-400 animate-kawaii-pulse" />
                      </span>
                    )}

                    {/* Icon with bounce animation on active */}
                    <span className={`nav-icon transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                      {active ? (item.activeIcon || item.icon) : item.icon}
                    </span>

                    {/* Label */}
                    <span className={`text-[10px] mt-1 font-semibold tracking-wide transition-all duration-200 ${
                      active ? 'text-primary-600' : ''
                    }`}>
                      {item.label}
                    </span>

                    {/* Active bottom indicator */}
                    {active && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
