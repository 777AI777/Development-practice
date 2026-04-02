-- 017: タグ検索の readings ひらがな対応 + embedding 類似検索 RPC

-- Fix: by_reading CTE にひらがなパターンも追加（カタカナのみだったのを両対応に）
-- Fix: FROM tags → FROM tag_popularity（migration 007 で usage_count カラム削除済みのため）
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
    FROM tag_popularity t
    WHERE t.name = p_query
    LIMIT 1
  ),
  by_reading AS (
    SELECT t.id, t.name, t.readings, t.usage_count, t.created_at, 2 AS priority
    FROM (
      SELECT DISTINCT ON (t2.id) t2.id, t2.name, t2.readings, t2.usage_count, t2.created_at
      FROM tag_popularity t2, unnest(t2.readings) AS reading
      WHERE (reading ILIKE (p_katakana_query || '%')
          OR reading ILIKE (p_query || '%'))
      AND t2.id NOT IN (SELECT e.id FROM exact e)
      ORDER BY t2.id
    ) t
    ORDER BY t.usage_count DESC, t.created_at ASC
    LIMIT p_limit
  ),
  by_name AS (
    SELECT t.id, t.name, t.readings, t.usage_count, t.created_at, 3 AS priority
    FROM tag_popularity t
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

-- embedding ベクトルを使ったタグ類似検索 RPC
-- p_query_embedding: クエリテキストの 768 次元ベクトル（Gemini text-embedding-004）
-- p_threshold: コサイン類似度の最低閾値（デフォルト 0.5）
-- embedding が NULL のタグはスキップ
CREATE OR REPLACE FUNCTION public.search_tags_by_embedding(
  p_query_embedding vector(768),
  p_threshold float8 DEFAULT 0.5,
  p_limit int DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  readings text[],
  usage_count int,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.name,
    t.readings,
    COALESCE(tp.usage_count, 0)::int AS usage_count,
    t.created_at
  FROM public.tags t
  LEFT JOIN public.tag_popularity tp ON tp.id = t.id
  WHERE t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> p_query_embedding) >= p_threshold
  ORDER BY t.embedding <=> p_query_embedding
  LIMIT p_limit;
$$;
