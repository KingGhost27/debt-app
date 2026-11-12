/**
 * DeleteAccountSection — self-serve account deletion.
 *
 * The privacy policy promises users can delete their account and everything in it.
 * This is that promise, implemented rather than handled by email.
 *
 * Deliberately gated behind type-to-confirm: this is irreversible, it destroys real
 * financial history, and a mis-tap on mobile must not be able to trigger it.
 * Ranch edition: restyle only; the request, the confirm word and the sign-out are unchanged.
 */

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import '../../pages/settings.css';

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
    <section className="rui-card set-danger" aria-labelledby="delete-account-h">
      <div className="set-danger-h">
        <span className="set-ic red"><AlertTriangle size={20} /></span>
        <h2 id="delete-account-h" className="set-danger-t">Delete account</h2>
      </div>

      <p className="set-hint" style={{ fontSize: 15 }}>
        Permanently deletes your account and everything in it — debts, payments, income,
        assets, and subscriptions. If you have an active Pro subscription, it is cancelled
        first. This cannot be undone.
      </p>

      {!expanded ? (
        <div className="set-btns">
          <button type="button" onClick={() => setExpanded(true)} className="set-btn ghost sm" style={{ color: 'var(--ranch-focus)', boxShadow: 'inset 0 0 0 2px var(--ranch-focus)' }}>
            <Trash2 size={16} />
            Delete my account
          </button>
        </div>
      ) : (
        <div className="set-confirm">
          <label htmlFor="delete-confirm" className="set-label">
            Type <b>{CONFIRM_WORD}</b> to confirm:
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            disabled={deleting}
            className="set-input"
            placeholder={CONFIRM_WORD}
          />
          <div className="set-btns">
            <button type="button" onClick={handleDelete} disabled={!canDelete} className="set-btn danger sm">
              <Trash2 size={16} />
              {deleting ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setTyped('');
              }}
              disabled={deleting}
              className="set-btn ghost sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
