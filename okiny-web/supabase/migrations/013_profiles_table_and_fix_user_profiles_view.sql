-- Migration 013: public.profiles テーブル導入 + user_profiles ビュー修正
--
-- 背景:
--   user_profiles ビューが auth.users を直接参照しており、
--   SECURITY DEFINER が必要なため RLS が無効化されていた。
--   また anon/authenticated への権限 REVOKE が未適用だった。
--
-- 対処:
--   1. public.profiles テーブルを作成（プロフィール情報の置き場を分離）
--   2. auth.users → public.profiles へ既存データを移行
--   3. auth.users の INSERT/UPDATE 時に自動同期する trigger を設定
--   4. user_profiles ビューを public.profiles 参照に変更し SECURITY INVOKER へ
--   5. anon/authenticated の不要な権限を剥奪

-- ============================================================
-- 1. public.profiles テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name    TEXT,
    avatar_url      TEXT,
    display_user_id TEXT UNIQUE,
    introduction    TEXT,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 全員が読める（プロフィールは公開情報）
CREATE POLICY "profiles_read_public"
    ON public.profiles FOR SELECT USING (true);

-- 自分のプロフィールだけ更新できる
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. 既存ユーザーデータを移行
-- ============================================================
INSERT INTO public.profiles (id, display_name, avatar_url, display_user_id, introduction)
SELECT
    au.id,
    NULLIF(TRIM(COALESCE(
        au.raw_user_meta_data->>'display_name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name'
    )), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(LOWER(TRIM(au.raw_user_meta_data->>'display_user_id')), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'introduction'), '')
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. auth.users 更新時に public.profiles へ自動同期する trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, display_user_id, introduction)
    VALUES (
        NEW.id,
        NULLIF(TRIM(COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name'
        )), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
        NULLIF(LOWER(TRIM(NEW.raw_user_meta_data->>'display_user_id')), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'introduction'), '')
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name    = EXCLUDED.display_name,
        avatar_url      = EXCLUDED.avatar_url,
        display_user_id = EXCLUDED.display_user_id,
        introduction    = EXCLUDED.introduction,
        updated_at      = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_upsert
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth();

-- ============================================================
-- 4. user_profiles ビューを public.profiles 参照に変更
--    SECURITY DEFINER を外し SECURITY INVOKER（デフォルト）へ
-- ============================================================
DROP VIEW IF EXISTS public.user_profiles;

CREATE VIEW public.user_profiles
WITH (security_invoker = true) AS
SELECT
    p.id,
    COALESCE(p.display_name, 'ユーザー') AS display_name,
    p.avatar_url,
    p.display_user_id,
    p.introduction,
    COALESCE(us.follower_count, 0)  AS follower_count,
    COALESCE(us.following_count, 0) AS following_count
FROM public.profiles p
LEFT JOIN public.user_stats us ON us.user_id = p.id;

-- ============================================================
-- 5. 権限設定（service_role のみ許可、anon/authenticated は不要）
-- ============================================================
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.user_profiles FROM authenticated;
GRANT SELECT ON public.user_profiles TO service_role;
