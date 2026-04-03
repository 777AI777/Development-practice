-- ============================================================
-- user_profiles VIEW に links カラムを追加
-- ============================================================
--
-- 目的:
--   user_profiles VIEW に links (JSONB配列) カラムを追加し、
--   ユーザーのリンク情報（SNS等）をプロフィールから取得可能にする。
--
-- 前提条件:
--   - auth.users.raw_user_meta_data に 'links' キーが JSONB配列として格納されている
--   - user_stats VIEW/テーブルが存在する（follower_count, following_count）
--
-- 適用方法:
--   1. Supabase Dashboard > SQL Editor で実行
--   2. 実行前に現在のVIEW定義を確認すること:
--      SELECT pg_get_viewdef('public.user_profiles', true);
--   3. 本番の定義と下記テンプレートに差異があれば、本番に合わせて修正してから実行
--
-- 注意:
--   - links は -> (JSONB保持) を使用。->> (テキスト変換) ではない
--   - CREATE OR REPLACE VIEW は既存カラムの順序・型を変更できない
--   - 新規カラムは必ず末尾に追加すること（途中に挿入するとエラー）
-- ============================================================

-- 現在のVIEW定義を確認（実行前に必ず実施）
-- SELECT pg_get_viewdef('public.user_profiles', true);

CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  au.id,
  COALESCE(
    NULLIF(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(btrim(au.raw_user_meta_data ->> 'name'), ''),
    'ユーザー'
  ) AS display_name,
  au.raw_user_meta_data ->> 'avatar_url' AS avatar_url,
  au.raw_user_meta_data ->> 'display_user_id' AS display_user_id,
  au.raw_user_meta_data ->> 'introduction' AS introduction,
  us.follower_count,
  us.following_count,
  au.raw_user_meta_data -> 'links' AS links
FROM auth.users au
LEFT JOIN user_stats us ON us.user_id = au.id;
