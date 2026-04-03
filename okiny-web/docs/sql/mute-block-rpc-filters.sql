-- ============================================================
-- ミュート・ブロック フィルタ追加（既存RPC改修）
--
-- 前提: mutes / blocks テーブルとRLSポリシーが適用済みであること
-- 適用順序: 順番は問わない（各RPCは独立）
-- ============================================================

-- ============================================================
-- 1. list_recommend_rankings
--    変更点: WHERE句にミュート/ブロックフィルタ3条件を追加
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_recommend_rankings(
  p_viewer_user_id uuid,
  p_tier3_tag_ids uuid[],
  p_tier2_tag_ids uuid[],
  p_tier1_tag_ids uuid[],
  p_limit integer DEFAULT 10,
  p_cursor_priority integer DEFAULT NULL::integer,
  p_cursor_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_cursor_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(
   id uuid, user_id uuid, title text, tag_id uuid, tag_name text,
   is_public boolean, created_at timestamp with time zone, updated_at timestamp with time zone,
   view_count integer, impression_count integer, bookmark_count integer,
   ranking_items jsonb, author_display_name text, author_avatar_url text,
   author_display_user_id text, is_bookmarked boolean, priority integer
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- ▼ ミュート/ブロック フィルタ（追加）
    AND r.user_id::uuid NOT IN (SELECT muted_id FROM mutes WHERE user_id = p_viewer_user_id)
    AND r.user_id::uuid NOT IN (SELECT blocked_id FROM blocks WHERE user_id = p_viewer_user_id)
    AND r.user_id::uuid NOT IN (SELECT user_id FROM blocks WHERE blocked_id = p_viewer_user_id)
    -- ▲ ミュート/ブロック フィルタ（追加）
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
$function$;

-- ============================================================
-- 2. list_following_rankings
--    変更点: WHERE句にミュート/ブロックフィルタ3条件を追加
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_following_rankings(
  p_viewer_user_id uuid,
  p_limit integer DEFAULT 20,
  p_cursor_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_cursor_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(
   id uuid, user_id uuid, title text, tag_id uuid, tag_name text,
   is_public boolean, created_at timestamp with time zone, updated_at timestamp with time zone,
   view_count integer, impression_count integer, bookmark_count integer,
   ranking_items jsonb, author_display_name text, author_avatar_url text,
   author_display_user_id text, is_bookmarked boolean
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.id, r.user_id::uuid AS user_id, r.title, r.tag_id::uuid,
    t.name AS tag_name,
    r.is_public, r.created_at, r.updated_at,
    r.view_count, r.impression_count, r.bookmark_count,
    (SELECT jsonb_agg(jsonb_build_object('rank', ri.rank, 'item_text', ri.item_text) ORDER BY ri.rank)
     FROM ranking_items ri WHERE ri.ranking_id = r.id AND ri.rank <= 5) AS ranking_items,
    COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'ユーザー') AS author_display_name,
    u.raw_user_meta_data->>'avatar_url' AS author_avatar_url,
    u.raw_user_meta_data->>'display_user_id' AS author_display_user_id,
    EXISTS (SELECT 1 FROM bookmarks b WHERE b.user_id = p_viewer_user_id AND b.ranking_id = r.id) AS is_bookmarked
  FROM follows f
  JOIN rankings r ON r.user_id::uuid = f.following_id AND r.is_public = true
  JOIN auth.users u ON u.id = r.user_id::uuid
  LEFT JOIN tags t ON t.id = r.tag_id
  WHERE f.follower_id = p_viewer_user_id
    -- ▼ ミュート/ブロック フィルタ（追加）
    AND r.user_id::uuid NOT IN (SELECT muted_id FROM mutes WHERE user_id = p_viewer_user_id)
    AND r.user_id::uuid NOT IN (SELECT blocked_id FROM blocks WHERE user_id = p_viewer_user_id)
    AND r.user_id::uuid NOT IN (SELECT user_id FROM blocks WHERE blocked_id = p_viewer_user_id)
    -- ▲ ミュート/ブロック フィルタ（追加）
    AND (p_cursor_created_at IS NULL OR (r.created_at, r.id) < (p_cursor_created_at, p_cursor_id))
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT p_limit + 1
$function$;

-- ============================================================
-- 3. search_rankings
--    変更点: WHERE句にミュート/ブロックフィルタ3条件を追加
--    注意: このRPCのviewerパラメータ名は p_viewer_id（UUID型）
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_rankings(
  p_query text,
  p_viewer_id uuid,
  p_limit integer DEFAULT 20,
  p_cursor_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_cursor_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(
   id uuid, user_id text, title text, tag_id uuid, tag_name text,
   is_public boolean, created_at timestamp with time zone, updated_at timestamp with time zone,
   view_count integer, impression_count integer, bookmark_count integer,
   ranking_items jsonb, author_display_name text, author_avatar_url text,
   author_display_user_id text, is_bookmarked boolean
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.id,
    r.user_id::text AS user_id,
    r.title,
    r.tag_id,
    t.name AS tag_name,
    r.is_public,
    r.created_at,
    r.updated_at,
    COALESCE(r.view_count, 0)::INT AS view_count,
    COALESCE(r.impression_count, 0)::INT AS impression_count,
    COALESCE(r.bookmark_count, 0)::INT AS bookmark_count,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', ri.rank,
          'item_text', ri.item_text
        )
        ORDER BY ri.rank ASC
      )
      FROM ranking_items ri
      WHERE ri.ranking_id = r.id
        AND ri.rank <= 5
    ) AS ranking_items,
    up.display_name AS author_display_name,
    up.avatar_url AS author_avatar_url,
    up.display_user_id AS author_display_user_id,
    EXISTS (
      SELECT 1
      FROM bookmarks b
      WHERE b.ranking_id = r.id
        AND b.user_id::text = p_viewer_id::text
    ) AS is_bookmarked
  FROM rankings r
  LEFT JOIN tags t ON t.id = r.tag_id
  LEFT JOIN user_profiles up ON up.id::text = r.user_id::text
  WHERE r.is_public = true
    AND r.user_id::text <> p_viewer_id::text
    -- ▼ ミュート/ブロック フィルタ（追加）
    AND r.user_id::uuid NOT IN (SELECT muted_id FROM mutes WHERE user_id = p_viewer_id)
    AND r.user_id::uuid NOT IN (SELECT blocked_id FROM blocks WHERE user_id = p_viewer_id)
    AND r.user_id::uuid NOT IN (SELECT user_id FROM blocks WHERE blocked_id = p_viewer_id)
    -- ▲ ミュート/ブロック フィルタ（追加）
    AND (
      r.title ILIKE '%' || p_query || '%'
      OR EXISTS (
        SELECT 1
        FROM ranking_items ri
        WHERE ri.ranking_id = r.id
          AND ri.item_text ILIKE '%' || p_query || '%'
      )
      OR t.name ILIKE '%' || p_query || '%'
    )
    AND (
      p_cursor_created_at IS NULL
      OR r.created_at < p_cursor_created_at
      OR (r.created_at = p_cursor_created_at AND r.id < p_cursor_id)
    )
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT p_limit;
$function$;

-- ============================================================
-- 4. list_public_rankings_by_tag
--    変更点: WHERE句にミュート/ブロックフィルタ3条件を追加
--    注意: このRPCはviewerパラメータなし。auth.uid()を直接使用
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_public_rankings_by_tag(p_tag_id uuid)
 RETURNS TABLE(
   id uuid, user_id text, title text, tag_id uuid, tag_name text,
   is_public boolean, created_at timestamp with time zone, updated_at timestamp with time zone,
   view_count integer, bookmark_count integer, impression_count integer,
   ranking_items jsonb, author_display_name text, author_avatar_url text,
   author_display_user_id text, is_bookmarked boolean
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.id,
    r.user_id::text AS user_id,
    r.title,
    r.tag_id,
    t.name AS tag_name,
    r.is_public,
    r.created_at,
    r.updated_at,
    COALESCE(r.view_count, 0)::INT AS view_count,
    COALESCE(r.bookmark_count, 0)::INT AS bookmark_count,
    COALESCE(r.impression_count, 0)::INT AS impression_count,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'rank', ri.rank,
            'item_text', ri.item_text
          )
          ORDER BY ri.rank ASC
        )
        FROM ranking_items ri
        WHERE ri.ranking_id = r.id
      ),
      '[]'::jsonb
    ) AS ranking_items,
    COALESCE(up.display_name, 'ユーザー') AS author_display_name,
    up.avatar_url AS author_avatar_url,
    up.display_user_id AS author_display_user_id,
    EXISTS (
      SELECT 1
      FROM bookmarks b
      WHERE b.ranking_id = r.id
        AND b.user_id::text = auth.uid()::text
    ) AS is_bookmarked
  FROM rankings r
  JOIN tags t ON t.id = r.tag_id
  LEFT JOIN user_profiles up ON up.id::text = r.user_id::text
  WHERE r.is_public = true
    AND r.tag_id = p_tag_id
    AND r.user_id::text <> auth.uid()::text
    -- ▼ ミュート/ブロック フィルタ（追加）
    AND r.user_id::uuid NOT IN (SELECT muted_id FROM mutes WHERE user_id = auth.uid())
    AND r.user_id::uuid NOT IN (SELECT blocked_id FROM blocks WHERE user_id = auth.uid())
    AND r.user_id::uuid NOT IN (SELECT user_id FROM blocks WHERE blocked_id = auth.uid())
    -- ▲ ミュート/ブロック フィルタ（追加）
  ORDER BY r.created_at DESC;
$function$;
