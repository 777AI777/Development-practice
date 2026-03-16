ALTER TABLE rankings ADD COLUMN tag_id_new UUID;

WITH mapping(old_id, new_name) AS (VALUES
  ('movie', '映画'), ('music', '音楽'), ('travel', '旅行'),
  ('cafe', 'カフェ'), ('cosmetics', '化粧品'), ('daily', '日用品')
)
UPDATE rankings r
SET tag_id_new = t.id
FROM mapping m JOIN tags t ON t.name = m.new_name
WHERE r.tag_id = m.old_id;

ALTER TABLE rankings DROP COLUMN tag_id;
ALTER TABLE rankings RENAME COLUMN tag_id_new TO tag_id;
ALTER TABLE rankings ALTER COLUMN tag_id SET NOT NULL;
ALTER TABLE rankings ADD CONSTRAINT fk_rankings_tag_id
  FOREIGN KEY (tag_id) REFERENCES tags(id);

UPDATE tags SET usage_count = (
  SELECT COUNT(*) FROM rankings WHERE rankings.tag_id = tags.id
);

CREATE TRIGGER trg_rankings_tag_usage
  AFTER INSERT OR UPDATE OF tag_id OR DELETE ON rankings
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();
