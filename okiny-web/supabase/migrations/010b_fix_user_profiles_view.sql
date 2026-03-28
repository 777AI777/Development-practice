-- Fix: user_profiles VIEW に introduction カラムを追加する。
-- 既存の VIEW は follower_count / following_count のみで introduction が欠落。
-- CREATE OR REPLACE では列順変更不可のため、DROP → CREATE で再定義する。

DROP VIEW IF EXISTS public.user_profiles;

CREATE VIEW public.user_profiles AS
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
  NULLIF(btrim(au.raw_user_meta_data ->> 'introduction'), '') AS introduction,
  COALESCE(us.follower_count, 0) AS follower_count,
  COALESCE(us.following_count, 0) AS following_count
FROM auth.users au
LEFT JOIN public.user_stats us ON us.user_id = au.id;

-- 権限設定を維持
REVOKE ALL ON TABLE public.user_profiles FROM anon;
REVOKE ALL ON TABLE public.user_profiles FROM authenticated;
GRANT SELECT ON TABLE public.user_profiles TO service_role;
