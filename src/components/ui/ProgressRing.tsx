/**
 * Progress Ring Component - Kawaii Edition
 *
 * Delightful circular progress indicator with gradients
 * and optional sparkle decorations for milestone moments.
 */

import { Sparkles } from 'lucide-react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  showSparkle?: boolean;
  className?: string;
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 8,
  color,
  backgroundColor,
  showLabel = true,
  showSparkle = false,
  className = '',
}: ProgressRingProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  // Calculate circle dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  // Generate unique gradient ID
  const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;

  // Determine colors (use theme colors if not specified)
  const bgColor = backgroundColor || 'var(--theme-primary-100, #f3e8ff)';
  const progressColor = color || 'var(--theme-primary-500, #a855f7)';
  const gradientEnd = color
    ? color
    : 'var(--theme-primary-400, #c084fc)';

  // Show sparkle when progress is at milestone (25%, 50%, 75%, 100%)
  const isMilestone = showSparkle && [25, 50, 75, 100].some(m => Math.abs(clampedPercentage - m) < 2);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="progress-ring"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={progressColor} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          className="progress-ring-bg"
        />

        {/* Progress circle with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-ring-progress"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />

        {/* End cap decoration (small circle at progress end) */}
        {clampedPercentage > 5 && (
          <circle
            cx={size / 2 + radius * Math.cos(((clampedPercentage / 100) * 360 - 90) * Math.PI / 180)}
            cy={size / 2 + radius * Math.sin(((clampedPercentage / 100) * 360 - 90) * Math.PI / 180)}
            r={strokeWidth / 2 + 1}
            fill="white"
            className="transition-all duration-700"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
            }}
          />
        )}
      </svg>

      {/* Center content */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {clampedPercentage.toFixed(0)}%
          </span>
          {isMilestone && (
            <span className="text-xs text-primary-500 animate-kawaii-pulse">
              {clampedPercentage >= 100 ? 'Done!' : 'Nice!'}
            </span>
          )}
        </div>
      )}

      {/* Sparkle decoration at milestones */}
      {isMilestone && (
        <>
          <Sparkles
            size={12}
            className="absolute -top-1 -right-1 text-primary-400 animate-kawaii-sparkle"
          />
          <Sparkles
            size={10}
            className="absolute -bottom-0.5 -left-0.5 text-accent animate-kawaii-sparkle"
            style={{ animationDelay: '0.3s' }}
          />
        </>
      )}
    </div>
  );
}
