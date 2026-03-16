"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const SUPPRESS_TRANSITION_PATHS = new Set(["/login", "/settings/logout"]);
const SAFETY_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PageTransitionContextValue {
  signalReady: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  signalReady: () => {},
});

export function usePageTransition(): PageTransitionContextValue {
  return useContext(PageTransitionContext);
}

// ---------------------------------------------------------------------------
// View Transitions API type guard
// ---------------------------------------------------------------------------

function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof document.startViewTransition === "function"
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [isLoading, setIsLoading] = useState(false);

  const resolveTransitionRef = useRef<(() => void) | null>(null);

  const signalReady = useCallback(() => {
    resolveTransitionRef.current?.();
    resolveTransitionRef.current = null;
  }, []);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    if (SUPPRESS_TRANSITION_PATHS.has(pathname)) {
      return;
    }

    setIsLoading(true);

    let cleanupCalled = false;

    const finishTransition = () => {
      if (cleanupCalled) return;
      cleanupCalled = true;
      setIsLoading(false);
    };

    resolveTransitionRef.current = finishTransition;

    const safetyTimerId = window.setTimeout(() => {
      resolveTransitionRef.current = null;
      finishTransition();
    }, SAFETY_TIMEOUT_MS);

    if (supportsViewTransitions()) {
      (document as unknown as { startViewTransition: (cb: () => Promise<void>) => void }).startViewTransition(() => {
        return Promise.resolve();
      });
    }

    return () => {
      cleanupCalled = true;
      window.clearTimeout(safetyTimerId);
      resolveTransitionRef.current = null;
      setIsLoading(false);
    };
  }, [pathname]);

  return (
    <PageTransitionContext.Provider value={{ signalReady }}>
      {isLoading && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: "56px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(100%, 480px)",
            height: "2px",
            zIndex: 29,
            overflow: "hidden",
            background: "var(--border)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              height: "100%",
              width: "60%",
              background: "var(--primary)",
              animation: "page-load-bar 0.8s ease-in-out infinite",
            }}
          />
        </div>
      )}
      {children}
    </PageTransitionContext.Provider>
  );
}
