DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  EXCEPTION
    WHEN insufficient_privilege OR undefined_file OR feature_not_supported THEN
      RAISE NOTICE 'pg_trgm is unavailable or cannot be enabled; trigram indexes will be skipped.';
  END;

  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_trgm'
  ) THEN
    EXECUTE '
      CREATE INDEX IF NOT EXISTS idx_rankings_title_trgm
        ON public.rankings USING gin (title gin_trgm_ops)
        WHERE is_public = true
    ';

    EXECUTE '
      CREATE INDEX IF NOT EXISTS idx_ranking_items_item_text_trgm
        ON public.ranking_items USING gin (item_text gin_trgm_ops)
    ';

    EXECUTE '
      CREATE INDEX IF NOT EXISTS idx_tags_name_trgm
        ON public.tags USING gin (name gin_trgm_ops)
    ';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.search_rankings(TEXT, UUID, INT, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.search_rankings(
  p_query TEXT,
  p_viewer_id UUID,
  p_limit INT DEFAULT 20,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  title TEXT,
  tag_id UUID,
  tag_name TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  view_count INT,
  impression_count INT,
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
$$;

REVOKE ALL ON FUNCTION public.search_rankings(TEXT, UUID, INT, TIMESTAMPTZ, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_rankings(TEXT, UUID, INT, TIMESTAMPTZ, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_rankings(TEXT, UUID, INT, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_rankings(TEXT, UUID, INT, TIMESTAMPTZ, UUID) TO service_role;

DROP FUNCTION IF EXISTS public.search_users(TEXT, INT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.search_users(
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_cursor_display_name TEXT DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  display_user_id TEXT,
  public_ranking_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    up.id,
    up.display_name,
    up.avatar_url,
    up.display_user_id,
    (
      SELECT count(*)
      FROM rankings r
      WHERE r.user_id::text = up.id::text
        AND r.is_public = true
    ) AS public_ranking_count
  FROM user_profiles up
  WHERE (
    up.display_name ILIKE '%' || p_query || '%'
    OR up.display_user_id ILIKE '%' || p_query || '%'
  )
    AND (
      p_cursor_display_name IS NULL
      OR up.display_name > p_cursor_display_name
      OR (up.display_name = p_cursor_display_name AND up.id > p_cursor_id)
    )
  ORDER BY up.display_name ASC, up.id ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.search_users(TEXT, INT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_users(TEXT, INT, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_users(TEXT, INT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(TEXT, INT, TEXT, UUID) TO service_role;
