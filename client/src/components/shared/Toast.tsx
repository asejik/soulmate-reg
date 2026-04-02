import { useState, useCallback, useRef, type JSX } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { icon: JSX.Element; bar: string; bg: string; border: string; text: string }> = {
  success: {
    icon: <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />,
    bar: 'bg-emerald-500',
    bg: 'bg-[#0d1f18]',
    border: 'border-emerald-500/30',
    text: 'text-emerald-100',
  },
  error: {
    icon: <XCircle size={18} className="text-red-400 flex-shrink-0" />,
    bar: 'bg-red-500',
    bg: 'bg-[#1f0d0d]',
    border: 'border-red-500/30',
    text: 'text-red-100',
  },
  info: {
    icon: <Info size={18} className="text-blue-400 flex-shrink-0" />,
    bar: 'bg-blue-500',
    bg: 'bg-[#0d1220]',
    border: 'border-blue-500/30',
    text: 'text-blue-100',
  },
};

const AUTO_DISMISS_MS: Record<ToastVariant, number> = {
  success: 3500,
  error: 5000,
  info: 4000,
};

// ─── Single Toast Card ─────────────────────────────────────────────────────────

const ToastCard = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) => {
  const styles = VARIANT_STYLES[toast.variant];

  return (
    <motion.div
      layout
      key={toast.id}
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`relative flex items-start gap-3 w-[320px] max-w-[90vw] px-4 py-3.5 rounded-xl border shadow-2xl overflow-hidden ${styles.bg} ${styles.border}`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 inset-y-0 w-1 rounded-l-xl ${styles.bar}`} />

      {/* Icon */}
      <div className="mt-0.5 ml-1">{styles.icon}</div>

      {/* Message */}
      <p className={`flex-1 text-sm font-medium leading-snug ${styles.text}`}>
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 mt-0.5"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

// ─── Container ─────────────────────────────────────────────────────────────────

export const ToastContainer = ({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) => {
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS[variant]);
  }, [dismiss]);

  const toast = {
    success: (msg: string) => show(msg, 'success'),
    error: (msg: string) => show(msg, 'error'),
    info: (msg: string) => show(msg, 'info'),
  };

  return { toasts, dismiss, toast };
};
