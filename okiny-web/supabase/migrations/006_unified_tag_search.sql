CREATE OR REPLACE FUNCTION search_tags_unified(
  p_query TEXT,
  p_katakana_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  readings TEXT[],
  usage_count INT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE
SECURITY INVOKER
AS $$
BEGIN
  -- ILIKE ワイルドカード文字のエスケープ（%, _, \ を無効化）
  p_query := replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_');
  p_katakana_query := replace(replace(replace(p_katakana_query, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY
  WITH exact AS (
    SELECT t.id, t.name, t.readings, t.usage_count, t.created_at, 1 AS priority
    FROM tags t
    WHERE t.name = p_query
    LIMIT 1
  ),
  by_reading AS (
    SELECT t.id, t.name, t.readings, t.usage_count, t.created_at, 2 AS priority
    FROM (
      SELECT DISTINCT ON (t2.id) t2.*
      FROM tags t2, unnest(t2.readings) AS reading
      WHERE reading ILIKE (p_katakana_query || '%')
      AND t2.id NOT IN (SELECT e.id FROM exact e)
      ORDER BY t2.id
    ) t
    ORDER BY t.usage_count DESC, t.created_at ASC
    LIMIT p_limit
  ),
  by_name AS (
    SELECT t.id, t.name, t.readings, t.usage_count, t.created_at, 3 AS priority
    FROM tags t
    WHERE lower(t.name) ILIKE (lower(p_query) || '%')
    AND t.id NOT IN (SELECT e.id FROM exact e)
    AND t.id NOT IN (SELECT r.id FROM by_reading r)
    ORDER BY t.usage_count DESC, t.created_at ASC
    LIMIT p_limit
  )
  SELECT c.id, c.name, c.readings, c.usage_count, c.created_at
  FROM (
    SELECT * FROM exact
    UNION ALL
    SELECT * FROM by_reading
    UNION ALL
    SELECT * FROM by_name
  ) c
  ORDER BY c.priority ASC, c.usage_count DESC, c.created_at ASC
  LIMIT p_limit;
END;
$$;
