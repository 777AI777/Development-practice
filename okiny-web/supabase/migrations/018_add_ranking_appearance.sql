-- 018: ランキング外観カラム追加 + create_ranking / update_ranking RPC に対応パラメータ追加
--
-- 変更概要:
--   ① rankings テーブルに border_color / marker_icon カラムを追加（既存行はデフォルト値が入る）
--   ② create_ranking RPC を再定義（p_border_color, p_marker_icon パラメータ追加）
--   ③ update_ranking RPC を再定義（p_border_color, p_marker_icon パラメータ追加。楽観ロック維持）
--
-- 注意:
--   - NOT NULL DEFAULT のため既存行への影響なし
--   - アプリ側（supabase-rest.ts）はすでに p_border_color / p_marker_icon を渡す実装済み
--   - 楽観ロック（p_expected_updated_at → 23P01 エラーコード）は既存通り維持

-- ============================================================
-- ① rankings テーブルにカラム追加
-- ============================================================

ALTER TABLE public.rankings
  ADD COLUMN IF NOT EXISTS border_color TEXT NOT NULL DEFAULT '#883333',
  ADD COLUMN IF NOT EXISTS marker_icon  TEXT NOT NULL DEFAULT 'Heart';

-- ============================================================
-- ② create_ranking RPC
-- ============================================================
-- 既存 RPC を CREATE OR REPLACE で上書き。
-- p_border_color / p_marker_icon を末尾に追加（後方互換: DEFAULT 付き）。

CREATE OR REPLACE FUNCTION public.create_ranking(
  p_user_id    UUID,
  p_title      TEXT,
  p_tag_id     UUID,
  p_items      JSONB,
  p_is_public  BOOLEAN,
  p_border_color TEXT DEFAULT '#FFE5E5',
  p_marker_icon  TEXT DEFAULT 'Heart'
)
RETURNS TABLE (id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ranking_id UUID;
  v_item       JSONB;
BEGIN
  -- rankings 行を挿入
  INSERT INTO public.rankings (
    user_id,
    title,
    tag_id,
    is_public,
    border_color,
    marker_icon
  )
  VALUES (
    p_user_id,
    p_title,
    p_tag_id,
    p_is_public,
    p_border_color,
    p_marker_icon
  )
  RETURNING rankings.id INTO v_ranking_id;

  -- ranking_items を一括挿入
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.ranking_items (ranking_id, rank, item_text)
    VALUES (
      v_ranking_id,
      (v_item ->> 'rank')::INT,
      v_item ->> 'item_text'
    );
  END LOOP;

  RETURN QUERY SELECT v_ranking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_ranking(UUID, TEXT, UUID, JSONB, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_ranking(UUID, TEXT, UUID, JSONB, BOOLEAN, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_ranking(UUID, TEXT, UUID, JSONB, BOOLEAN, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ranking(UUID, TEXT, UUID, JSONB, BOOLEAN, TEXT, TEXT) TO service_role;

-- ============================================================
-- ③ update_ranking RPC（楽観ロック維持）
-- ============================================================
-- p_expected_updated_at が現在の updated_at と不一致の場合は
-- SQLSTATE 23P01 を raise して PostgREST 経由で 409 Conflict を返す。

CREATE OR REPLACE FUNCTION public.update_ranking(
  p_id                   UUID,
  p_user_id              UUID,
  p_title                TEXT,
  p_tag_id               UUID,
  p_items                JSONB,
  p_is_public            BOOLEAN,
  p_expected_updated_at  TIMESTAMPTZ,
  p_border_color         TEXT DEFAULT '#FFE5E5',
  p_marker_icon          TEXT DEFAULT 'Heart'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_updated_at TIMESTAMPTZ;
  v_item               JSONB;
BEGIN
  -- 楽観ロック: 現在の updated_at を取得（所有者チェック込み）
  SELECT updated_at INTO v_current_updated_at
  FROM public.rankings
  WHERE id = p_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ranking not found or not owned by user'
      USING ERRCODE = 'P0002';
  END IF;

  -- updated_at 不一致 → 409 相当のエラーコードで返す
  IF v_current_updated_at <> p_expected_updated_at THEN
    RAISE EXCEPTION 'conflict: ranking was modified by another request'
      USING ERRCODE = '23P01';
  END IF;

  -- rankings を更新
  UPDATE public.rankings
  SET
    title        = p_title,
    tag_id       = p_tag_id,
    is_public    = p_is_public,
    border_color = p_border_color,
    marker_icon  = p_marker_icon,
    updated_at   = now()
  WHERE id = p_id AND user_id = p_user_id;

  -- ranking_items を差し替え（全 DELETE → 再挿入）
  DELETE FROM public.ranking_items WHERE ranking_id = p_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.ranking_items (ranking_id, rank, item_text)
    VALUES (
      p_id,
      (v_item ->> 'rank')::INT,
      v_item ->> 'item_text'
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.update_ranking(UUID, UUID, TEXT, UUID, JSONB, BOOLEAN, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_ranking(UUID, UUID, TEXT, UUID, JSONB, BOOLEAN, TIMESTAMPTZ, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_ranking(UUID, UUID, TEXT, UUID, JSONB, BOOLEAN, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ranking(UUID, UUID, TEXT, UUID, JSONB, BOOLEAN, TIMESTAMPTZ, TEXT, TEXT) TO service_role;
