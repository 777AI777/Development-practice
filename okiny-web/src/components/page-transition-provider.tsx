"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  /** innerHTML captured from the PREVIOUS stable render. */
  const snapshotHtmlRef = useRef<string>("");
  const isTransitioningRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  // After every stable (non-transitioning) paint, save the live DOM.
  // Because useEffect runs AFTER useLayoutEffect, this ref still holds
  // the OLD page's markup when useLayoutEffect fires on a pathname change.
  // Skip /login — its HTML must never be used as a transition overlay.
  useEffect(() => {
    if (!isTransitioningRef.current && contentRef.current && pathname !== "/login") {
      snapshotHtmlRef.current = contentRef.current.innerHTML;
    }
  });

  // On pathname change — runs synchronously BEFORE the browser paints,
  // so the user never sees the new page's initial empty/loading state.
  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    const fromPath = prevPathname.current;
    prevPathname.current = pathname;

    // Navigating FROM /login is a fresh auth start — no overlay needed.
    if (fromPath === "/login") return;

    const overlay = overlayRef.current;
    if (!overlay || !snapshotHtmlRef.current) return;

    isTransitioningRef.current = true;

    // Inject the saved OLD page snapshot into the overlay
    overlay.innerHTML = snapshotHtmlRef.current;
    // Remove fixed-position elements to avoid visual duplicates
    // (the real header/sidebar stay on top via their z-index)
    overlay.querySelectorAll(".fixed").forEach((el) => el.remove());
    overlay.style.display = "block";
    overlay.style.opacity = "1";
    overlay.style.transition = "none";

    setIsLoading(true);

    // Keep the old page visible for 600ms (enough for API responses),
    // then instantly remove — no fade.
    const timerId = window.setTimeout(() => {
      overlay.style.display = "none";
      overlay.innerHTML = "";
      isTransitioningRef.current = false;
      setIsLoading(false);
    }, 600);

    return () => {
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
