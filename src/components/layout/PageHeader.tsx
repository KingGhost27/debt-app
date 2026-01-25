/**
 * Page Header Component
 *
 * Consistent header for each page with title and optional actions.
 * Matches the teal gradient style from the screenshots.
 */

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  action,
  gradient = true,
}: PageHeaderProps) {
  return (
    <header
      className={`px-4 pt-12 pb-6 ${
        gradient
          ? 'bg-gradient-to-b from-primary-200 to-primary-100/50'
          : 'bg-white'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
