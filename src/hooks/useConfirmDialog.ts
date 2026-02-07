/**
 * useConfirmDialog Hook
 *
 * Provides state management for the ConfirmDialog component.
 * Returns show/hide functions and props to spread onto ConfirmDialog.
 */

import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState(options);
  }, []);

  const handleConfirm = useCallback(() => {
    state?.onConfirm();
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    setState(null);
  }, []);

  return {
    confirm,
    dialogProps: {
      isOpen: state !== null,
      title: state?.title || '',
      message: state?.message || '',
      confirmLabel: state?.confirmLabel || 'Delete',
      cancelLabel: state?.cancelLabel || 'Cancel',
      variant: state?.variant || 'default' as const,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
