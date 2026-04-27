// ---------------------------------------------------------------------------
// shared/Avatar.tsx — 汎用アバターコンポーネント
// ---------------------------------------------------------------------------

interface AvatarProps {
  displayName: string;
  avatarUrl?: string | null;
  size?: number; // デフォルト 40 (h-10 w-10)
  backgroundColor?: string; // フォールバック背景色（省略時: var(--muted)）
  className?: string;
}

export function Avatar({
  displayName,
  avatarUrl,
  size = 40,
  backgroundColor = "var(--muted)",
  className = "",
}: AvatarProps) {
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`flex-shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size, border: "1px solid var(--border)" }}
      />
    );
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        color: "var(--muted-foreground)",
      }}
    >
      {initial}
    </div>
  );
}
