"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    const content = contentRef.current;
    const overlay = overlayRef.current;
    if (!content || !overlay) return;

    // Clone current visible DOM as a static snapshot
    const clone = content.cloneNode(true) as HTMLElement;

    // Remove position:fixed elements from clone to avoid duplicates
    // (the real header/sidebar stay visible)
    clone.querySelectorAll(".fixed").forEach((el) => el.remove());

    overlay.replaceChildren(clone);
    overlay.style.display = "block";
    overlay.style.opacity = "1";
    overlay.style.transition = "none";

    // After a delay (new page has time to load), fade out the snapshot
    const fadeTimer = window.setTimeout(() => {
      overlay.style.transition = "opacity 200ms ease-out";
      overlay.style.opacity = "0";

      const cleanupTimer = window.setTimeout(() => {
        overlay.style.display = "none";
        overlay.replaceChildren();
      }, 200);

      return () => window.clearTimeout(cleanupTimer);
    }, 350);

    return () => window.clearTimeout(fadeTimer);
  }, [pathname]);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Snapshot overlay — shows old page content during transition */}
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
