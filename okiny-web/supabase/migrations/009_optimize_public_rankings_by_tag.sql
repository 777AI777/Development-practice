CREATE INDEX IF NOT EXISTS idx_rankings_public_tag_created_at
  ON rankings(tag_id, created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_ranking_items_ranking_id_rank
  ON ranking_items(ranking_id, rank);

DROP FUNCTION IF EXISTS public.list_public_rankings_by_tag(UUID);

CREATE OR REPLACE FUNCTION public.list_public_rankings_by_tag(
  p_tag_id UUID
)
RETURNS TABLE(
  id UUID,
  user_id TEXT,
  title TEXT,
  tag_id UUID,
  tag_name TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  view_count INT,
  bookmark_count INT,
  ranking_items JSONB,
  author_display_name TEXT,
  author_avatar_url TEXT,
  author_display_user_id TEXT,
  is_bookmarked BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_public_rankings_by_tag(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_public_rankings_by_tag(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_public_rankings_by_tag(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_rankings_by_tag(UUID) TO service_role;
