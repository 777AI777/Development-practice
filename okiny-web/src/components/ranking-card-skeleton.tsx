function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{
        backgroundColor: "var(--card)",
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: "#FFE5E5",
      }}
    >
      {/* ヘッダー: アバター + ユーザー名 + 日時 */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* タイトル */}
      <div className="px-4 pt-3 pb-2">
        <div className="h-5 w-44 animate-pulse rounded bg-muted" />
      </div>

      {/* アイテムリスト (3行) */}
      <div className="flex flex-col gap-1.5 px-4 py-2">
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* フッター: タグバッジ + 統計 */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function RankingCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
