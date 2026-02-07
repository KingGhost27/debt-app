/**
 * Empty State Component - Kawaii Edition
 *
 * Delightful empty state display with cute illustrations
 * and encouraging messages to keep users motivated.
 */

import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  encouragement?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  encouragement,
}: EmptyStateProps) {
  const isEmoji = typeof icon === 'string';
  const Icon = !isEmoji ? icon : undefined;

  return (
    <div className="py-12 text-center animate-pop-in">
      {/* Icon/Emoji with decorative background */}
      {icon && (
        <div className="relative inline-block mb-6">
          {/* Decorative circles */}
          <div className="absolute -inset-4 bg-gradient-to-br from-primary-100 to-accent-light dark:from-primary-800/30 dark:to-primary-900/20 rounded-full opacity-50 blur-xl" />
          <div className="absolute -inset-2 bg-primary-50 dark:bg-primary-900/30 rounded-full" />

          {/* Main icon container */}
          <div className="relative w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-800/30 rounded-3xl flex items-center justify-center shadow-lg border border-primary-200/50 dark:border-primary-700/50">
            {isEmoji ? (
              <span className="text-5xl animate-kawaii-float" style={{ animationDuration: '3s' }}>
                {icon}
              </span>
            ) : Icon ? (
              <Icon size={48} className="text-primary-500" />
            ) : null}

            {/* Sparkle decorations */}
            <Sparkles
              size={16}
              className="absolute -top-2 -right-2 text-primary-400 animate-kawaii-pulse"
            />
            <Sparkles
              size={12}
              className="absolute -bottom-1 -left-1 text-accent animate-kawaii-pulse"
              style={{ animationDelay: '0.5s' }}
            />
          </div>
        </div>
      )}

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>

      {/* Description */}
      <p className="text-gray-500 mb-4 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {/* Encouragement message */}
      {encouragement && (
        <p className="text-sm text-primary-500 font-medium mb-6 flex items-center justify-center gap-2">
          <Sparkles size={14} className="animate-kawaii-pulse" />
          {encouragement}
          <Sparkles size={14} className="animate-kawaii-pulse" style={{ animationDelay: '0.3s' }} />
        </p>
      )}

      {/* Action button */}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-300/40 hover:shadow-xl hover:shadow-primary-400/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Sparkles size={18} />
            {action.label}
          </a>
        ) : action.onClick ? (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-300/40 hover:shadow-xl hover:shadow-primary-400/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Sparkles size={18} />
            {action.label}
          </button>
        ) : null
      )}

      {/* Bottom decoration */}
      <div className="mt-8 flex justify-center gap-2 opacity-30">
        <span className="w-2 h-2 rounded-full bg-primary-300 animate-kawaii-bounce" style={{ animationDelay: '0s' }} />
        <span className="w-2 h-2 rounded-full bg-primary-400 animate-kawaii-bounce" style={{ animationDelay: '0.1s' }} />
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-kawaii-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  );
}
