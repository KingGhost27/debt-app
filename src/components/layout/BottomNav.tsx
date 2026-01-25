/**
 * Bottom Navigation Component
 *
 * Mobile-style bottom navigation bar matching the app screenshots.
 * Shows 5 main sections: Home, Debts, Strategy, Plan, Track
 */

import { NavLink } from 'react-router-dom';
import {
  Home,
  CreditCard,
  Lightbulb,
  ClipboardList,
  CalendarCheck,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: <Home size={24} /> },
  { to: '/debts', label: 'Debts', icon: <CreditCard size={24} /> },
  { to: '/strategy', label: 'Strategy', icon: <Lightbulb size={24} /> },
  { to: '/plan', label: 'Plan', icon: <ClipboardList size={24} /> },
  { to: '/track', label: 'Track', icon: <CalendarCheck size={24} /> },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
