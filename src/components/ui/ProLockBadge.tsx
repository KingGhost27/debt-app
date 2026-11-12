/**
 * ProLockBadge
 *
 * Small ranch badge (soon-tinted pill) marking a Pro-only affordance.
 * Use inline next to feature labels or overlayed on buttons.
 */

import { Crown, Lock } from 'lucide-react';

interface ProLockBadgeProps {
  variant?: 'crown' | 'lock';
  size?: 'xs' | 'sm' | 'md';
  label?: string;
  className?: string;
}

export function ProLockBadge({
  variant = 'crown',
  size = 'sm',
  label = 'Pro',
  className = '',
}: ProLockBadgeProps) {
  const iconSize = size === 'xs' ? 11 : size === 'sm' ? 12 : 14;
  const Icon = variant === 'crown' ? Crown : Lock;

  return (
    <span className={`rui-badge soon ${className}`} style={size === 'md' ? { height: 27, fontSize: 13 } : undefined}>
      <Icon size={iconSize} strokeWidth={2.5} />
      {label}
    </span>
  );
}
