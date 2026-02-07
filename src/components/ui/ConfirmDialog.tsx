/**
 * Confirm Dialog Component - Kawaii Edition
 *
 * Styled confirmation dialog replacing window.confirm() calls.
 * Supports danger variant for destructive actions.
 */

import { AlertTriangle, Trash2, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
        {/* Top accent bar */}
        <div
          className={`h-1.5 ${
            isDanger
              ? 'bg-gradient-to-r from-red-400 to-red-600'
              : 'bg-gradient-to-r from-primary-400 to-primary-600'
          }`}
        />

        <div className="p-6 text-center">
          {/* Icon */}
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
              isDanger
                ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-300/40'
                : 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-primary-300/40'
            }`}
          >
            {isDanger ? (
              <Trash2 size={28} className="text-white" />
            ) : (
              <AlertTriangle size={28} className="text-white" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-2xl transition-all flex items-center justify-center gap-1.5 ${
                isDanger
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-300/30'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-300/30'
              }`}
            >
              <Sparkles size={14} />
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
