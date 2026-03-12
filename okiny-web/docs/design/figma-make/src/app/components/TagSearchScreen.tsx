import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { AppHeader } from "./AppHeader";

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

interface TagSearchScreenProps {
  onNavigate: (screen: Screen) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSearch?: (query: string) => void;
  onSidebarToggle?: () => void;
}

const POPULAR_TAGS = [
  "映画",
  "カフェ",
  "音楽",
  "旅行",
  "グルメ",
  "アニメ",
  "ゲーム",
  "スポーツ",
] as const;

interface SearchResult {
  id: string;
  title: string;
  tag: string;
}

const MOCK_RESULTS: SearchResult[] = [
  { id: "r1", title: "映画トップ5", tag: "映画" },
  { id: "r2", title: "邦画ベスト5", tag: "映画" },
  { id: "r3", title: "映画音楽ベスト5", tag: "映画" },
];

export function TagSearchScreen({
  onNavigate,
  searchQuery = "",
  onSearchQueryChange,
  onSearch,
  onSidebarToggle,
}: TagSearchScreenProps) {
  const handleTagClick = (tag: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(tag);
    }
    if (onSearch) {
      onSearch(tag);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader
        onNavigate={onNavigate}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearchSubmit={onSearch}
        onSidebarToggle={onSidebarToggle}
      />

      <div className="max-w-[480px] mx-auto p-4">
        <button
          onClick={() => onNavigate("rankings")}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold bg-transparent border-none cursor-pointer mb-4"
          style={{ color: "var(--foreground)" }}
        >
          ←
        </button>

        <div className="mb-8">
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--foreground)" }}
          >
            人気のタグ
          </h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-white transition"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--foreground)" }}
          >
            {searchQuery ? `「${searchQuery}」の検索結果` : "「映画」の検索結果"}
          </h2>
          <div className="space-y-3">
            {MOCK_RESULTS.map((result) => (
              <Card key={result.id} className="p-4 cursor-pointer" onClick={() => onNavigate("ranking-detail")}>
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p
                      className="font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {result.title}
                    </p>
                    <Badge variant="secondary">{result.tag}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
