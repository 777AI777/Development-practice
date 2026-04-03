#!/usr/bin/env tsx
/**
 * タグのembeddingをバックフィルするスクリプト
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx npx tsx scripts/backfill-tag-embeddings.ts
 *   --apply フラグで実際に更新（デフォルトはdry-run）
 *
 * 環境変数:
 *   GEMINI_API_KEY (必須) — aistudio.google.com で取得
 *   NEXT_PUBLIC_SUPABASE_URL (必須)
 *   SUPABASE_SERVICE_ROLE_KEY (必須)
 *
 * .env.local を読み込む場合:
 *   dotenv -e .env.local -- npx tsx scripts/backfill-tag-embeddings.ts --apply
 */

const isDryRun = !process.argv.includes("--apply");

// ── 環境変数チェック ──────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set.");
  process.exit(1);
}
if (!SUPABASE_URL) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL is not set.");
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is not set.");
  process.exit(1);
}

// ── 型定義 ───────────────────────────────────────────────────────────
interface TagRow {
  id: string;
  name: string;
}

// ── Supabase ヘルパー ─────────────────────────────────────────────────
function supabaseHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

/** embeddingがnullのタグ一覧を取得 */
async function fetchTagsWithoutEmbedding(): Promise<TagRow[]> {
  const query = new URLSearchParams({
    select: "id,name",
    embedding: "is.null",
  });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tags?${query.toString()}`,
    {
      method: "GET",
      headers: supabaseHeaders(),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Failed to fetch tags without embedding (${res.status}): ${detail}`,
    );
  }

  return (await res.json()) as TagRow[];
}

/** Gemini embedding 生成 */
async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}

/** Supabase の tags テーブルに embedding を保存 */
async function saveEmbedding(tagId: string, embedding: number[]): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tags?id=eq.${tagId}`,
    {
      method: "PATCH",
      headers: {
        ...supabaseHeaders(),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ embedding: JSON.stringify(embedding) }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Supabase PATCH failed for tag ${tagId} (${res.status}): ${detail}`,
    );
  }
}

/** rate limit 対応の待機 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── メイン処理 ───────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(
    `\n[backfill-tag-embeddings] mode=${isDryRun ? "DRY RUN (--apply で実行)" : "APPLY"}`,
  );

  const tags = await fetchTagsWithoutEmbedding();
  console.log(`\n対象タグ数: ${tags.length}`);

  if (tags.length === 0) {
    console.log("embeddingがnullのタグはありません。処理を終了します。");
    return;
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]!;
    const progress = `[${i + 1}/${tags.length}]`;

    try {
      console.log(`${progress} "${tag.name}" (id: ${tag.id}) — embedding生成中...`);

      const embedding = await generateEmbedding(tag.name);
      console.log(`  ✓ embedding生成完了 (dims: ${embedding.length})`);

      if (isDryRun) {
        console.log(`  → DRY RUN: Supabase更新スキップ`);
        skipCount++;
      } else {
        await saveEmbedding(tag.id, embedding);
        console.log(`  ✓ Supabase更新完了`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ✗ エラー: ${err instanceof Error ? err.message : String(err)}`);
      errorCount++;
    }

    // Gemini rate limit 対応: 100ms 待機
    if (i < tags.length - 1) {
      await sleep(100);
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`完了サマリー:`);
  if (isDryRun) {
    console.log(`  DRY RUN: ${tags.length - errorCount} 件が更新対象`);
  } else {
    console.log(`  成功: ${successCount} 件`);
  }
  if (errorCount > 0) {
    console.log(`  エラー: ${errorCount} 件`);
  }
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
