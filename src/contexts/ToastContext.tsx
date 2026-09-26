import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/* ── Neon config per toast type ─────────────────────────────────────── */
const TOAST_CONFIG: Record<ToastType, {
  icon: React.ReactNode;
  bar: string;
  glow: string;
  label: string;
}> = {
  success: {
    icon: <CheckCircle size={17} className="text-emerald-400 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.8))' }} />,
    bar: 'bg-emerald-500',
    glow: 'dark:shadow-[0_0_20px_rgba(0,255,136,0.2),0_8px_30px_rgba(0,0,0,0.6)]',
    label: 'dark:border-emerald-500/20',
  },
  error: {
    icon: <XCircle size={17} className="text-red-400 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 6px rgba(255,32,64,0.8))' }} />,
    bar: 'bg-red-500',
    glow: 'dark:shadow-[0_0_20px_rgba(255,32,64,0.25),0_8px_30px_rgba(0,0,0,0.6)]',
    label: 'dark:border-red-500/20',
  },
  info: {
    icon: <Info size={17} className="text-blue-400 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.8))' }} />,
    bar: 'bg-blue-500',
    glow: 'dark:shadow-[0_0_20px_rgba(0,212,255,0.2),0_8px_30px_rgba(0,0,0,0.6)]',
    label: 'dark:border-blue-500/20',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* ── Toast Container ──────────────────────────────────────── */}
      <div
        className="fixed bottom-20 lg:bottom-6 left-4 z-[100] flex flex-col gap-2.5 pointer-events-none"
        dir="rtl"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const cfg = TOAST_CONFIG[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: -60, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className={`
                  pointer-events-auto
                  flex items-center gap-3 pr-4 pl-3 py-3
                  rounded-xl max-w-[300px]
                  text-sm font-bold
                  relative overflow-hidden
                  bg-white/95 dark:bg-[#0e0e14]/90
                  dark:backdrop-blur-xl
                  border border-gray-200 dark:border-white/8
                  ${cfg.label}
                  shadow-lg ${cfg.glow}
                  text-gray-800 dark:text-gray-100
                `}
              >
                {/* Neon left accent bar */}
                <div className={`absolute right-0 top-2 bottom-2 w-0.5 rounded-full ${cfg.bar} opacity-80`}
                  style={{ boxShadow: `0 0 6px currentColor` }} />

                {cfg.icon}
                <span className="flex-1 text-right text-[13px]">{toast.message}</span>

                {/* Close button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
