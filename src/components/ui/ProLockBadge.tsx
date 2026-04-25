/**
 * ProLockBadge
 *
 * Small crown/lock pill indicating a Pro-only affordance.
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
  const iconSize = size === 'xs' ? 9 : size === 'sm' ? 11 : 13;
  const textSize = size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'xs' ? 'px-1.5 py-0.5' : size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const Icon = variant === 'crown' ? Crown : Lock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold ${padding} ${textSize} ${className}`}
    >
      <Icon size={iconSize} strokeWidth={2.5} />
      {label}
    </span>
  );
}
