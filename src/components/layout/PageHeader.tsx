/**
 * PageHeader — the ranch strip at the top of every non-dashboard page.
 *
 * A slim band of sky, hills, fence and the active theme's friend
 * (RanchStrip), with the page title on a plank and the page's own action on
 * the right. Settings lives in the nav, so the header no longer carries a gear.
 * `emoji` and `gradient` are accepted for call-site compatibility and ignored:
 * the strip's friend replaces the emoji.
 */

import type { ReactNode } from 'react';
import { RanchStrip } from '../ranch/RanchStrip';
import { useApp } from '../../context/AppContext';
import { sceneKeyForPreset } from '../../lib/ranchScenes';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: boolean;
  emoji?: string;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const { settings } = useApp();
  const sceneKey = sceneKeyForPreset(settings.theme?.preset);
  return (
    <RanchStrip sceneKey={sceneKey}>
      <div className="rui-strip-in">
        <div className="rui-strip-copy">
          <h1 className="rui-plank rui-plank-lg">{title}</h1>
          {subtitle && <p className="rui-strip-sub">{subtitle}</p>}
        </div>
        {action && <div className="rui-strip-act">{action}</div>}
      </div>
    </RanchStrip>
  );
}
