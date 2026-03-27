-- Human-readable user IDs for profile URLs and user search.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'auth_users_display_user_id_format_check'
  ) THEN
    ALTER TABLE auth.users
      ADD CONSTRAINT auth_users_display_user_id_format_check
      CHECK (
        btrim(coalesce(raw_user_meta_data ->> 'display_user_id', '')) = ''
        OR lower(btrim(raw_user_meta_data ->> 'display_user_id')) ~ '^[a-z0-9_]{3,20}$'
      ) NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS auth_users_display_user_id_key
  ON auth.users ((lower(btrim(raw_user_meta_data ->> 'display_user_id'))))
  WHERE btrim(coalesce(raw_user_meta_data ->> 'display_user_id', '')) <> '';

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
  NULLIF(lower(btrim(au.raw_user_meta_data ->> 'display_user_id')), '') AS display_user_id
FROM auth.users au;

GRANT SELECT ON TABLE public.user_profiles TO anon;
GRANT SELECT ON TABLE public.user_profiles TO authenticated;
GRANT SELECT ON TABLE public.user_profiles TO service_role;
