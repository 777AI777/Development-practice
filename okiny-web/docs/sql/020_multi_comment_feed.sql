-- ============================================================
-- 020_multi_comment_feed.sql
-- フィードRPCを「同一ランキングでもコメントごとに複数行返す」ように変更
--
-- ⚠ 既存関数の RETURNS TABLE 列構成が変わるため、各関数を
--   CREATE OR REPLACE する前に DROP FUNCTION IF EXISTS で削除が必要。
--   （PostgreSQL は CREATE OR REPLACE で戻り値の列変更を許可しない）
--
-- 目的:
--   1つのランキングに複数コメントがある場合、コメントごとに
--   別行として返す（最大10件）。コメントなしランキングは1行で
--   NULL列付きのまま返る（LEFT JOINの性質）。
--
-- 変更点（両RPC共通）:
--   1. LATERAL JOIN: LIMIT 1 → LIMIT 10（最大10コメント展開）
--   2. LATERAL JOIN内でコメント投稿者の auth.users をJOINし、
--      display_name, avatar_url, display_user_id を取得
--   3. RETURNS TABLE に3列追加:
--      - comment_user_display_name TEXT
--      - comment_user_avatar_url TEXT
--      - comment_user_display_user_id TEXT
--   4. cursor_id 列を追加: COALESCE(rc.id, r.id)
--      → コメント展開により同一ランキングが複数行になるため、
--        r.id だけではカーソルの一意性が保てない
--   5. ORDER BY: COALESCE(rc.created_at, r.updated_at) DESC,
--               COALESCE(rc.id, r.id) DESC
--   6. カーソル条件: r.id → COALESCE(rc.id, r.id) に変更
--
-- 注意:
--   - user_profiles VIEW は user_stats JOIN があり重いため、
--     コメント投稿者情報は auth.users を直接参照
--   - コメントなしランキングは LEFT JOIN により1行（NULL列）で返る
-- ============================================================


-- ============================================================
-- list_following_rankings — フォローフィード（複数コメント展開版）
-- ============================================================

-- RETURNS TABLE の列構成が変わるため DROP してから再作成
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
  -- コメント関連列（最大10件展開）
  comment_id                   UUID,
  comment_user_id              UUID,
  comment_text                 TEXT,
  comment_created_at           TIMESTAMPTZ,
  comment_user_display_name    TEXT,
  comment_user_avatar_url      TEXT,
  comment_user_display_user_id TEXT,
  -- カーソル用
  post_created_at        TIMESTAMPTZ,
  cursor_id              UUID
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
    -- コメント情報（LATERAL JOIN から取得、最大10件展開）
    rc.comment_id,
    rc.comment_user_id,
    rc.comment_text,
    rc.comment_created_at,
    rc.comment_user_display_name,
    rc.comment_user_avatar_url,
    rc.comment_user_display_user_id,
    -- カーソル用ソートキー
    COALESCE(rc.comment_created_at, r.updated_at) AS post_created_at,
    COALESCE(rc.comment_id, r.id) AS cursor_id
  FROM follows f
  JOIN rankings r
    ON r.user_id::uuid = f.following_id
   AND r.is_public = true
  JOIN auth.users u
    ON u.id = r.user_id::uuid
  LEFT JOIN tags t
    ON t.id = r.tag_id
  -- 各ランキングの最新10件のコメントを LATERAL JOIN で展開
  -- コメント投稿者の情報も auth.users から取得
  LEFT JOIN LATERAL (
    SELECT
      c.id         AS comment_id,
      c.user_id    AS comment_user_id,
      c.comment    AS comment_text,
      c.created_at AS comment_created_at,
      COALESCE(
        cu.raw_user_meta_data->>'display_name',
        cu.raw_user_meta_data->>'full_name',
        cu.raw_user_meta_data->>'name',
        'ユーザー'
      ) AS comment_user_display_name,
      cu.raw_user_meta_data->>'avatar_url'        AS comment_user_avatar_url,
      cu.raw_user_meta_data->>'display_user_id'   AS comment_user_display_user_id
    FROM ranking_comments c
    JOIN auth.users cu ON cu.id = c.user_id
    WHERE c.ranking_id = r.id
    ORDER BY c.created_at DESC
    LIMIT 10
  ) rc ON true
  WHERE f.follower_id = p_viewer_user_id
    -- カーソルページネーション: COALESCE 後の日時 + COALESCE 後の ID でカーソル比較
    AND (
      p_cursor_created_at IS NULL
      OR (COALESCE(rc.comment_created_at, r.updated_at), COALESCE(rc.comment_id, r.id))
         < (p_cursor_created_at, p_cursor_id)
    )
  -- コメントがあればコメント日時、なければランキング更新日時で降順ソート
  ORDER BY COALESCE(rc.comment_created_at, r.updated_at) DESC,
           COALESCE(rc.comment_id, r.id) DESC
  LIMIT LEAST(p_limit, 50) + 1
