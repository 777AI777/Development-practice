-- =============================================================================
-- インプレッション（impression_count）機能追加
-- 実行環境: Supabase Dashboard → SQL Editor
-- 実行順序: Step 1 → Step 2 → Step 3 の順に実行すること
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: rankings テーブルに impression_count カラムを追加
-- -----------------------------------------------------------------------------
ALTER TABLE rankings ADD COLUMN impression_count INTEGER NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------------------
-- Step 2: バッチインクリメントRPC
-- 複数の ranking_id を受け取り、各ランキングの impression_count を +1 する。
-- フロント側で一覧表示時にビューポートに入った ranking_id を収集し、
-- まとめてこの RPC を呼ぶ想定。
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_impression_count(p_ranking_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rankings
  SET impression_count = impression_count + 1
  WHERE id = ANY(p_ranking_ids);
END;
$$;

-- RPC のアクセス制御: 認証ユーザーのみ実行可能
REVOKE ALL ON FUNCTION public.increment_impression_count(UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_impression_count(UUID[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_impression_count(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_impression_count(UUID[]) TO service_role;

-- -----------------------------------------------------------------------------
-- Step 3: list_public_rankings_by_tag RPC を更新
-- 戻り値に impression_count を追加する。
-- 既存の関数を DROP してから再作成（シグネチャは同じだが RETURNS TABLE が変わるため）。
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.list_public_rankings_by_tag(UUID);

CREATE OR REPLACE FUNCTION public.list_public_rankings_by_tag(
  p_tag_id UUID
)
RETURNS TABLE(
  id UUID,
  user_id TEXT,
  title TEXT,
  tag_id UUID,
  tag_name TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  view_count INT,
  bookmark_count INT,
  impression_count INT,
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
    COALESCE(r.bookmark_count, 0)::INT AS bookmark_count,
    COALESCE(r.impression_count, 0)::INT AS impression_count,
    COALESCE(
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
      ),
      '[]'::jsonb
    ) AS ranking_items,
    COALESCE(up.display_name, 'ユーザー') AS author_display_name,
    up.avatar_url AS author_avatar_url,
    up.display_user_id AS author_display_user_id,
    EXISTS (
      SELECT 1
      FROM bookmarks b
      WHERE b.ranking_id = r.id
        AND b.user_id::text = auth.uid()::text
    ) AS is_bookmarked
  FROM rankings r
  JOIN tags t ON t.id = r.tag_id
  LEFT JOIN user_profiles up ON up.id::text = r.user_id::text
  WHERE r.is_public = true
    AND r.tag_id = p_tag_id
    AND r.user_id::text <> auth.uid()::text
  ORDER BY r.created_at DESC;
$$;

-- RPC のアクセス制御（再設定）
REVOKE ALL ON FUNCTION public.list_public_rankings_by_tag(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_public_rankings_by_tag(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_public_rankings_by_tag(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_rankings_by_tag(UUID) TO service_role;

-- -----------------------------------------------------------------------------
-- RLS について
-- impression_count は rankings テーブルの通常カラムなので、
-- 既存の RLS ポリシー（SELECT / INSERT / UPDATE / DELETE）がそのまま適用される。
-- 追加の RLS ポリシーは不要。
--
-- increment_impression_count RPC は SECURITY DEFINER で実行されるため、
-- RLS をバイパスして直接 UPDATE する。認証ユーザーのみ GRANT で制御済み。
-- -----------------------------------------------------------------------------
