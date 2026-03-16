CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  readings TEXT[] NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tags_name_unique UNIQUE (name)
);

CREATE INDEX idx_tags_usage_count ON tags (usage_count DESC);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_select_all" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_insert_authenticated" ON tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tags_update_readings" ON tags
  FOR UPDATE USING (false)
  WITH CHECK (false);

INSERT INTO tags (name, readings) VALUES
  ('映画', ARRAY['エイガ']),
  ('音楽', ARRAY['オンガク']),
  ('旅行', ARRAY['リョコウ']),
  ('カフェ', ARRAY['カフェ']),
  ('化粧品', ARRAY['ケショウヒン']),
  ('日用品', ARRAY['ニチヨウヒン']);

-- RPC function for appending readings (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION append_tag_readings(
  p_tag_id UUID,
  p_new_readings TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tags
  SET readings = (
    SELECT ARRAY(SELECT DISTINCT unnest(readings || p_new_readings))
  )
  WHERE id = p_tag_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.tag_id IS DISTINCT FROM NEW.tag_id THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