$$;

-- 権限設定
REVOKE ALL ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) TO service_role;


-- ============================================================
-- list_recommend_rankings — おすすめフィード（複数コメント展開版）
-- ============================================================

-- RETURNS TABLE の列構成が変わるため DROP してから再作成
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
  -- コメント情報（最大10件展開）
  comment_id                   UUID,
  comment_user_id              UUID,
  comment_text                 TEXT,
  comment_created_at           TIMESTAMPTZ,
  comment_user_display_name    TEXT,
  comment_user_avatar_url      TEXT,
  comment_user_display_user_id TEXT,
  -- カーソル用
  post_created_at        TIMESTAMPTZ,
  cursor_id              UUID
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
    -- コメント情報（LATERAL JOIN から取得、最大10件展開）
    rc.comment_id,
    rc.comment_user_id,
    rc.comment_text,
    rc.comment_created_at,
    rc.comment_user_display_name,
    rc.comment_user_avatar_url,
    rc.comment_user_display_user_id,
    -- カーソル用
    COALESCE(rc.comment_created_at, r.updated_at) AS post_created_at,
    COALESCE(rc.comment_id, r.id) AS cursor_id
  FROM rankings r
  JOIN auth.users u ON u.id = r.user_id::uuid
  LEFT JOIN tags t   ON t.id = r.tag_id
  -- 各ランキングの最新10件のコメントを LATERAL JOIN で展開
  -- コメント投稿者の情報も auth.users から取得
  LEFT JOIN LATERAL (
    SELECT
      c.id         AS comment_id,
      c.user_id    AS comment_user_id,
      c.comment    AS comment_text,
      c.created_at AS comment_created_at,
      COALESCE(
        cu.raw_user_meta_data->>'display_name',
        cu.raw_user_meta_data->>'full_name',
        cu.raw_user_meta_data->>'name',
        'ユーザー'
      ) AS comment_user_display_name,
      cu.raw_user_meta_data->>'avatar_url'        AS comment_user_avatar_url,
      cu.raw_user_meta_data->>'display_user_id'   AS comment_user_display_user_id
    FROM ranking_comments c
    JOIN auth.users cu ON cu.id = c.user_id
    WHERE c.ranking_id = r.id
    ORDER BY c.created_at DESC
    LIMIT 10
  ) rc ON true
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
           AND (COALESCE(rc.comment_created_at, r.updated_at), COALESCE(rc.comment_id, r.id))
               < (p_cursor_created_at, p_cursor_id)
         )
    )
  ORDER BY priority DESC,
           COALESCE(rc.comment_created_at, r.updated_at) DESC,
           COALESCE(rc.comment_id, r.id) DESC
  LIMIT LEAST(p_limit, 50) + 1
$$;

-- 権限設定
REVOKE ALL ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_recommend_rankings(UUID,UUID[],UUID[],UUID[],INT,INT,TIMESTAMPTZ,UUID) TO service_role;
