"use client";

import type { ToastMessage, ToastType } from "@/lib/types";
import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

interface ToastRecord extends ToastMessage {
  id: string;
}

interface ToastContextValue {
  pushToast: (toast: ToastMessage) => void;
}

const TOAST_DURATION: Record<ToastType, number> = {
  success: 3000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

const MAX_VISIBLE_TOASTS = 5;
const ToastContext = createContext<ToastContextValue | null>(null);

function toastColorClass(type: ToastType): string {
  if (type === "success") return "bg-emerald-600";
  if (type === "error") return "bg-red-700";
  if (type === "warning") return "bg-orange-600";
  return "bg-blue-600";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visibleToasts, setVisibleToasts] = useState<ToastRecord[]>([]);
  const queueRef = useRef<ToastRecord[]>([]);
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const removeToastRef = useRef<(id: string) => void>(() => {});

  const scheduleAutoClose = useCallback((toast: ToastRecord) => {
    if (toast.persistent) {
      return;
    }
    const duration = TOAST_DURATION[toast.type];
    const timer = setTimeout(() => removeToastRef.current(toast.id), duration);
    timerRef.current.set(toast.id, timer);
  }, []);

  const removeToast = useCallback((id: string) => {
    const timer = timerRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerRef.current.delete(id);
    }

    setVisibleToasts((previous) => {
      const nextVisible = previous.filter((toast) => toast.id !== id);
      if (nextVisible.length < MAX_VISIBLE_TOASTS && queueRef.current.length > 0) {
        const queuedToast = queueRef.current.shift()!;
        scheduleAutoClose(queuedToast);
        return [...nextVisible, queuedToast];
      }
      return nextVisible;
    });
  }, [scheduleAutoClose]);

  useEffect(() => {
    removeToastRef.current = removeToast;
  }, [removeToast]);

  useEffect(() => {
    const timers = timerRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const pushToast = useCallback(
    (toast: ToastMessage) => {
      const newToast: ToastRecord = { ...toast, id: crypto.randomUUID() };

      setVisibleToasts((previous) => {
        if (previous.length < MAX_VISIBLE_TOASTS) {
          scheduleAutoClose(newToast);
          return [...previous, newToast];
        }

        queueRef.current.push(newToast);
        return previous;
      });
    },
    [scheduleAutoClose],
  );

  const contextValue = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[340px] flex-col gap-2">
        {visibleToasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${toastColorClass(
              toast.type,
            )}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p>{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="cursor-pointer rounded px-2 py-0.5 text-xs font-medium text-white/90 hover:bg-white/15"
              >
                閉じる
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}
