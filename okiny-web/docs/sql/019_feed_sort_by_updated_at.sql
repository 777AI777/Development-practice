-- ============================================================
-- 019_feed_sort_by_updated_at.sql
-- フィードのソート順を updated_at ベースに変更
--
-- 目的:
--   コメントが付いていないランキングの場合、created_at ではなく
--   updated_at でソートする。これによりランキングを編集すると
--   フィード上部に浮上するようになる。
--
-- 変更点（両RPC共通）:
--   1. SELECT句: COALESCE(lc.created_at, r.created_at)
--      → COALESCE(lc.created_at, r.updated_at)
--   2. ORDER BY: 同上
--   3. カーソルページネーションのWHERE条件: 同上
-- ============================================================


-- ============================================================
-- list_following_rankings — フォローフィード
-- ============================================================

-- RETURNS TABLE のOUTパラメータ変更不可のため、DROP してから再作成
DROP FUNCTION IF EXISTS public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.list_following_rankings(
  p_viewer_user_id    UUID,
  p_limit             INT DEFAULT 20,
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
  -- コメント関連列（最新1件）
  comment_id             UUID,
  comment_user_id        UUID,
  comment_text           TEXT,
  comment_created_at     TIMESTAMPTZ,
  -- カーソル用: コメントがあればコメント日時、なければランキング更新日時
  post_created_at        TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.user_id::uuid AS user_id,
    r.title,
    r.tag_id::uuid,
    t.name AS tag_name,
    r.is_public,
    r.created_at,
    r.updated_at,
    r.view_count,
    r.impression_count,
    r.bookmark_count,
    -- 上位5件のアイテムを JSONB 配列で取得
    (SELECT jsonb_agg(
              jsonb_build_object('rank', ri.rank, 'item_text', ri.item_text)
              ORDER BY ri.rank
            )
     FROM ranking_items ri
     WHERE ri.ranking_id = r.id AND ri.rank <= 5
    ) AS ranking_items,
    -- 著者情報（フォールバックチェーン）
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      'ユーザー'
    ) AS author_display_name,
    u.raw_user_meta_data->>'avatar_url' AS author_avatar_url,
    u.raw_user_meta_data->>'display_user_id' AS author_display_user_id,
    -- ブックマーク済みフラグ
    EXISTS (
      SELECT 1 FROM bookmarks b
      WHERE b.user_id = p_viewer_user_id AND b.ranking_id = r.id
    ) AS is_bookmarked,
    -- 最新コメント情報（LATERAL JOIN から取得）
    lc.id         AS comment_id,
    lc.user_id    AS comment_user_id,
    lc.comment    AS comment_text,
    lc.created_at AS comment_created_at,
    -- カーソル用ソートキー（変更: r.created_at → r.updated_at）
    COALESCE(lc.created_at, r.updated_at) AS post_created_at
  FROM follows f
  JOIN rankings r
    ON r.user_id::uuid = f.following_id
   AND r.is_public = true
  JOIN auth.users u
    ON u.id = r.user_id::uuid
  LEFT JOIN tags t
    ON t.id = r.tag_id
  -- 各ランキングの最新コメント1件を LATERAL JOIN で取得
  LEFT JOIN LATERAL (
    SELECT rc.id, rc.user_id, rc.comment, rc.created_at
    FROM ranking_comments rc
    WHERE rc.ranking_id = r.id
    ORDER BY rc.created_at DESC
    LIMIT 1
  ) lc ON true
  WHERE f.follower_id = p_viewer_user_id
    -- カーソルページネーション: COALESCE 後の日時でカーソル比較（変更: r.created_at → r.updated_at）
    AND (
      p_cursor_created_at IS NULL
      OR (COALESCE(lc.created_at, r.updated_at), r.id) < (p_cursor_created_at, p_cursor_id)
    )
  -- コメントがあればコメント日時、なければランキング更新日時で降順ソート（変更: r.created_at → r.updated_at）
  ORDER BY COALESCE(lc.created_at, r.updated_at) DESC, r.id DESC
  LIMIT LEAST(p_limit, 50) + 1
$$;


-- ============================================================
-- list_recommend_rankings — おすすめフィード
-- ============================================================

-- RETURNS TABLE のOUTパラメータ変更不可のため、DROP してから再作成
DROP FUNCTION IF EXISTS public.list_recommend_rankings(UUID, UUID[], UUID[], UUID[], INT, INT, TIMESTAMPTZ, UUID);

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
  -- カーソル用: COALESCE(最新コメント日時, ランキング更新日時)
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
    -- カーソル用日時（変更: r.created_at → r.updated_at）
    COALESCE(lc.created_at, r.updated_at)      AS post_created_at
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
           -- 変更: r.created_at → r.updated_at
           AND (COALESCE(lc.created_at, r.updated_at), r.id) < (p_cursor_created_at, p_cursor_id)
         )
    )
  -- 変更: r.created_at → r.updated_at
  ORDER BY priority DESC, COALESCE(lc.created_at, r.updated_at) DESC, r.id DESC
  LIMIT LEAST(p_limit, 50) + 1
$$;
