CREATE OR REPLACE FUNCTION get_user_tag_usage(p_user_id TEXT, p_limit INT DEFAULT 10)
RETURNS TABLE(
  tag_id UUID,
  tag_name TEXT,
  tag_readings TEXT[],
  tag_usage_count INT,
  tag_created_at TIMESTAMPTZ,
  my_usage_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    t.id, t.name, t.readings, t.usage_count, t.created_at,
    COUNT(r.id) as my_usage_count
  FROM rankings r
  JOIN tags t ON t.id = r.tag_id
  WHERE r.user_id = p_user_id
  GROUP BY t.id
  ORDER BY my_usage_count DESC
  LIMIT p_limit;
$$;
