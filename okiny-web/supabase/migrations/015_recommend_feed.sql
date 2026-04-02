-- Migration 015: おすすめフィード用テーブル・インデックス・RPC
--
-- 追加内容:
--   ① pgvector 拡張
--   ② tags.embedding カラム + HNSW インデックス
--   ③ user_tag_affinity テーブル（閲覧履歴ベースの親和度）
--   ④ upsert_tag_affinity() RPC（view_count の安全なインクリメント）
--   ⑤ tag_similarities テーブル（共起ベースのタグ類似度）
--   ⑥ refresh_tag_similarities() 関数（pg_cron で週1実行を想定）
--   ⑦ list_recommend_rankings() RPC（優先度付きカーソルページネーション）

-- ============================================================
-- ① pgvector 拡張
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ② tags.embedding カラム + HNSW インデックス
-- ============================================================
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_tags_embedding
  ON public.tags USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- ③ user_tag_affinity テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_tag_affinity (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id         UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  view_count     INT NOT NULL DEFAULT 1,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tag_affinity_user_last_viewed
  ON public.user_tag_affinity (user_id, last_viewed_at DESC);

ALTER TABLE public.user_tag_affinity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tag_affinity_select_own"
  ON public.user_tag_affinity FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_tag_affinity_insert_own"
  ON public.user_tag_affinity FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_tag_affinity_update_own"
  ON public.user_tag_affinity FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- ④ upsert_tag_affinity() — view_count を安全にインクリメント
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_tag_affinity(
  p_user_id UUID,
  p_tag_id  UUID
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO user_tag_affinity (user_id, tag_id, view_count, last_viewed_at)
  VALUES (p_user_id, p_tag_id, 1, now())
  ON CONFLICT (user_id, tag_id)
  DO UPDATE SET
    view_count     = user_tag_affinity.view_count + 1,
    last_viewed_at = now();
$$;

REVOKE ALL ON FUNCTION public.upsert_tag_affinity(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_tag_affinity(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_tag_affinity(UUID, UUID) TO service_role;

-- ============================================================
-- ⑤ tag_similarities テーブル（共起ベース）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tag_similarities (
  tag_a_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  tag_b_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  score    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (tag_a_id, tag_b_id)
);

ALTER TABLE public.tag_similarities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tag_similarities_select_authenticated"
  ON public.tag_similarities FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- ⑥ refresh_tag_similarities() — 共起スコア再計算
--
-- pg_cron での週1実行例（Supabase ダッシュボード or SQL エディタで設定）:
--   SELECT cron.schedule(
--     'refresh-tag-similarities',
--     '0 3 * * 0',
--     $$ SELECT public.refresh_tag_similarities(); $$
--   );
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_tag_similarities()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO tag_similarities (tag_a_id, tag_b_id, score)
  SELECT
    r1.tag_id,
    r2.tag_id,
    COUNT(DISTINCT b1.user_id)::int
  FROM bookmarks b1
  JOIN bookmarks b2
    ON  b1.user_id    =  b2.user_id
    AND b1.ranking_id != b2.ranking_id
  JOIN rankings r1 ON b1.ranking_id = r1.id
  JOIN rankings r2 ON b2.ranking_id = r2.id
  WHERE r1.tag_id IS NOT NULL
    AND r2.tag_id IS NOT NULL
    AND r1.tag_id != r2.tag_id
  GROUP BY r1.tag_id, r2.tag_id
  HAVING COUNT(DISTINCT b1.user_id) >= 3
  ON CONFLICT (tag_a_id, tag_b_id)
    DO UPDATE SET score = EXCLUDED.score;
$$;

REVOKE ALL ON FUNCTION public.refresh_tag_similarities() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_tag_similarities() TO service_role;

-- ============================================================
-- ⑦ list_recommend_rankings() RPC
--
-- 優先度:
--   3 = p_tier3_tag_ids（自分が作成済みのタグ）
--   2 = p_tier2_tag_ids（ブックマーク済み + 高affinity タグ）
--   1 = p_tier1_tag_ids（embedding類似 + 共起タグ）
--   0 = その他（発見枠）
--
-- カーソルページネーション: (priority DESC, created_at DESC, id DESC)
-- LIMIT LEAST(p_limit, 50) + 1 で hasNextPage を呼び元が判定する
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_recommend_rankings(
  p_viewer_user_id    UUID,
  p_tier3_tag_ids     UUID[],
  p_tier2_tag_ids     UUID[],
  p_tier1_tag_ids     UUID[],
  p_limit             INT DEFAULT 10,
  p_cursor_priority   INT DEFAULT NULL,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id         UUID DEFAULT NULL
)
RETURNS TABLE (
  id                     UUID,
  user_id                UUID,
  title                  TEXT,
  tag_id                 UUID,
  tag_name               TEXT,
  is_public              BOOLEAN,
  created_at             TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ,
  view_count             INT,
  impression_count       INT,
  bookmark_count         INT,
  ranking_items          JSONB,
  author_display_name    TEXT,
  author_avatar_url      TEXT,
  author_display_user_id TEXT,
  is_bookmarked          BOOLEAN,
  priority               INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.user_id::uuid,
    r.title,
    r.tag_id::uuid,
    t.name                                     AS tag_name,
    r.is_public,
    r.created_at,
    r.updated_at,
    r.view_count,
    r.impression_count,
    r.bookmark_count,
    (
      SELECT jsonb_agg(
        jsonb_build_object('rank', ri.rank, 'item_text', ri.item_text)
        ORDER BY ri.rank
      )
      FROM ranking_items ri
      WHERE ri.ranking_id = r.id AND ri.rank <= 5
    )                                          AS ranking_items,
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      'ユーザー'
    )                                          AS author_display_name,
    u.raw_user_meta_data->>'avatar_url'        AS author_avatar_url,
    u.raw_user_meta_data->>'display_user_id'   AS author_display_user_id,
    EXISTS (
      SELECT 1 FROM bookmarks b
      WHERE b.user_id = p_viewer_user_id AND b.ranking_id = r.id
    )                                          AS is_bookmarked,
    CASE
      WHEN r.tag_id = ANY(p_tier3_tag_ids) THEN 3
      WHEN r.tag_id = ANY(p_tier2_tag_ids) THEN 2
      WHEN r.tag_id = ANY(p_tier1_tag_ids) THEN 1
      ELSE 0
    END                                        AS priority
  FROM rankings r
  JOIN auth.users u ON u.id = r.user_id::uuid
  LEFT JOIN tags t   ON t.id = r.tag_id
  WHERE r.is_public = true
    AND r.user_id::uuid != p_viewer_user_id
    AND (
      p_cursor_priority IS NULL
      OR CASE
           WHEN r.tag_id = ANY(p_tier3_tag_ids) THEN 3
           WHEN r.tag_id = ANY(p_tier2_tag_ids) THEN 2
           WHEN r.tag_id = ANY(p_tier1_tag_ids) THEN 1
           ELSE 0
         END < p_cursor_priority
      OR (
           CASE
             WHEN r.tag_id = ANY(p_tier3_tag_ids) THEN 3
             WHEN r.tag_id = ANY(p_tier2_tag_ids) THEN 2
             WHEN r.tag_id = ANY(p_tier1_tag_ids) THEN 1
             ELSE 0
           END = p_cursor_priority
           AND (r.created_at, r.id) < (p_cursor_created_at, p_cursor_id)
         )
    )
  ORDER BY priority DESC, r.created_at DESC, r.id DESC
  LIMIT LEAST(p_limit, 50) + 1
$$;

REVOKE ALL ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) TO service_role;
