-- ① フォローランキング取得用の複合インデックス追加
-- keyset pagination で (user_id, is_public, created_at DESC) の探索を高速化
CREATE INDEX IF NOT EXISTS idx_rankings_user_public_created
  ON rankings(user_id, is_public, created_at DESC);

-- ② list_following_rankings RPC をカーソルページネーション対応に置き換え
-- 既存シグネチャ (UUID) → (UUID, INT, TIMESTAMPTZ, UUID) に変更
DROP FUNCTION IF EXISTS public.list_following_rankings(UUID);

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
  is_bookmarked          BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND (p_cursor_created_at IS NULL OR (r.created_at, r.id) < (p_cursor_created_at, p_cursor_id))
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT LEAST(p_limit, 50) + 1
$$;

-- ③ GRANT（新シグネチャに合わせて再設定）
REVOKE ALL ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) TO service_role;
