import { Bookmark, Share } from "lucide-react";

interface ActionButtonsProps {
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onShare?: () => void;
  iconSize?: number;
}

export function ActionButtons({
  isBookmarked = false,
  onBookmarkToggle,
  onShare,
  iconSize = 22,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
        className="flex items-center justify-center p-2 bg-transparent border-none cursor-pointer transition hover:opacity-70"
        onClick={(e) => {
          e.stopPropagation();
          onBookmarkToggle?.();
        }}
      >
        <Bookmark
          size={iconSize}
          style={{ color: "var(--foreground)" }}
          fill={isBookmarked ? "var(--foreground)" : "none"}
        />
      </button>
      <button
        type="button"
        aria-label="共有"
        className="flex items-center justify-center p-2 bg-transparent border-none cursor-pointer transition hover:opacity-70"
        onClick={(e) => {
          e.stopPropagation();
          onShare?.();
        }}
      >
        <Share
          size={iconSize}
          style={{ color: "var(--foreground)" }}
        />
      </button>
    </div>
  );
}
