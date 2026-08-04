/**
 * LegalPageShell — shared chrome for the public legal pages (/privacy, /terms).
 *
 * These routes must stay reachable without authentication: Google Play requires a
 * publicly accessible privacy policy URL, and reviewers fetch it while signed out.
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { DebtsyCow } from '../components/ui/DebtsyCow';

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950">
      <header className="border-b border-primary-200/60 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
          >
            <DebtsyCow size={28} animated={false} />
            <span
              className="font-bold text-primary-800 dark:text-primary-200"
              style={{
                fontFamily:
                  '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif',
              }}
            >
              Cowculator
            </span>
          </button>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="/privacy"
              className="font-medium text-primary-700 dark:text-primary-300 transition-opacity hover:opacity-70"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="font-medium text-primary-700 dark:text-primary-300 transition-opacity hover:opacity-70"
            >
              Terms
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <h1
          className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50"
          style={{
            fontFamily:
              '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif',
          }}
        >
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {lastUpdated}
        </p>

        <div className="legal-prose mt-8 space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          {children}
        </div>

        <div className="mt-12 pt-6 border-t border-primary-200/60 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
          Questions about this page? Email{' '}
          <a
            href="mailto:support@cowculator.net"
            className="font-medium text-primary-700 dark:text-primary-300 underline"
          >
            support@cowculator.net
          </a>
          .
        </div>
      </main>
    </div>
  );
}

/** Section heading used by both legal pages. */
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{heading}</h2>
      {children}
    </section>
  );
}
