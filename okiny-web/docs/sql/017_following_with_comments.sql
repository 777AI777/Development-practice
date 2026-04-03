-- ============================================================
-- 017_following_with_comments.sql
-- フォローフィードに最新コメントを含める
--
-- 変更点:
--   1. ranking_comments への LATERAL JOIN で最新1件のコメントを取得
--   2. RETURNS TABLE にコメント4列を追加
--   3. ORDER BY を COALESCE(lc.created_at, r.created_at) に変更
--      → コメントが付いたランキングがフィード上位に浮上する
--   4. カーソル条件も同様に COALESCE ベースに変更
--   5. post_created_at エイリアスを追加（クライアント側カーソル用）
-- ============================================================

-- RETURNS TABLE の列構成が変わるため、既存関数を DROP してから再作成
DROP FUNCTION IF EXISTS public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.list_following_rankings(
  p_viewer_user_id    UUID,
  p_limit             INT DEFAULT 20,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id         UUID DEFAULT NULL
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
  is_bookmarked          BOOLEAN,
  -- コメント関連列（最新1件）
  comment_id             UUID,
  comment_user_id        UUID,
  comment_text           TEXT,
  comment_created_at     TIMESTAMPTZ,
  -- カーソル用: コメントがあればコメント日時、なければランキング作成日時
  post_created_at        TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.user_id::uuid AS user_id,
    r.title,
    r.tag_id::uuid,
    t.name AS tag_name,
    r.is_public,
    r.created_at,
    r.updated_at,
    r.view_count,
    r.impression_count,
    r.bookmark_count,
    -- 上位5件のアイテムを JSONB 配列で取得
    (SELECT jsonb_agg(
              jsonb_build_object('rank', ri.rank, 'item_text', ri.item_text)
              ORDER BY ri.rank
            )
     FROM ranking_items ri
     WHERE ri.ranking_id = r.id AND ri.rank <= 5
    ) AS ranking_items,
    -- 著者情報（フォールバックチェーン）
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      'ユーザー'
    ) AS author_display_name,
    u.raw_user_meta_data->>'avatar_url' AS author_avatar_url,
    u.raw_user_meta_data->>'display_user_id' AS author_display_user_id,
    -- ブックマーク済みフラグ
    EXISTS (
      SELECT 1 FROM bookmarks b
      WHERE b.user_id = p_viewer_user_id AND b.ranking_id = r.id
    ) AS is_bookmarked,
    -- 最新コメント情報（LATERAL JOIN から取得）
    lc.id         AS comment_id,
    lc.user_id    AS comment_user_id,
    lc.comment    AS comment_text,
    lc.created_at AS comment_created_at,
    -- カーソル用ソートキー
    COALESCE(lc.created_at, r.created_at) AS post_created_at
  FROM follows f
  JOIN rankings r
    ON r.user_id::uuid = f.following_id
   AND r.is_public = true
  JOIN auth.users u
    ON u.id = r.user_id::uuid
  LEFT JOIN tags t
    ON t.id = r.tag_id
  -- 各ランキングの最新コメント1件を LATERAL JOIN で取得
  LEFT JOIN LATERAL (
    SELECT rc.id, rc.user_id, rc.comment, rc.created_at
    FROM ranking_comments rc
    WHERE rc.ranking_id = r.id
    ORDER BY rc.created_at DESC
    LIMIT 1
  ) lc ON true
  WHERE f.follower_id = p_viewer_user_id
    -- カーソルページネーション: COALESCE 後の日時でカーソル比較
    AND (
      p_cursor_created_at IS NULL
      OR (COALESCE(lc.created_at, r.created_at), r.id) < (p_cursor_created_at, p_cursor_id)
    )
  -- コメントがあればコメント日時、なければランキング作成日時で降順ソート
  ORDER BY COALESCE(lc.created_at, r.created_at) DESC, r.id DESC
  LIMIT LEAST(p_limit, 50) + 1
$$;

-- 権限設定
REVOKE ALL ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_following_rankings(UUID, INT, TIMESTAMPTZ, UUID) TO service_role;
