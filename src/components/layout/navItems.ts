/**
 * Shared navigation items — single source of truth for BottomNav (mobile)
 * and Sidebar (desktop). Add/remove a destination here and both navs update.
 */

import {
  Home,
  CreditCard,
  ClipboardList,
  CalendarCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Home gets a filled icon when active (matches original BottomNav styling). */
  fillWhenActive?: boolean;
  matchPaths?: string[];
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: Home, fillWhenActive: true },
  { to: '/debts', label: 'Debts', icon: CreditCard },
  { to: '/plan', label: 'Plan', icon: ClipboardList },
  { to: '/track', label: 'Track', icon: CalendarCheck },
  { to: '/assets', label: 'Assets', icon: Wallet },
];
