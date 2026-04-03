import { ImageResponse } from "next/og";

import { getPublicRanking } from "@/lib/supabase/public-ranking";

export const runtime = "edge";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const COLORS = {
  background: "#ffffff",
  brand: "#9ca3af",
  title: "#111827",
  gold: "#f59e0b",
  darkText: "#374151",
  mediumText: "#6b7280",
  lightText: "#9ca3af",
  badgeBg: "#f3f4f6",
  badgeText: "#4b5563",
  urlText: "#d1d5db",
} as const;

// TODO: Noto Sans JP のフォントURLが変更された場合は更新が必要
const FONT_URL =
  "https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFJEk757Y0rw_qMHVdbR2L8Y9QTJ1LwkRyR2vVNi8dtQ0sZ0iH0nMSen3u0.1.ttf";

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(FONT_URL);
    if (!response.ok) {
      return null;
    }
    return response.arrayBuffer();
  } catch {
    return null;
  }
}

function buildFontOptions(
  fontData: ArrayBuffer | null,
): { fonts: Array<{ name: string; data: ArrayBuffer; style: "normal" }> } | Record<string, never> {
  if (!fontData) {
    return {};
  }
  return {
    fonts: [
      {
        name: "NotoSansJP",
        data: fontData,
        style: "normal" as const,
      },
    ],
  };
}

function getFontFamily(fontData: ArrayBuffer | null): string {
  return fontData ? "NotoSansJP, sans-serif" : "sans-serif";
}

function renderRankingItem(
  item: string,
  rank: number,
  fontFamily: string,
) {
  const isFirst = rank === 1;
  const isTopThree = rank <= 3;

  const fontSize = isFirst ? 28 : isTopThree ? 22 : 18;
  const color = isFirst
    ? COLORS.gold
    : isTopThree
      ? COLORS.darkText
      : COLORS.lightText;
  const prefix = isFirst ? "\uD83D\uDC51 " : "";

  return (
    <div
      key={rank}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontFamily,
      }}
    >
      <span
        style={{
          fontSize: 18,
          color: COLORS.lightText,
          minWidth: "32px",
          fontFamily,
        }}
      >
        {rank}.
      </span>
      <span
        style={{
          fontSize,
          color,
          fontWeight: isFirst ? 700 : 400,
          fontFamily,
        }}
      >
        {prefix}{item}
      </span>
    </div>
  );
}

function renderTagBadge(tagName: string, fontFamily: string) {
  if (!tagName) {
    return null;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.badgeBg,
        borderRadius: "16px",
        padding: "6px 20px",
        fontSize: 18,
        color: COLORS.badgeText,
        fontFamily,
      }}
    >
      #{tagName}
    </div>
  );
}

function renderBrand(fontFamily: string) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 20,
        color: COLORS.brand,
        fontWeight: 700,
        fontFamily,
      }}
    >
      OKINY
    </div>
  );
}

function renderTitle(title: string, fontFamily: string) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "24px",
        fontSize: 40,
        fontWeight: 700,
        color: COLORS.title,
        fontFamily,
      }}
    >
      {title}
    </div>
  );
}

function renderItemsList(items: readonly string[], fontFamily: string) {
  const displayItems = items.filter((item) => item.trim()).slice(0, 5);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "32px",
        flex: 1,
        fontFamily,
      }}
    >
      {displayItems.map((item, index) =>
        renderRankingItem(item, index + 1, fontFamily),
      )}
    </div>
  );
}

function renderFooter(fontFamily: string) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        fontSize: 16,
        color: COLORS.urlText,
        fontFamily,
      }}
    >
      okiny.app
    </div>
  );
}

function renderFullImage(
  title: string,
  tagName: string,
  items: readonly string[],
  fontFamily: string,
) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.background,
        padding: "48px 64px",
        fontFamily,
      }}
    >
      {renderBrand(fontFamily)}
      {renderTitle(title, fontFamily)}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "16px",
        }}
      >
        {renderTagBadge(tagName, fontFamily)}
      </div>
      {renderItemsList(items, fontFamily)}
      {renderFooter(fontFamily)}
    </div>
  );
}

function renderFallbackImage(fontFamily: string) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.background,
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 700,
          color: COLORS.title,
          fontFamily,
        }}
      >
        OKINY
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: COLORS.mediumText,
          marginTop: "16px",
          fontFamily,
        }}
      >
        ランキングを共有しよう
      </div>
    </div>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const fontData = await loadFont();
  const fontOptions = buildFontOptions(fontData);
  const fontFamily = getFontFamily(fontData);

  const ranking = await getPublicRanking(id);

  const element = ranking
    ? renderFullImage(ranking.title, ranking.tagName, ranking.items, fontFamily)
    : renderFallbackImage(fontFamily);

  return new ImageResponse(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    ...fontOptions,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
