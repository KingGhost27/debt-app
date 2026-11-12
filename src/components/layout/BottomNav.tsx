/**
 * BottomNav — the phone tab bar (below lg; the desktop rail takes over).
 * Nav items come from the shared ./navItems source. Styling: `.rui-tabbar`
 * in ranch-ui.css, built from the ranch tokens so every theme works.
 */

import { NavLink, useLocation } from 'react-router-dom';
import { navItems } from './navItems';

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="rui-tabbar" aria-label="Pages">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isMatchPath = item.matchPaths?.some((p) => location.pathname.startsWith(p));
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `rui-tab${isActive || isMatchPath ? ' is-active' : ''}`}
          >
            <span className="rui-tab-pill">
              <Icon size={22} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="rui-tab-label">{item.shortLabel ?? item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
