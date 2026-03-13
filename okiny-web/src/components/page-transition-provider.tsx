"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState<"visible" | "fading-out" | "fading-in">(
    "visible",
  );

  // Same route — update displayed content immediately
  useEffect(() => {
    if (prevPathname.current === pathname) {
      setDisplayed(children);
    }
  }, [children, pathname]);

  // Route changed — crossfade
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    // Phase 1: fade out old content
    setPhase("fading-out");

    const fadeOutTimer = setTimeout(() => {
      // Phase 2: swap to new content + fade in
      setDisplayed(children);
      setPhase("fading-in");

      const fadeInTimer = setTimeout(() => {
        setPhase("visible");
      }, 150);

      return () => clearTimeout(fadeInTimer);
    }, 120);

    return () => clearTimeout(fadeOutTimer);
  }, [pathname, children]);

  return (
    <div
      style={{
        opacity: phase === "fading-out" ? 0 : 1,
        transition: "opacity 120ms ease-in-out",
      }}
    >
      {displayed}
    </div>
  );
}
