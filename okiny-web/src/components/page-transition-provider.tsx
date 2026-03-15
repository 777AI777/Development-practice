"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Paths where page transitions should be suppressed entirely. */
const SUPPRESS_TRANSITION_PATHS = new Set([
  "/login",
  "/settings/logout",
  "/onboarding",
]);

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
    const fromPath = prevPathname.current;
    prevPathname.current = pathname;

    // Suppress transitions when navigating to OR from auth-related pages.
    if (
      SUPPRESS_TRANSITION_PATHS.has(fromPath) ||
      SUPPRESS_TRANSITION_PATHS.has(pathname)
    ) {
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay || !snapshotHtmlRef.current) return;

    isTransitioningRef.current = true;

    // Inject the saved OLD page snapshot into the overlay.
    overlay.innerHTML = snapshotHtmlRef.current;
    // Remove fixed-position elements to avoid visual duplicates
    // (the real header/sidebar stay on top via their z-index).
    overlay.querySelectorAll(".fixed").forEach((el) => el.remove());
    overlay.style.display = "block";
    overlay.style.opacity = "1";
    overlay.style.transition = "none";

    setIsLoading(true);

    // Keep old page visible for 600ms, then instantly remove (no fade).
    let cleanupCalled = false;
    const timerId = window.setTimeout(() => {
      if (cleanupCalled) return;
      overlay.style.display = "none";
      overlay.innerHTML = "";
      isTransitioningRef.current = false;
      setIsLoading(false);
    }, 600);

    return () => {
      cleanupCalled = true;
      window.clearTimeout(timerId);
      overlay.style.display = "none";
      overlay.innerHTML = "";
      isTransitioningRef.current = false;
      setIsLoading(false);
    };
  }, [pathname]);

  return (
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
  );
}
