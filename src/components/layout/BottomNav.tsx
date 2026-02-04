/**
 * Bottom Navigation Component - Kawaii Edition
 *
 * Cute mobile-style bottom navigation bar with playful animations.
 * Shows 5 main sections: Home, Debts, Assets, Plan, Track
 */

import { NavLink } from 'react-router-dom';
import {
  Home,
  CreditCard,
  Wallet,
  RefreshCw,
  ClipboardList,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
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
    to: '/assets',
    label: 'Assets',
    icon: <Wallet size={22} strokeWidth={2} />,
    activeIcon: <Wallet size={22} strokeWidth={2.5} />,
  },
  {
    to: '/subscriptions',
    label: 'Subs',
    icon: <RefreshCw size={22} strokeWidth={2} />,
    activeIcon: <RefreshCw size={22} strokeWidth={2.5} />,
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
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-primary-100/50 px-2 pb-safe z-50">
      {/* Decorative gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-300 to-transparent opacity-50" />

      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item relative flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'text-primary-600 bg-primary-50/80'
                  : 'text-gray-400 hover:text-primary-400 hover:bg-primary-50/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                    <Sparkles size={10} className="text-primary-400 animate-kawaii-pulse" />
                  </span>
                )}

                {/* Icon with bounce animation on active */}
                <span className={`nav-icon transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {isActive ? (item.activeIcon || item.icon) : item.icon}
                </span>

                {/* Label */}
                <span className={`text-[10px] mt-1 font-semibold tracking-wide transition-all duration-200 ${
                  isActive ? 'text-primary-600' : ''
                }`}>
                  {item.label}
                </span>

                {/* Active bottom indicator */}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
