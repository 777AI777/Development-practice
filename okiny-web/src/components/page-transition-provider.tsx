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
const INTERACTIVE_CLICK_SELECTOR = [
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "label",
  "[role='button']",
  "[role='menuitem']",
  "[contenteditable='true']",
  "[data-page-transition-ignore]",
].join(",");

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PageTransitionContextValue {
  signalReady: () => void;
  startTransitionLoading: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  signalReady: () => {},
  startTransitionLoading: () => {},
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

function isNestedInteractiveClick(
  target: HTMLElement,
  anchor: HTMLAnchorElement,
): boolean {
  const interactiveElement = target.closest(INTERACTIVE_CLICK_SELECTOR);
  if (!interactiveElement) return false;
  return interactiveElement !== anchor && anchor.contains(interactiveElement);
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
    if (supportsViewTransitions()) return; // View Transitions API対応ブラウザではスキップ
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
  // 遷移開始: frozen layer表示 + ローディングバー開始
  // --------------------------------------------------
  const startTransitionLoading = useCallback(() => {
    if (isTransitioningRef.current) return;

    isTransitioningRef.current = true;
    setIsLoading(true);

    const frozen = frozenRef.current;
    const content = contentRef.current;
    if (!frozen || !content) return;

    // frozen layer にスナップショットを表示
    if (lastSnapshotRef.current) {
      frozen.replaceChildren();
      const snapshot = lastSnapshotRef.current;
      if (snapshot instanceof HTMLElement) {
        while (snapshot.firstChild) {
          frozen.appendChild(snapshot.firstChild);
        }
      }
      lastSnapshotRef.current = null;

      frozen.style.display = "block";
      content.style.visibility = "hidden";
      content.style.position = "absolute";
      content.style.top = "0";
      content.style.left = "0";
      content.style.right = "0";
    }

    // Safety timeout
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
    }
    safetyTimerRef.current = window.setTimeout(() => {
      resolveTransitionRef.current = null;
      commitTransition();
    }, SAFETY_TIMEOUT_MS);

    resolveTransitionRef.current = () => {
      commitTransition();
    };
  }, [commitTransition]);

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
  // pathname変更検知 → 遷移開始（フォールバック）
  // リンククリック検知で既に遷移開始済みの場合はスキップ
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

    // リンククリック検知で既に遷移開始済みの場合はスキップ
    if (isTransitioningRef.current) return;

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

    // --- 遷移開始（router.push / ブラウザ戻る・進むのフォールバック） ---
    startTransitionLoading();
  }, [pathname, captureSnapshot, startTransitionLoading]);

  // --------------------------------------------------
  // リンククリック検知 → 遷移開始
  // --------------------------------------------------
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 遷移中なら無視
      if (isTransitioningRef.current) return;

      // クリックされた要素から最も近い <a> タグを探す
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const anchor = target.closest("a");
      if (!anchor) return;

      // 内部リンクかチェック
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (isNestedInteractiveClick(target, anchor)) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      // 現在と同じパスなら無視
      if (href === pathname) return;

      // SUPPRESS_TRANSITION_PATHS に該当するなら無視
      if (SUPPRESS_TRANSITION_PATHS.has(href)) return;

      // 新しいタブで開く場合は無視（target="_blank" や cmd/ctrl+click）
      if (
        anchor.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      // ローディング開始（スナップショット取得 + frozen layer 表示）
      startTransitionLoading();
    };

    document.addEventListener("click", handleClick, true); // capture phase
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startTransitionLoading]);

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
    <PageTransitionContext.Provider value={{ signalReady, startTransitionLoading }}>
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
