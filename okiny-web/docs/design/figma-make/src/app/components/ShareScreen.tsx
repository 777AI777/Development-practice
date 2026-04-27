import { Button } from "./ui/button";
import type { Screen } from "./types";

interface ShareScreenProps {
  onNavigate: (screen: Screen) => void;
}

const MOCK_RANKING = {
  title: "おすすめの映画",
  tagName: "映画",
  authorName: "Taro Yamada",
  authorDisplayUserId: "taro_movie",
  authorInitial: "T",
  items: [
    "ショーシャンクの空に",
    "ゴッドファーザー",
    "ダークナイト",
  ],
};

export function ShareScreen({ onNavigate }: ShareScreenProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Brand */}
        <h1
          className="text-4xl font-bold"
          style={{ color: "var(--foreground)" }}
        >
          OKINY
        </h1>

        {/* 著者情報 */}
        <div className="flex items-center gap-2 transition hover:opacity-80 cursor-pointer">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            {MOCK_RANKING.authorInitial}
          </div>
          <div className="min-w-0">
            <span
              className="block truncate text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {MOCK_RANKING.authorName}
            </span>
            <span
              className="block truncate text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              @{MOCK_RANKING.authorDisplayUserId}
            </span>
          </div>
        </div>

        {/* 投稿タイトル */}
        <h2
          className="text-2xl font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {MOCK_RANKING.title}
        </h2>

        {/* タグ（インラインハッシュタグ） */}
        <span
          className="text-sm"
          style={{ color: "var(--primary)" }}
        >
          #{MOCK_RANKING.tagName}
        </span>

        {/* 好きなもの */}
        <div className="w-full max-w-sm grid grid-cols-3 gap-3 mt-3">
          {MOCK_RANKING.items.map((item, index) => (
            <div
              key={`share-item-${index}`}
              className="border rounded-sm p-3 text-sm text-left"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
                backgroundColor: "var(--card)",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* CTA ボタン */}
        <Button
          size="lg"
          className="mt-4 px-8 py-3 text-lg font-medium"
          onClick={() => onNavigate("ranking-detail")}
        >
          OKINYで投稿を見る
        </Button>

        {/* フッター */}
        <p
          className="mt-8 text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          okiny.app
        </p>
      </div>
    </div>
  );
}
