import type { ComponentType, ReactNode } from "react";
import { formatRelativeTime } from "../formatDate";
import {
  BORDER_COLORS,
  getAccentColor,
  getEffectiveBorderColor,
} from "./theme-colors";
import { Avatar } from "./Avatar";
import { ActionButtons } from "./ActionButtons";
export { BORDER_COLORS, getEffectiveBorderColor } from "./theme-colors";
import {
  Heart,
  Star,
  Music4,
  Book,
  Disc,
  Film,
  Tv,
  Sun,
  Moon,
  Cloud,
  Leaf,
  Smile,
  Coffee,
  Circle,
  Flame,
  Zap,
  Sparkles,
  Flower,
  Flower2,
  Cherry,
  Apple,
  IceCream,
  Cake,
  Pizza,
  Gift,
  Camera,
  Palette,
  Gamepad2,
  Headphones,
  Crown,
  Gem,
  Feather,
  Anchor,
  Compass,
  Map,
  Mountain,
  Tent,
  Bike,
  Car,
  Plane,
  Rocket,
  Umbrella,
  Snowflake,
  Droplets,
  Bird,
  Cat,
  Dog,
  Fish,
  Rabbit,
  PawPrint,
  TreePine,
  TreeDeciduous,
  Sprout,
  Sunrise,
  Sunset,
  Rainbow,
  Wine,
  Utensils,
  Cookie,
  IceCream2,
  Ticket,
  Music,
  Music2,
  Music3,
  MapPin,
  Link,
  type LucideProps,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostCardRanking {
  id: string;
  title?: string;
  tag?: string;
  items: string[];
  comment?: string;
  borderColor: string;
  markerIcon: string;
  author?: {
    displayName: string;
    avatarUrl?: string;
    displayUserId?: string;
  };
  viewCount?: number;
  bookmarkCount?: number;
  commentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstagramPostCardProps {
  ranking: PostCardRanking;
  onClick?: () => void;
  onAuthorClick?: () => void;
  isBookmarked?: boolean;
  onBookmarkClick?: () => void;
  onShareClick?: () => void;
  variant?: "list" | "detail";
  className?: string;
  borderWidthPx?: number;
  /** カード上部に挿入するバッジ（例: ピン留めラベル） */
  topBadge?: ReactNode;
  /** フッター左側に挿入するノード（例: リアクションボタン群） */
  footerLeft?: ReactNode;
}

// ---------------------------------------------------------------------------
// MARKER_ICONS
// ---------------------------------------------------------------------------

type IconType = ComponentType<LucideProps>;

export const MARKER_ICONS: { name: string; label: string }[] = [
  { name: "Heart", label: "ハート" },
  { name: "Star", label: "スター" },
  { name: "Music4", label: "ミュージック" },
  { name: "Book", label: "ブック" },
  { name: "Disc", label: "ディスク" },
  { name: "Film", label: "フィルム" },
  { name: "Tv", label: "テレビ" },
  { name: "Sun", label: "サン" },
  { name: "Moon", label: "ムーン" },
  { name: "Cloud", label: "クラウド" },
  { name: "Leaf", label: "リーフ" },
  { name: "Smile", label: "スマイル" },
  { name: "Coffee", label: "コーヒー" },
  { name: "Flame", label: "炎" },
  { name: "Zap", label: "稲妻" },
  { name: "Sparkles", label: "きらきら" },
  { name: "Flower", label: "花" },
  { name: "Flower2", label: "花びら" },
  { name: "Cherry", label: "さくらんぼ" },
  { name: "Apple", label: "りんご" },
  { name: "IceCream", label: "アイス" },
  { name: "Cake", label: "ケーキ" },
  { name: "Pizza", label: "ピザ" },
  { name: "Gift", label: "ギフト" },
  { name: "Camera", label: "カメラ" },
  { name: "Palette", label: "パレット" },
  { name: "Gamepad2", label: "ゲーム" },
  { name: "Headphones", label: "ヘッドホン" },
  { name: "Crown", label: "王冠" },
  { name: "Gem", label: "宝石" },
  { name: "Feather", label: "羽根" },
  { name: "Anchor", label: "いかり" },
  { name: "Compass", label: "コンパス" },
  { name: "Map", label: "地図" },
  { name: "Mountain", label: "山" },
  { name: "Tent", label: "テント" },
  { name: "Bike", label: "自転車" },
  { name: "Car", label: "車" },
  { name: "Plane", label: "飛行機" },
  { name: "Rocket", label: "ロケット" },
  { name: "Umbrella", label: "傘" },
  { name: "Snowflake", label: "雪" },
  { name: "Droplets", label: "しずく" },
  { name: "Bird", label: "鳥" },
  { name: "Cat", label: "猫" },
  { name: "Dog", label: "犬" },
  { name: "Fish", label: "魚" },
  { name: "Rabbit", label: "うさぎ" },
  { name: "PawPrint", label: "肉球" },
  { name: "TreePine", label: "針葉樹" },
  { name: "TreeDeciduous", label: "広葉樹" },
  { name: "Sprout", label: "芽" },
  { name: "Sunrise", label: "日の出" },
  { name: "Sunset", label: "夕焼け" },
  { name: "Rainbow", label: "虹" },
  { name: "Wine", label: "ワイン" },
  { name: "Utensils", label: "食器" },
  { name: "Cookie", label: "クッキー" },
  { name: "IceCream2", label: "ソフトクリーム" },
  { name: "Ticket", label: "チケット" },
  { name: "Music", label: "音符" },
  { name: "Music2", label: "メロディ" },
  { name: "Music3", label: "音楽" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, IconType> = {
  Heart,
  Star,
  Music4,
  Book,
  Disc,
  Film,
  Tv,
  Sun,
  Moon,
  Cloud,
  Leaf,
  Smile,
  Coffee,
  Flame,
  Zap,
  Sparkles,
  Flower,
  Flower2,
  Cherry,
  Apple,
  IceCream,
  Cake,
  Pizza,
  Gift,
  Camera,
  Palette,
  Gamepad2,
  Headphones,
  Crown,
  Gem,
  Feather,
  Anchor,
  Compass,
  Map,
  Mountain,
  Tent,
  Bike,
  Car,
  Plane,
  Rocket,
  Umbrella,
  Snowflake,
  Droplets,
  Bird,
  Cat,
  Dog,
  Fish,
  Rabbit,
  PawPrint,
  TreePine,
  TreeDeciduous,
  Sprout,
  Sunrise,
  Sunset,
  Rainbow,
  Wine,
  Utensils,
  Cookie,
  IceCream2,
  Ticket,
  Music,
  Music2,
  Music3,
};

export function getMarkerIcon(name: string): IconType {
  return ICON_MAP[name] ?? Circle;
}

// ---------------------------------------------------------------------------
// Link thumbnail: keyword-based category detection
// ---------------------------------------------------------------------------

type LinkThumbnailCategory = "music" | "film" | "place" | "book" | "game" | "general";

interface LinkCardInfo {
  imageUrl: string;
  bgColor: string;
  title: string;
  description: string;
  domain: string;
}

const MUSIC_KEYWORDS = ["音楽", "曲", "アルバム", "ソング", "バンド", "アーティスト", "spotify"];
const FILM_KEYWORDS = ["映画", "フィルム", "シネマ", "ドラマ", "アニメ", "シリーズ"];
const PLACE_KEYWORDS = ["カフェ", "コーヒー", "珈琲", "店", "レストラン", "場所", "ショップ", "旅行", "観光"];
const BOOK_KEYWORDS = ["本", "書籍", "小説", "漫画", "マンガ", "読書", "作家"];
const GAME_KEYWORDS = ["ゲーム", "game", "steam", "switch"];

const TAG_FILM_KEYWORDS = ["映画", "邦画", "洋画"];
const TAG_MUSIC_KEYWORDS = ["音楽", "曲"];
const TAG_PLACE_KEYWORDS = ["カフェ", "旅行", "場所"];
const TAG_BOOK_KEYWORDS = ["本", "小説", "漫画"];
const TAG_GAME_KEYWORDS = ["ゲーム"];

const LINK_CARD_PATTERNS: Record<LinkThumbnailCategory, Omit<LinkCardInfo, "bgColor">[]> = {
  film: [
    { imageUrl: "https://picsum.photos/seed/film1/160/160", title: "映画.com - 映画情報", description: "あらすじ、キャスト、レビューを確認", domain: "eiga.com" },
    { imageUrl: "https://picsum.photos/seed/film2/160/160", title: "Filmarks - 映画レビュー", description: "映画ファンのレビュー・感想が集まる", domain: "filmarks.com" },
    { imageUrl: "https://picsum.photos/seed/film3/160/160", title: "Yahoo!映画", description: "映画の上映スケジュール、レビュー", domain: "movies.yahoo.co.jp" },
  ],
  music: [
    { imageUrl: "https://picsum.photos/seed/music1/160/160", title: "Spotify", description: "音楽を聴こう。プレイリストを検索。", domain: "open.spotify.com" },
    { imageUrl: "https://picsum.photos/seed/music2/160/160", title: "Apple Music", description: "何百万もの曲を広告なしでストリーミング", domain: "music.apple.com" },
    { imageUrl: "https://picsum.photos/seed/music3/160/160", title: "YouTube Music", description: "公式の曲、アルバム、プレイリスト", domain: "music.youtube.com" },
  ],
  place: [
    { imageUrl: "https://picsum.photos/seed/place1/160/160", title: "食べログ", description: "お店の口コミ・ランキング", domain: "tabelog.com" },
    { imageUrl: "https://picsum.photos/seed/place2/160/160", title: "Google Maps", description: "地図で場所を検索。ルート案内も。", domain: "maps.google.com" },
    { imageUrl: "https://picsum.photos/seed/place3/160/160", title: "Retty", description: "実名の口コミでお店を探そう", domain: "retty.me" },
  ],
  book: [
    { imageUrl: "https://picsum.photos/seed/book1/160/160", title: "Amazon.co.jp", description: "本の詳細情報、レビュー", domain: "amazon.co.jp" },
    { imageUrl: "https://picsum.photos/seed/book2/160/160", title: "読書メーター", description: "読んだ本を記録・管理", domain: "bookmeter.com" },
    { imageUrl: "https://picsum.photos/seed/book3/160/160", title: "ブクログ", description: "本の感想・レビューコミュニティ", domain: "booklog.jp" },
  ],
  game: [
    { imageUrl: "https://picsum.photos/seed/game1/160/160", title: "Steam", description: "ゲームの詳細、レビュー", domain: "store.steampowered.com" },
    { imageUrl: "https://picsum.photos/seed/game2/160/160", title: "Nintendo", description: "任天堂の公式ゲーム情報", domain: "nintendo.co.jp" },
    { imageUrl: "https://picsum.photos/seed/game3/160/160", title: "PlayStation", description: "PS5, PS4のゲームを探す", domain: "playstation.com" },
  ],
  general: [
    { imageUrl: "https://picsum.photos/seed/link1/160/160", title: "外部リンク", description: "外部コンテンツ", domain: "example.com" },
    { imageUrl: "https://picsum.photos/seed/link2/160/160", title: "外部リンク", description: "外部コンテンツ", domain: "example.org" },
    { imageUrl: "https://picsum.photos/seed/link3/160/160", title: "外部リンク", description: "外部コンテンツ", domain: "example.net" },
  ],
};

const LINK_CARD_BG_COLORS: Record<LinkThumbnailCategory, string> = {
  film: "#0d253f",
  music: "#1DB954",
  place: "#4285F4",
  book: "#FF9900",
  game: "#1b2838",
  general: "#6b7280",
};

function getLinkCardInfo(itemText: string, index: number, tagName?: string): LinkCardInfo {
  const lower = itemText.toLowerCase();
  const tag = (tagName ?? "").toLowerCase();
  let category: LinkThumbnailCategory = "general";

  // タグ名で優先判定
  if (TAG_FILM_KEYWORDS.some((k) => tag.includes(k))) category = "film";
  else if (TAG_MUSIC_KEYWORDS.some((k) => tag.includes(k))) category = "music";
  else if (TAG_PLACE_KEYWORDS.some((k) => tag.includes(k))) category = "place";
  else if (TAG_BOOK_KEYWORDS.some((k) => tag.includes(k))) category = "book";
  else if (TAG_GAME_KEYWORDS.some((k) => tag.includes(k))) category = "game";
  // フォールバック: アイテムテキストで判定
  else if (MUSIC_KEYWORDS.some((k) => lower.includes(k))) category = "music";
  else if (FILM_KEYWORDS.some((k) => lower.includes(k))) category = "film";
  else if (PLACE_KEYWORDS.some((k) => lower.includes(k))) category = "place";
  else if (BOOK_KEYWORDS.some((k) => lower.includes(k))) category = "book";
  else if (GAME_KEYWORDS.some((k) => lower.includes(k))) category = "game";

  const pattern = LINK_CARD_PATTERNS[category][index % 3];
  return {
    ...pattern,
    bgColor: LINK_CARD_BG_COLORS[category],
  };
}

// ---------------------------------------------------------------------------
// LinkPreviewCard
// ---------------------------------------------------------------------------

function LinkPreviewCard({ info, compact = false }: { info: LinkCardInfo; compact?: boolean }) {
  const imgSize = compact ? 48 : 56;
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "10px",
        overflow: "hidden",
        backgroundColor: "var(--card)",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {/* OGP画像 */}
      <div
        style={{
          width: imgSize,
          height: imgSize,
          flexShrink: 0,
          backgroundColor: info.bgColor,
        }}
      >
        <img
          src={info.imageUrl}
          alt=""
          style={{ width: imgSize, height: imgSize, objectFit: "cover", display: "block" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      {/* テキスト情報 */}
      <div
        style={{
          padding: "6px 10px",
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {/* タイトル */}
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {info.title}
        </div>
        {/* 説明・ドメイン: compact(list)では非表示 */}
        {!compact && (
          <>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--muted-foreground)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {info.description}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Link size={10} strokeWidth={2} />
              {info.domain}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
// Splits body text and trailing hashtag lines into separate blocks.
// ---------------------------------------------------------------------------

/** Render inline hashtags within a single text segment */
export function highlightHashtags(text: string) {
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
export function renderCommentWithHashtags(text: string, tagSpacing: number = 4) {
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

// ---------------------------------------------------------------------------
// Avatar は shared/Avatar.tsx に集約
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// InstagramPostCard
// ---------------------------------------------------------------------------

export function InstagramPostCard({
  ranking,
  onClick,
  onAuthorClick,
  isBookmarked = false,
  onBookmarkClick,
  onShareClick,
  variant = "list",
  className = "",
  borderWidthPx = 2,
  topBadge,
  footerLeft,
}: InstagramPostCardProps) {
  const { borderColor, markerIcon, author, title, comment, items } = ranking;

  const MarkerIcon = getMarkerIcon(markerIcon);

  const textTitle = "var(--foreground)";    // タイトル用（最濃）
  const textContent = "var(--foreground)";  // アイテムリスト用（中間）
  const textComment = "var(--foreground)";  // コメント本文用（やや薄め）
  const textPrimary = "var(--foreground)";  // その他テキスト用（ユーザー名等）
  const textSecondary = "var(--muted-foreground)";
  const markerColor = getAccentColor(borderColor);

  const isDetail = variant === "detail";
  const isClickable = variant === "list" && !!onClick;

  const hoverClass = isClickable ? "hover:brightness-95 cursor-pointer" : "";

  const focusClass = isClickable
    ? "focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-800 focus-visible:ring-offset-2"
    : "";

  const Tag = isClickable ? "button" : "div";

  return (
    <Tag
      className={[
        "flex w-full flex-col overflow-hidden transition-[filter]",
        "rounded-2xl shadow-sm",
        hoverClass,
        focusClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: "var(--card)",
        borderWidth: `${borderWidthPx}px`,
        borderStyle: "solid",
        borderColor: getEffectiveBorderColor(borderColor),
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
      {...(isClickable
        ? {
            onClick,
            type: "button" as const,
          }
        : {})}
    >
      {/* 上部バッジ（ピン留めなど、呼び出し元が任意に挿入） */}
      {topBadge && (
        <div className={isDetail ? "px-5 pt-3" : "px-4 pt-3"}>
          {topBadge}
        </div>
      )}

      {/* アバター + ユーザー名 + 日時 */}
      {author && (
        <div
          className={`flex items-center gap-3 ${isDetail ? "px-5 py-3.5" : "px-4 py-3"}`}
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {onAuthorClick ? (
            <button
              type="button"
              className="flex items-center gap-3 min-w-0 bg-transparent border-none p-0 cursor-pointer transition hover:opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                onAuthorClick();
              }}
            >
              <Avatar displayName={author.displayName} avatarUrl={author.avatarUrl} />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className="text-sm font-semibold truncate text-left"
                    style={{ color: textPrimary }}
                  >
                    {author.displayName}
                  </span>
                  {ranking.createdAt && (
                    <span className="text-sm flex-shrink-0 text-left" style={{ color: textSecondary }}>
                      · {formatRelativeTime(ranking.createdAt)}
                    </span>
                  )}
                </div>
                {author.displayUserId && (
                  <span className="text-sm truncate text-left" style={{ color: textSecondary }}>
                    @{author.displayUserId}
                  </span>
                )}
              </div>
            </button>
          ) : (
            <>
              <Avatar displayName={author.displayName} avatarUrl={author.avatarUrl} />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: textPrimary }}
                  >
                    {author.displayName}
                  </span>
                  {ranking.createdAt && (
                    <span className="text-sm flex-shrink-0" style={{ color: textSecondary }}>
                      · {formatRelativeTime(ranking.createdAt)}
                    </span>
                  )}
                </div>
                {author.displayUserId && (
                  <span className="text-sm truncate" style={{ color: textSecondary }}>
                    @{author.displayUserId}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* タイトル */}
      {title && (
        <div className={isDetail ? "px-5 pt-4 pb-2" : "px-4 pt-3 pb-2"}>
          <h2
            className={`${isDetail ? "text-xl" : "text-lg"} font-semibold leading-snug text-left`}
            style={{ color: textTitle }}
          >
            {title}
          </h2>
        </div>
      )}

      {/* listバリアント: アイテム → コメント本文 → タグ独立ブロック */}
      {!isDetail && (
        <>
          <div className="flex flex-col gap-1.5 px-4 py-2.5">
            {items.map((item, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <MarkerIcon
                    size={20}
                    strokeWidth={2.25}
                    style={{ color: markerColor, flexShrink: 0 }}
                  />
                  <span
                    className="text-sm font-semibold leading-relaxed"
                    style={{ color: "var(--foreground)", letterSpacing: "0.05em" }}
                  >
                    {item}
                  </span>
                </div>
                {ranking.tag && (
                  <div style={{ marginTop: 4 }}>
                    <LinkPreviewCard
                      info={getLinkCardInfo(item, i, ranking.tag)}
                      compact={true}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* コメント本文（タグなし）*/}
          {comment && (
            <div className="px-4 pb-1.5">
              <div
                className="text-sm leading-relaxed text-left"
                style={{ color: textComment }}
              >
                {renderCommentWithHashtags(comment)}
              </div>
            </div>
          )}

          {/* タグ独立ブロック */}
          {ranking.tag && (
            <div className="px-4 pb-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--primary)",
                }}
              >
                #{ranking.tag}
              </span>
            </div>
          )}
        </>
      )}

      {/* detailバリアント: アイテム → コメント本文 → タグ独立ブロック */}
      {isDetail && (
        <>
          <div className="flex flex-col gap-2 px-5 py-3">
            {items.map((item, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <MarkerIcon
                    size={22}
                    strokeWidth={2.25}
                    style={{ color: markerColor, flexShrink: 0 }}
                  />
                  <span
                    className="text-base font-semibold leading-snug"
                    style={{ color: "var(--foreground)", letterSpacing: "0.05em" }}
                  >
                    {item}
                  </span>
                </div>
                {ranking.tag && (
                  <div style={{ marginTop: 4, marginBottom: 2 }}>
                    <LinkPreviewCard
                      info={getLinkCardInfo(item, i, ranking.tag)}
                      compact={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* コメント本文（タグなし）*/}
          {comment && (
            <div className="px-5 pb-2">
              <div
                className="text-base leading-relaxed text-left"
                style={{ color: textComment }}
              >
                {renderCommentWithHashtags(comment)}
              </div>
            </div>
          )}

          {/* タグ独立ブロック */}
          {ranking.tag && (
            <div className="px-5 pb-3">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--primary)",
                }}
              >
                #{ranking.tag}
              </span>
            </div>
          )}
        </>
      )}

      {/* アクションアイコン行（左: footerLeft | 右: ブックマーク + 共有） */}
      <div className={`flex items-center ${isDetail ? "px-5 pt-1 pb-4" : "px-4 pt-0.5 pb-3"}`}>
        {footerLeft && <div className="flex items-center gap-3 mr-auto">{footerLeft}</div>}
        <div className={footerLeft ? "" : "ml-auto"}>
          <ActionButtons
            isBookmarked={isBookmarked}
            onBookmarkToggle={onBookmarkClick}
            onShare={onShareClick}
            iconSize={isDetail ? 24 : 22}
          />
        </div>
      </div>
    </Tag>
  );
}
