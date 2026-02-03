/**
 * Empty State Component
 *
 * Consistent empty state display used across pages.
 */

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const isEmoji = typeof icon === 'string';
  const Icon = !isEmoji ? icon : undefined;

  return (
    <div className="py-12 text-center">
      {icon && (
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {isEmoji ? (
            <span className="text-4xl">{icon}</span>
          ) : Icon ? (
            <Icon size={40} className="text-primary-500" />
          ) : null}
        </div>
      )}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            {action.label}
          </a>
        ) : action.onClick ? (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            {action.label}
          </button>
        ) : null
      )}
    </div>
  );
}
