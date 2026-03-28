-- ① follows テーブル
CREATE TABLE public.follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX follows_following_id_idx ON public.follows(following_id);

-- ② RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_authenticated"
  ON public.follows FOR SELECT TO authenticated USING (true);

CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- ③ user_stats テーブル（キャッシュカラム）
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_count INT NOT NULL DEFAULT 0,
  following_count INT NOT NULL DEFAULT 0
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- user_stats は service_role のみ書き込み（トリガー経由）、認証ユーザーは読み取りのみ
CREATE POLICY "user_stats_select_authenticated"
  ON public.user_stats FOR SELECT TO authenticated USING (true);

-- ④ follows → user_stats 更新トリガー
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- フォロー先のフォロワー数+1
    INSERT INTO user_stats (user_id, follower_count, following_count)
    VALUES (NEW.following_id, 1, 0)
    ON CONFLICT (user_id) DO UPDATE SET follower_count = user_stats.follower_count + 1;
    -- フォロー元のフォロー数+1
    INSERT INTO user_stats (user_id, follower_count, following_count)
    VALUES (NEW.follower_id, 0, 1)
    ON CONFLICT (user_id) DO UPDATE SET following_count = user_stats.following_count + 1;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_stats SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = OLD.following_id;
    UPDATE user_stats SET following_count = GREATEST(0, following_count - 1) WHERE user_id = OLD.follower_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER follows_update_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- ⑤ user_profiles VIEW 再定義（follower_count / following_count 追加）
-- 既存定義（008_add_display_user_id_to_user_profiles.sql）に user_stats を LEFT JOIN して拡張
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  au.id,
  COALESCE(
    NULLIF(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(btrim(au.raw_user_meta_data ->> 'name'), ''),
    'ユーザー'
  ) AS display_name,
  NULLIF(btrim(au.raw_user_meta_data ->> 'avatar_url'), '') AS avatar_url,
  NULLIF(lower(btrim(au.raw_user_meta_data ->> 'display_user_id')), '') AS display_user_id,
  COALESCE(us.follower_count, 0) AS follower_count,
  COALESCE(us.following_count, 0) AS following_count
FROM auth.users au
LEFT JOIN user_stats us ON us.user_id = au.id;

-- 既存と同じ GRANT 設定を維持
REVOKE ALL ON TABLE public.user_profiles FROM anon;
REVOKE ALL ON TABLE public.user_profiles FROM authenticated;
GRANT SELECT ON TABLE public.user_profiles TO service_role;

-- ⑥ list_following_rankings RPC
CREATE OR REPLACE FUNCTION public.list_following_rankings(
  p_viewer_user_id UUID
)
RETURNS TABLE (
  id                     UUID,
  user_id                UUID,
  title                  TEXT,
  tag_id                 UUID,
  tag_name               TEXT,
  is_public              BOOLEAN,
  created_at             TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ,
  view_count             INT,
  impression_count       INT,
  bookmark_count         INT,
  ranking_items          JSONB,
  author_display_name    TEXT,
  author_avatar_url      TEXT,
  author_display_user_id TEXT,
  is_bookmarked          BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id, r.user_id, r.title, r.tag_id,
    t.name AS tag_name,
    r.is_public, r.created_at, r.updated_at,
    r.view_count, r.impression_count, r.bookmark_count,
    (SELECT jsonb_agg(jsonb_build_object('rank', ri.rank, 'item_text', ri.item_text) ORDER BY ri.rank)
     FROM ranking_items ri WHERE ri.ranking_id = r.id AND ri.rank <= 5) AS ranking_items,
    COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'ユーザー') AS author_display_name,
    u.raw_user_meta_data->>'avatar_url' AS author_avatar_url,
    u.raw_user_meta_data->>'display_user_id' AS author_display_user_id,
    EXISTS (SELECT 1 FROM bookmarks b WHERE b.user_id = p_viewer_user_id AND b.ranking_id = r.id) AS is_bookmarked
  FROM follows f
  JOIN rankings r ON r.user_id = f.following_id AND r.is_public = true
  JOIN auth.users u ON u.id = r.user_id
  LEFT JOIN tags t ON t.id = r.tag_id
  WHERE f.follower_id = p_viewer_user_id
  ORDER BY r.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.list_following_rankings(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_following_rankings(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_following_rankings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_following_rankings(UUID) TO service_role;
