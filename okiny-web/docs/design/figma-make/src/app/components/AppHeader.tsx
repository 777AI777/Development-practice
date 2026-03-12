import { useState } from "react";
import { Input } from "./ui/input";

type Screen =
  | "login"
  | "rankings"
  | "ranking-detail"
  | "ranking-new"
  | "ranking-edit"
  | "delete-confirm"
  | "drafts"
  | "search"
  | "settings"
  | "logout-confirm";

interface AppHeaderProps {
  onNavigate: (screen: Screen) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  onSidebarToggle?: () => void;
}

export function AppHeader({
  onNavigate,
  searchQuery: externalQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onSidebarToggle,
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

  return (
    <header
      className="sticky top-0 z-30 h-14 border-b flex items-center px-4"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between w-full max-w-[480px] mx-auto gap-3">
        <button
          onClick={() => onNavigate("rankings")}
          className="font-bold text-lg shrink-0 cursor-pointer bg-transparent border-none"
          style={{ color: "var(--primary)" }}
        >
          OKINY
        </button>

        <div className="flex-1 min-w-0 relative">
          <Input
            placeholder="タグで検索..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            className="pr-16"
            style={{ backgroundColor: "var(--input-background)" }}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => handleChange("")}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition bg-transparent border-none cursor-pointer"
                style={{ color: "var(--muted-foreground)" }}
                aria-label="クリア"
              >
                <span className="text-xs leading-none">✕</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition bg-transparent border-none cursor-pointer"
              style={{ color: "var(--muted-foreground)" }}
              aria-label="検索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onSidebarToggle ?? (() => onNavigate("settings"))}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer border-none text-xs font-bold md:hidden"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
          aria-label="メニュー"
        >
          TY
        </button>
      </div>
    </header>
  );
}
