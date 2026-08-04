/**
 * DeleteAccountSection — self-serve account deletion.
 *
 * The privacy policy promises users can delete their account and everything in it.
 * This is that promise, implemented rather than handled by email.
 *
 * Deliberately gated behind type-to-confirm: this is irreversible, it destroys real
 * financial history, and a mis-tap on mobile must not be able to trigger it.
 */

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';

const CONFIRM_WORD = 'DELETE';

export function DeleteAccountSection() {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = typed.trim().toUpperCase() === CONFIRM_WORD && !deleting;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        showToast('Please sign in again to delete your account', 'error');
        setDeleting(false);
        return;
      }

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // The server sends a specific, actionable message when it refuses (for example
        // when a subscription could not be cancelled). Prefer it over a generic string.
        showToast(data.error || 'Failed to delete account. Please try again.', 'error');
        setDeleting(false);
        return;
      }

      // The account is gone; the current session is now meaningless. Sign out locally
      // so the app cannot sit in a half-authenticated state.
      await signOut();
      window.location.href = '/';
    } catch {
      showToast('Failed to delete account. Please try again.', 'error');
      setDeleting(false);
    }
  };

  return (
    <div className="card !p-3 sm:!p-4 border border-red-200 dark:border-red-900/40">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={15} className="text-red-500" />
        </div>
        <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
          Delete account
        </h2>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        Permanently deletes your account and everything in it — debts, payments, income,
        assets, and subscriptions. If you have an active Pro subscription, it is cancelled
        first. This cannot be undone.
      </p>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={15} />
          Delete my account
        </button>
      ) : (
        <div className="mt-3 space-y-2.5">
          <label
            htmlFor="delete-confirm"
            className="block text-xs text-gray-600 dark:text-gray-300"
          >
            Type <span className="font-bold text-red-500">{CONFIRM_WORD}</span> to confirm:
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            disabled={deleting}
            className="w-full sm:max-w-xs px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
            placeholder={CONFIRM_WORD}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={!canDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 size={15} />
              {deleting ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              onClick={() => {
                setExpanded(false);
                setTyped('');
              }}
              disabled={deleting}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
