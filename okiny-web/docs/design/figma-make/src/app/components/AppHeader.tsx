import { useState } from "react";
import type { Screen } from "./types";

interface AppHeaderProps {
  onNavigate: (screen: Screen) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  onSidebarToggle?: () => void;
  userInitial?: string;
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function AppHeader({
  onNavigate,
  searchQuery: externalQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onSidebarToggle,
  userInitial = "TY",
}: AppHeaderProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const query = externalQuery ?? internalQuery;

  const handleChange = (value: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    } else {
      setInternalQuery(value);
    }
  };

  const handleSubmit = () => {
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else {
      onNavigate("search");
    }
  };

  const handleClear = () => {
    handleChange("");
  };

  return (
    <>
      <header className="fixed left-1/2 top-0 z-30 flex h-14 w-full max-w-[480px] -translate-x-1/2 items-center border-b border-border bg-card px-4">
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate("rankings")}
            className="shrink-0 text-lg font-bold text-primary bg-transparent border-none cursor-pointer"
          >
            OKINY
          </button>

          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              placeholder="検索"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  handleSubmit();
                }
              }}
              className="h-9 w-full rounded-md border border-border bg-input px-3 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-muted-foreground transition hover:bg-muted"
                  aria-label="クリア"
                >
                  <span className="text-xs leading-none">{"\u2715"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-muted-foreground transition hover:bg-muted"
                aria-label="検索"
              >
                <SearchIcon />
              </button>
            </div>
          </div>

          {/* 通知ボタン */}
          <button
            type="button"
            onClick={() => onNavigate("notifications")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition min-[1040px]:hidden"
            aria-label="お知らせ"
            style={{ color: "var(--muted-foreground)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onSidebarToggle ?? (() => onNavigate("settings"))}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground min-[1040px]:hidden overflow-hidden"
            aria-label="メニュー"
          >
            {userInitial}
          </button>
        </div>
      </header>
      <div className="h-14 w-full shrink-0" aria-hidden="true" />
    </>
  );
}
