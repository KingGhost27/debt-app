/**
 * Sidebar — the desktop rail (lg and up). The phone counterpart is TopBar +
 * BottomNav. Brand, the shared nav items, and Settings pinned at the foot,
 * all drawn from the ranch tokens (see ranch-ui.css, `.rui-rail`).
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { navItems } from './navItems';
import { DebtsyCow } from '../ui/DebtsyCow';

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="rui-rail" aria-label="Main">
      <div className="rui-brand">
        <DebtsyCow size={44} animated />
        <div>
          <span className="rui-wordmark">Debtsy</span>
          <span className="rui-tagline">your payoff buddy</span>
        </div>
      </div>

      <nav className="rui-rail-nav" aria-label="Pages">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isMatchPath = item.matchPaths?.some((p) => location.pathname.startsWith(p));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `rui-rail-link${isActive || isMatchPath ? ' is-active' : ''}`}
            >
              <Icon size={21} strokeWidth={2} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="rui-rail-foot">
        <NavLink to="/settings" className={({ isActive }) => `rui-rail-link${isActive ? ' is-active' : ''}`}>
          <Settings size={21} strokeWidth={2} aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
