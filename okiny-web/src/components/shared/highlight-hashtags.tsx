// ---------------------------------------------------------------------------
// highlight-hashtags.tsx — ハッシュタグ強調表示ユーティリティ
// コメントテキスト内のハッシュタグをカラー表示するヘルパー関数群。
// ---------------------------------------------------------------------------

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Helper: append tag as inline hashtag to comment text
// ---------------------------------------------------------------------------

export function appendTagToComment(
  comment: string | undefined,
  tag: string | undefined,
): string {
  const hashtag = tag ? `#${tag}` : "";
  if (!comment && !hashtag) return "";
  if (!comment) return hashtag;
  if (!hashtag) return comment;
  // If the comment already contains the hashtag, don't duplicate
  if (comment.includes(hashtag)) return comment;
  return `${comment}\n${hashtag}`;
}

// ---------------------------------------------------------------------------
// Helper: render comment text with hashtag highlights
// ---------------------------------------------------------------------------

/** Render inline hashtags within a single text segment */
export function highlightHashtags(text: string): ReactNode[] {
  const parts = text.split(/(#[^\s#]+)/g);
  return parts.map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} style={{ color: "var(--primary)" }}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Split text into body lines and trailing hashtag-only lines.
 * A "hashtag-only line" is a line whose trimmed content is only hashtags
 * (e.g. "#映画 #音楽 #カフェ"). Trailing hashtag lines are rendered as a
 * separate block with top margin for visual separation.
 * Font size is inherited from the parent element.
 *
 * @param tagSpacing - marginTop (px) for the trailing hashtag block. Default: 4.
 */
export function renderCommentWithHashtags(text: string, tagSpacing: number = 4): ReactNode {
  const lines = text.split("\n");

  // Find where trailing hashtag-only lines begin
  let splitIdx = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      // empty line between body and tags — continue scanning
      continue;
    }
    if (/^(#[^\s#]+\s*)+$/.test(trimmed)) {
      splitIdx = i;
    } else {
      break;
    }
  }

  const bodyLines = lines.slice(0, splitIdx);
  const tagLines = lines.slice(splitIdx).filter((l) => l.trim() !== "");

  // If no separation found, render everything inline
  if (tagLines.length === 0) {
    return <>{highlightHashtags(text)}</>;
  }

  const bodyText = bodyLines.join("\n").replace(/\n+$/, "");

  return (
    <>
      {bodyText && <span style={{ whiteSpace: "pre-wrap" }}>{highlightHashtags(bodyText)}</span>}
      <span
        style={{
          display: "block",
          marginTop: `${tagSpacing}px`,
          whiteSpace: "pre-wrap",
        }}
      >
        {highlightHashtags(tagLines.join("\n"))}
      </span>
    </>
  );
}
