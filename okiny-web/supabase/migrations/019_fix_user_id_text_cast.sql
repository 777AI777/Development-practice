-- 019: create_ranking / update_ranking RPC の user_id 型不一致を修正
--
-- 変更概要:
--   rankings.user_id カラムは TEXT 型だが、RPC 引数 p_user_id は UUID 型のまま。
--   RPC 内部で `user_id = p_user_id`（text = uuid）の比較が発生し、
--   "operator does not exist: text = uuid" エラーで INSERT / UPDATE が失敗する。
--   カラム型変更（TEXT → UUID）は他テーブルへの波及リスクがあるため行わず、
--   RPC 内部で p_user_id::text にキャストして比較・挿入する形に統一する。
--
-- 修正箇所:
--   ① create_ranking — INSERT の user_id 値を p_user_id::text に変更
--   ② update_ranking — SELECT / UPDATE の WHERE user_id = p_user_id を
--                       WHERE user_id = p_user_id::text に変更（2箇所）
--
-- 注意:
--   - RPC シグネチャ（引数の型）は変更しない（p_user_id UUID のまま）
--   - 楽観ロック（p_expected_updated_at → SQLSTATE 23P01）は維持
--   - SECURITY DEFINER / SET search_path = public は維持

-- ============================================================
-- ① create_ranking RPC
-- ============================================================
-- rankings.user_id は TEXT 型のため、UUID 引数を ::text でキャストして挿入する。

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
  -- user_id は TEXT カラムのため p_user_id::text でキャスト
  INSERT INTO public.rankings (
    user_id,
    title,
    tag_id,
    is_public,
    border_color,
    marker_icon
  )
  VALUES (
    p_user_id::text,
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
-- ② update_ranking RPC（楽観ロック維持）
-- ============================================================
-- p_expected_updated_at が現在の updated_at と不一致の場合は
-- SQLSTATE 23P01 を raise して PostgREST 経由で 409 Conflict を返す。
--
-- rankings.user_id は TEXT 型のため、WHERE 句で p_user_id::text にキャストする。
-- SELECT（楽観ロック取得）と UPDATE の2箇所で修正が必要。

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
  -- user_id は TEXT カラムのため p_user_id::text でキャスト
  SELECT updated_at INTO v_current_updated_at
  FROM public.rankings
  WHERE id = p_id AND user_id = p_user_id::text;

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
  -- user_id は TEXT カラムのため p_user_id::text でキャスト
  UPDATE public.rankings
  SET
    title        = p_title,
    tag_id       = p_tag_id,
    is_public    = p_is_public,
    border_color = p_border_color,
    marker_icon  = p_marker_icon,
    updated_at   = now()
  WHERE id = p_id AND user_id = p_user_id::text;

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
