-- Migration 018: おすすめフィードにコメント情報を追加
--
-- 変更内容:
--   ① RETURNS TABLE にコメント4列 + post_created_at を追加
--   ② ranking_comments テーブルへの LEFT JOIN LATERAL（最新1件）
--   ③ SELECT句にコメント列 + post_created_at を追加
--   ④ ORDER BY を COALESCE(lc.created_at, r.created_at) に変更
--   ⑤ カーソル条件の created_at を COALESCE(lc.created_at, r.created_at) に変更
--
-- 注意: RETURNS TABLE の列構成が変わるため、DROP してから CREATE する

-- ============================================================
-- 既存関数を DROP（シグネチャ指定）
-- ============================================================
DROP FUNCTION IF EXISTS public.list_recommend_rankings(UUID, UUID[], UUID[], UUID[], INT, INT, TIMESTAMPTZ, UUID);

-- ============================================================
-- list_recommend_rankings() RPC（コメント付きバージョン）
--
-- 優先度:
--   3 = p_tier3_tag_ids（自分が作成済みのタグ）
--   2 = p_tier2_tag_ids（ブックマーク済み + 高affinity タグ）
--   1 = p_tier1_tag_ids（embedding類似 + 共起タグ）
--   0 = その他（発見枠）
--
-- カーソルページネーション: (priority DESC, post_created_at DESC, id DESC)
--   post_created_at = COALESCE(最新コメント日時, ランキング作成日時)
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
  priority               INT,
  -- コメント情報（最新1件）
  comment_id             UUID,
  comment_user_id        UUID,
  comment_text           TEXT,
  comment_created_at     TIMESTAMPTZ,
  -- カーソル用: COALESCE(最新コメント日時, ランキング作成日時)
  post_created_at        TIMESTAMPTZ
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
    END                                        AS priority,
    -- コメント情報（最新1件）
    lc.id                                      AS comment_id,
    lc.user_id                                 AS comment_user_id,
    lc.comment                                 AS comment_text,
    lc.created_at                              AS comment_created_at,
    -- カーソル用日時
    COALESCE(lc.created_at, r.created_at)      AS post_created_at
  FROM rankings r
  JOIN auth.users u ON u.id = r.user_id::uuid
  LEFT JOIN tags t   ON t.id = r.tag_id
  -- 最新コメント1件を取得
  LEFT JOIN LATERAL (
    SELECT rc.id, rc.user_id, rc.comment, rc.created_at
    FROM ranking_comments rc
    WHERE rc.ranking_id = r.id
    ORDER BY rc.created_at DESC
    LIMIT 1
  ) lc ON true
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
           AND (COALESCE(lc.created_at, r.created_at), r.id) < (p_cursor_created_at, p_cursor_id)
         )
    )
  ORDER BY priority DESC, COALESCE(lc.created_at, r.created_at) DESC, r.id DESC
  LIMIT LEAST(p_limit, 50) + 1
$$;

-- ============================================================
-- 権限設定
-- ============================================================
REVOKE ALL ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) TO service_role;
