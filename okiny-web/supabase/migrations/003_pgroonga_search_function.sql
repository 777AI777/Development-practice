CREATE OR REPLACE FUNCTION search_tags_by_reading(query TEXT)
RETURNS SETOF tags
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT t.* FROM tags t, unnest(t.readings) AS reading
  WHERE reading ILIKE (query || '%')
  ORDER BY t.usage_count DESC, t.created_at ASC;
$$;
