-- =============================================================
-- 007: タグ人気順をマスタカラムからランキング集計に移行
-- =============================================================

-- 1. Read model VIEW: タグ + ランキング集計の人気度
CREATE OR REPLACE VIEW tag_popularity AS
SELECT
  t.id,
  t.name,
  t.readings,
  t.created_at,
  COALESCE(r.cnt, 0)::INT AS usage_count
FROM tags t
LEFT JOIN (
  SELECT tag_id, COUNT(*) AS cnt
  FROM rankings
  GROUP BY tag_id
) r ON r.tag_id = t.id;

-- authenticated ロールに VIEW の読み取り権限を付与（REST API 経由でアクセスするため必須）
GRANT SELECT ON tag_popularity TO authenticated;

-- 2. search_tags_unified を VIEW 参照に更新
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
      SELECT DISTINCT ON (t2.id) t2.*
      FROM tag_popularity t2, unnest(t2.readings) AS reading
      WHERE reading ILIKE (p_katakana_query || '%')
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

-- 3. get_user_tag_usage を VIEW 参照に更新（tag_usage_count を集計値に）
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
    tp.id,
    tp.name,
    tp.readings,
    tp.usage_count,
    tp.created_at,
    COUNT(r.id) as my_usage_count
  FROM rankings r
  JOIN tag_popularity tp ON tp.id = r.tag_id
  WHERE r.user_id = p_user_id
  GROUP BY tp.id, tp.name, tp.readings, tp.usage_count, tp.created_at
  ORDER BY my_usage_count DESC
  LIMIT p_limit;
$$;

-- 4. トリガー削除
DROP TRIGGER IF EXISTS trg_rankings_tag_usage ON rankings;

-- 5. トリガー関数削除
DROP FUNCTION IF EXISTS update_tag_usage_count();

-- 6. 旧検索関数削除（006_unified_tag_search で置き換え済み）
DROP FUNCTION IF EXISTS search_tags_by_reading(TEXT);

-- 7. usage_count インデックス削除
DROP INDEX IF EXISTS idx_tags_usage_count;

-- 8. tags テーブルから usage_count カラム削除
ALTER TABLE tags DROP COLUMN IF EXISTS usage_count;
