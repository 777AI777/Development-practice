"use client";

import type { SearchTab } from "@/lib/types";

interface SearchTabsProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
}

const TABS: { key: SearchTab; label: string }[] = [
  { key: "posts", label: "投稿" },
  { key: "rankings", label: "ランキング" },
  { key: "accounts", label: "アカウント" },
  { key: "tags", label: "タグ" },
];

export function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <div className="sticky top-14 z-20 bg-background">
      <div className="flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`relative flex-1 py-3 text-center text-sm font-medium transition ${
              activeTab === tab.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
