/**
 * ProLockedOverlay
 *
 * Soft-gate overlay: shows the feature preview beneath a dimmed blur
 * with an upgrade CTA. Click → open UpgradeModal.
 */

import { useState, type ReactNode } from 'react';
import { Crown } from 'lucide-react';
import { UpgradeModal } from './UpgradeModal';

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

        <div
          className={`${
            children ? 'absolute inset-0' : 'relative'
          } flex flex-col items-center justify-center text-center ${
            compact ? 'p-4' : 'p-6 sm:p-8'
          } bg-gradient-to-br from-amber-50/95 to-yellow-50/95 backdrop-blur-[2px] rounded-2xl border-2 border-amber-200 ${
            children ? '' : 'min-h-[180px]'
          }`}
        >
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-300/40 mb-2 sm:mb-3">
            <Crown size={compact ? 18 : 22} className="text-white" />
          </div>
          <h3 className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
            {title}
          </h3>
          <p
            className={`text-gray-600 mt-1 max-w-xs ${
              compact ? 'text-[11px]' : 'text-xs sm:text-sm'
            }`}
          >
            {description}
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className={`mt-3 px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 shadow-lg shadow-amber-300/30 transition-all ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            <Crown size={compact ? 12 : 14} className="inline mr-1.5 -mt-0.5" />
            Upgrade to Pro
          </button>
        </div>
      </div>

      {showUpgrade && <UpgradeModal onDismiss={() => setShowUpgrade(false)} />}
    </>
  );
}
