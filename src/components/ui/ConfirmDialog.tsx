/**
 * Confirm Dialog: the ranch confirmation (replaces window.confirm()).
 *
 * Built on ModalShell, so it traps focus and closes on Escape. The Cancel
 * button takes focus first, so a stray Enter never confirms a destructive
 * action. The danger variant paints the confirm button in the ranch alert color.
 */

import { AlertTriangle, Trash2 } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <ModalShell
      onClose={onCancel}
      size="sm"
      title={title}
      icon={isDanger ? <Trash2 size={18} /> : <AlertTriangle size={18} />}
      footer={
        <>
          <button type="button" data-autofocus onClick={onCancel} className="mdl-btn ghost">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`mdl-btn${isDanger ? ' danger' : ''}`}>{confirmLabel}</button>
        </>
      }
    >
      <p className="mdl-note" style={{ fontSize: 16, color: 'var(--ranch-ink)' }}>{message}</p>
    </ModalShell>
  );
}
