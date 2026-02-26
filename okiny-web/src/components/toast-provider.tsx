"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { ToastMessage, ToastType } from "@/lib/types";

interface ToastRecord extends ToastMessage {
  id: string;
}

interface ToastContextValue {
  pushToast: (message: ToastMessage) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;
const DURATION_BY_TYPE: Record<ToastType, number> = {
  success: 3000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

function colorByType(type: ToastType): string {
  if (type === "success") return "bg-emerald-600";
  if (type === "error") return "bg-red-700";
  if (type === "warning") return "bg-orange-600";
  return "bg-blue-600";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const queueRef = useRef<ToastRecord[]>([]);
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const removeRef = useRef<(id: string) => void>(() => {});

  const removeToast = useCallback((id: string) => {
    const timer = timerRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerRef.current.delete(id);
    }

    setToasts((current) => {
      const next = current.filter((toast) => toast.id !== id);
      if (next.length < MAX_TOASTS && queueRef.current.length > 0) {
        const queued = queueRef.current.shift()!;
        if (!queued.persistent) {
          const timerId = setTimeout(
            () => removeRef.current(queued.id),
            DURATION_BY_TYPE[queued.type],
          );
          timerRef.current.set(queued.id, timerId);
        }
        return [...next, queued];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    removeRef.current = removeToast;
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

  const pushToast = useCallback((message: ToastMessage) => {
    const toast: ToastRecord = {
      ...message,
      id: crypto.randomUUID(),
    };

    setToasts((current) => {
      if (current.length < MAX_TOASTS) {
        if (!toast.persistent) {
          const timerId = setTimeout(
            () => removeRef.current(toast.id),
            DURATION_BY_TYPE[toast.type],
          );
          timerRef.current.set(toast.id, timerId);
        }
        return [...current, toast];
      }

      queueRef.current.push(toast);
      return current;
    });
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[340px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${colorByType(
              toast.type,
            )}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p>{toast.message}</p>
              <button
                type="button"
                className="rounded px-2 py-0.5 text-xs font-medium text-white/90 hover:bg-white/15"
                onClick={() => removeToast(toast.id)}
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
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return value;
}

