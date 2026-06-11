/**
 * Layout — thin wrapper over the responsive AppShell.
 *
 * Kept as the route element App.tsx renders so routing is untouched; all the
 * real shell logic (sidebar/bottom-nav branch, theme, decorations) lives in
 * AppShell.
 */

import { AppShell } from './AppShell';

export function Layout() {
  return <AppShell />;
}
