-- 004_add_missing_indexes.sql
-- パフォーマンス改善: 不足しているインデックスの追加
--
-- 注: 以下のインデックスはDB作成時に自動生成済みのため、ここでは追加しない
--   - ranking_items_ranking_id_idx (ranking_items.ranking_id)
--   - rankings_user_id_updated_at_idx (rankings.user_id, updated_at DESC)

-- HIGH: rankings.user_id — ほぼ全APIで使用される WHERE user_id = ? の高速化
CREATE INDEX IF NOT EXISTS idx_rankings_user_id
  ON rankings(user_id);

-- MEDIUM: rankings.tag_id — タグフィルタ検索の高速化
CREATE INDEX IF NOT EXISTS idx_rankings_tag_id
  ON rankings(tag_id);

-- MEDIUM: tags.name — タグ名検索 (ILIKE) の高速化
CREATE INDEX IF NOT EXISTS idx_tags_name
  ON tags(name);
