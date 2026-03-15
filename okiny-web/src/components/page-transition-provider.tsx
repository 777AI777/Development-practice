"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Paths where page transitions should be suppressed entirely. */
const SUPPRESS_TRANSITION_PATHS = new Set([
  "/login",
  "/settings/logout",
  "/onboarding",
]);

/** Maximum time (ms) to wait for signalReady before force-hiding overlay. */
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
// Provider
// ---------------------------------------------------------------------------

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  /** innerHTML captured from the PREVIOUS stable render (debounced). */
  const snapshotHtmlRef = useRef<string>("");
  const isTransitioningRef = useRef(false);
  const snapshotTimerRef = useRef<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  /** Called by the destination page to signal that its content is ready. */
  const resolveTransitionRef = useRef<(() => void) | null>(null);

  const signalReady = useCallback(() => {
    resolveTransitionRef.current?.();
    resolveTransitionRef.current = null;
  }, []);

  // Save a debounced snapshot after every render while not transitioning.
  // 200ms debounce: waits for page to stabilize (avoids capturing loading states).
  // Skip auth-related paths — their HTML must never appear as transition overlays.
  useEffect(() => {
    if (isTransitioningRef.current) return;
    if (SUPPRESS_TRANSITION_PATHS.has(pathname)) return;

    window.clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = window.setTimeout(() => {
      if (!isTransitioningRef.current && contentRef.current) {
        snapshotHtmlRef.current = contentRef.current.innerHTML;
      }
    }, 200);

    return () => window.clearTimeout(snapshotTimerRef.current);
  });

  // On pathname change — runs synchronously BEFORE the browser paints.
  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    // Suppress transitions when navigating TO auth-related pages.
    // Navigating FROM /login is allowed — show background overlay + loading bar.
    if (SUPPRESS_TRANSITION_PATHS.has(pathname)) {
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) return;

    isTransitioningRef.current = true;
    setIsLoading(true);

    const hasSnapshot = snapshotHtmlRef.current !== "";

    if (hasSnapshot) {
      // Inject the saved OLD page snapshot into the overlay.
      overlay.setAttribute("inert", "");
      overlay.innerHTML = snapshotHtmlRef.current;
      // Remove fixed-position elements to avoid visual duplicates
      // (the real header/sidebar stay on top via their z-index).
      overlay.querySelectorAll(".fixed").forEach((el) => el.remove());

      overlay.style.display = "block";
      overlay.style.opacity = "1";
      overlay.style.transition = "none";
    }
    // If no snapshot exists (e.g. first visit), overlay stays hidden.
    // The loading bar at the top still shows progress.

    let cleanupCalled = false;

    const hideOverlay = () => {
      if (cleanupCalled) return;
      cleanupCalled = true;

      overlay.removeAttribute("inert");
      overlay.style.display = "none";
      overlay.innerHTML = "";
      isTransitioningRef.current = false;
      setIsLoading(false);
    };

    // Wire up signalReady → immediate hide.
    resolveTransitionRef.current = hideOverlay;

    // Safety valve: force-hide after SAFETY_TIMEOUT_MS if signalReady never fires.
    const safetyTimerId = window.setTimeout(() => {
      resolveTransitionRef.current = null;
      hideOverlay();
    }, SAFETY_TIMEOUT_MS);

    return () => {
      cleanupCalled = true;
      window.clearTimeout(safetyTimerId);
      resolveTransitionRef.current = null;
      overlay.removeAttribute("inert");
      overlay.style.display = "none";
      overlay.innerHTML = "";
      isTransitioningRef.current = false;
      setIsLoading(false);
    };
  }, [pathname]);

  return (
    <PageTransitionContext.Provider value={{ signalReady }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        {/* Loading bar — shown just below the fixed header during transition */}
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
        {/* Snapshot overlay — shows OLD page content during transition */}
        <div
          ref={overlayRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 25,
            display: "none",
            pointerEvents: "none",
            background: "var(--background)",
          }}
        />
        {/* Live content */}
        <div ref={contentRef}>{children}</div>
      </div>
    </PageTransitionContext.Provider>
  );
}
