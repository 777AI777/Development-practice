function SkeletonCard({ showBorder }: { showBorder: boolean }) {
  return (
    <div
      className="flex items-start gap-3 p-4"
      style={{
        borderBottom: showBorder ? "1px solid var(--border)" : "none",
      }}
    >
      {/* Avatar circle */}
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />

      <div className="min-w-0 flex-1 space-y-1">
        {/* Name + userId + date */}
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
        </div>

        {/* Title + tag badge */}
        <div className="flex flex-col items-start gap-0.5">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-14 animate-pulse rounded bg-muted" />
        </div>

        {/* Ranking items (3 lines) */}
        <div className="space-y-0.5">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-44 animate-pulse rounded bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        </div>

        {/* Stats row (view, impression, bookmark) */}
        <div className="mt-1.5 flex items-center gap-3">
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
    <div className="overflow-hidden rounded-xl bg-card">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} showBorder={i < count - 1} />
      ))}
    </div>
  );
}
