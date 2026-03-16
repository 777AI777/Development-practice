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
// View Transitions API
// ---------------------------------------------------------------------------

interface DocumentWithViewTransition {
  startViewTransition: (cb: () => void) => { finished: Promise<void> };
}

function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof document.startViewTransition === "function"
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const prevPathnameRef = useRef(pathname);
  const [isLoading, setIsLoading] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const frozenRef = useRef<HTMLDivElement>(null);

  // 前回ページのDOMスナップショット（cloneNode済み）
  const lastSnapshotRef = useRef<Node | null>(null);
  const isTransitioningRef = useRef(false);
  const safetyTimerRef = useRef<number | null>(null);
  const resolveTransitionRef = useRef<(() => void) | null>(null);

  // --------------------------------------------------
  // スナップショット取得
  // --------------------------------------------------
  const captureSnapshot = useCallback(() => {
    if (!contentRef.current) return;
    lastSnapshotRef.current = contentRef.current.cloneNode(true);
  }, []);

  // --------------------------------------------------
  // 遷移完了: frozen非表示 → content表示
  // --------------------------------------------------
  const commitTransition = useCallback(() => {
    const frozen = frozenRef.current;
    const content = contentRef.current;
    if (!frozen || !content) return;

    const doSwitch = () => {
      frozen.style.display = "none";
      content.style.visibility = "visible";
      content.style.position = "";
      content.style.top = "";
      content.style.left = "";
      content.style.right = "";

      frozen.replaceChildren();

      isTransitioningRef.current = false;
      setIsLoading(false);

      requestAnimationFrame(() => {
        captureSnapshot();
      });
    };

    if (supportsViewTransitions() && !prefersReducedMotion()) {
      const transition = (
        document as unknown as DocumentWithViewTransition
      ).startViewTransition(() => {
        doSwitch();
      });
      transition.finished.catch(() => {});
    } else {
      doSwitch();
    }
  }, [captureSnapshot]);

  // --------------------------------------------------
  // signalReady
  // --------------------------------------------------
  const signalReady = useCallback(() => {
    if (!isTransitioningRef.current) return;

    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    resolveTransitionRef.current = null;
    commitTransition();
  }, [commitTransition]);

  // --------------------------------------------------
  // pathname変更検知 → 遷移開始
  // --------------------------------------------------
  useLayoutEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    if (SUPPRESS_TRANSITION_PATHS.has(pathname)) {
      requestAnimationFrame(() => {
        captureSnapshot();
      });
      return;
    }

    const frozen = frozenRef.current;
    const content = contentRef.current;
    if (!frozen || !content) return;

    // スナップショットがない場合（初回ナビゲーション等）
    if (!lastSnapshotRef.current) {
      setIsLoading(true);
      isTransitioningRef.current = true;

      const finishTransition = () => {
        isTransitioningRef.current = false;
        setIsLoading(false);
        requestAnimationFrame(() => {
          captureSnapshot();
        });
      };

      resolveTransitionRef.current = finishTransition;

      safetyTimerRef.current = window.setTimeout(() => {
        resolveTransitionRef.current = null;
        finishTransition();
      }, SAFETY_TIMEOUT_MS);

      return;
    }

    // --- 遷移開始 ---
    isTransitioningRef.current = true;
    setIsLoading(true);

    // frozenLayerに前回スナップショットを表示
    frozen.replaceChildren();
    const snapshot = lastSnapshotRef.current;
    if (snapshot instanceof HTMLElement) {
      while (snapshot.firstChild) {
        frozen.appendChild(snapshot.firstChild);
      }
    }
    lastSnapshotRef.current = null;

    frozen.style.display = "block";

    // contentLayerを不可視にする（DOMは存在するが見えない）
    content.style.visibility = "hidden";
    content.style.position = "absolute";
    content.style.top = "0";
    content.style.left = "0";
    content.style.right = "0";

    // Safety timeout
    safetyTimerRef.current = window.setTimeout(() => {
      resolveTransitionRef.current = null;
      commitTransition();
    }, SAFETY_TIMEOUT_MS);

    resolveTransitionRef.current = () => {
      commitTransition();
    };
  }, [pathname, captureSnapshot, commitTransition]);

  // --------------------------------------------------
  // 初回マウント: paint後にスナップショット取得
  // --------------------------------------------------
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      captureSnapshot();
    });
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Unmount cleanup
  // --------------------------------------------------
  useEffect(() => {
    return () => {
      if (safetyTimerRef.current !== null) {
        window.clearTimeout(safetyTimerRef.current);
      }
    };
  }, []);

  return (
    <PageTransitionContext.Provider value={{ signalReady }}>
      {isLoading && (
        <div aria-hidden="true" className="page-transition-loading-bar">
          <div className="page-transition-loading-bar-indicator" />
        </div>
      )}

      <div
        ref={frozenRef}
        aria-hidden="true"
        style={{ display: "none" }}
        className="page-transition-frozen-layer"
      />

      <div ref={contentRef} className="page-transition-content-layer">
        {children}
      </div>
    </PageTransitionContext.Provider>
  );
}
