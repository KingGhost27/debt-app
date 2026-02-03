/**
 * Toast Notification Component - Kawaii Edition
 *
 * Cute toast notifications with playful animations
 * and encouraging messages.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Sparkles } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_DURATION = 4000;

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const emojis: Record<ToastType, string> = {
  success: '🎉',
  error: '😢',
  warning: '⚠️',
  info: '💡',
};

const styles: Record<ToastType, string> = {
  success: 'bg-gradient-to-r from-green-50 to-white border-green-200/50',
  error: 'bg-gradient-to-r from-red-50 to-white border-red-200/50',
  warning: 'bg-gradient-to-r from-amber-50 to-white border-amber-200/50',
  info: 'bg-gradient-to-r from-primary-50 to-white border-primary-200/50',
};

const iconBgStyles: Record<ToastType, string> = {
  success: 'bg-gradient-to-br from-green-400 to-green-500',
  error: 'bg-gradient-to-br from-red-400 to-red-500',
  warning: 'bg-gradient-to-br from-amber-400 to-amber-500',
  info: 'bg-gradient-to-br from-primary-400 to-primary-500',
};

const textStyles: Record<ToastType, string> = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-amber-800',
  info: 'text-gray-800',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = icons[toast.type];
  const emoji = emojis[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm ${styles[toast.type]} animate-slide-up`}
    >
      {/* Icon with gradient background */}
      <div className={`w-9 h-9 rounded-xl ${iconBgStyles[toast.type]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon size={18} className="text-white" />
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-semibold ${textStyles[toast.type]}`}>
          {toast.message}
        </span>
      </div>

      {/* Emoji decoration */}
      <span className="text-lg flex-shrink-0">{emoji}</span>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        <X size={14} className="text-gray-400" />
      </button>

      {/* Success sparkle */}
      {toast.type === 'success' && (
        <Sparkles
          size={12}
          className="absolute -top-1 -right-1 text-green-400 animate-kawaii-pulse"
        />
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto relative">
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
