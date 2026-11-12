/**
 * ProLockedOverlay
 *
 * Soft-gate overlay: shows the feature preview beneath a dimmed blur
 * with an upgrade CTA. Click opens UpgradeModal. The gate itself is a ranch
 * card with a gold-tinted crown chip.
 */

import { useState, type ReactNode } from 'react';
import { Crown } from 'lucide-react';
import { UpgradeModal } from './UpgradeModal';
import './modal.css';

interface ProLockedOverlayProps {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function ProLockedOverlay({
  title,
  description,
  children,
  className = '',
  compact = false,
}: ProLockedOverlayProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <div className={`relative ${className}`}>
        {children && (
          <div className="pointer-events-none select-none opacity-40 blur-sm" aria-hidden>
            {children}
          </div>
        )}

        <div className={`pro-gate${children ? ' is-over' : ''}${compact ? ' is-compact' : ''}`}>
          <span className="pro-gate-ic"><Crown size={compact ? 20 : 24} /></span>
          <h3 className="pro-gate-t">{title}</h3>
          <p className="pro-gate-d">{description}</p>
          <button type="button" onClick={() => setShowUpgrade(true)} className="mdl-btn auto">
            <Crown size={16} />
            Upgrade to Pro
          </button>
        </div>
      </div>

      {showUpgrade && <UpgradeModal onDismiss={() => setShowUpgrade(false)} />}
    </>
  );
}
