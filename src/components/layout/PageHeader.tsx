/**
 * Page Header Component - Kawaii Edition
 *
 * Delightful header for each page with cute gradients and decorations.
 * Features soft rounded corners and playful styling.
 */

import type { ReactNode } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: boolean;
  emoji?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  gradient = true,
  emoji,
}: PageHeaderProps) {
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';
  return (
    <header
      className={`page-header px-4 pt-12 pb-8 relative overflow-hidden ${
        gradient
          ? 'bg-gradient-to-b from-primary-200 to-primary-100/50'
          : 'bg-white'
      }`}
    >
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-300/20 rounded-full blur-2xl" />
      <div className="absolute top-1/2 -left-10 w-24 h-24 bg-accent/20 rounded-full blur-xl" />

      {/* Sparkle decorations */}
      <Sparkles
        size={16}
        className="absolute top-8 right-12 text-primary-400/40 animate-kawaii-pulse"
      />
      <Sparkles
        size={12}
        className="absolute top-16 right-8 text-primary-300/30 animate-kawaii-pulse"
        style={{ animationDelay: '0.5s' }}
      />

      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
          {emoji && (
            <span className="text-3xl animate-kawaii-float" style={{ animationDuration: '3s' }}>
              {emoji}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 mt-1 text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 animate-pop-in" style={{ animationDelay: '0.2s' }}>
          {action && <div>{action}</div>}
          {!isSettingsPage && (
            <Link
              to="/settings"
              className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/60 hover:bg-white/90 transition-all text-gray-500 hover:text-primary-600 shadow-sm"
            >
              <Settings size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-4 overflow-hidden">
        <svg
          viewBox="0 0 1200 30"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,15 Q300,30 600,15 T1200,15 L1200,30 L0,30 Z"
            fill="currentColor"
            className="text-gray-50"
          />
        </svg>
      </div>
    </header>
  );
}
