/**
 * Empty State Component: ranch edition.
 *
 * A calm empty card with Debtsy standing in for the old emoji icon (callers
 * that still pass an emoji string get the cow), or the given Lucide icon in a
 * tinted chip. Title, description, optional encouragement and one action.
 */

import type { LucideIcon } from 'lucide-react';
import { DebtsyCow } from './DebtsyCow';
import './modal.css';

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
    <div className="es">
      {icon && (
        <div className="es-art" aria-hidden="true">
          {Icon ? <Icon size={40} /> : <DebtsyCow size={84} />}
        </div>
      )}
      <h2 className="es-t">{title}</h2>
      <p className="es-d">{description}</p>
      {encouragement && <p className="es-e">{encouragement}</p>}
      {action && (
        action.href ? (
          <a href={action.href} className="mdl-btn auto">{action.label}</a>
        ) : action.onClick ? (
          <button type="button" onClick={action.onClick} className="mdl-btn auto">{action.label}</button>
        ) : null
      )}
    </div>
  );
}
