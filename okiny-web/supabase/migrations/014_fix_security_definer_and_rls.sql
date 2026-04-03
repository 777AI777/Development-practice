-- Migration 014: tag_popularity SECURITY DEFINER 除去 + spatial_ref_sys RLS 有効化
--
-- 対処:
--   ③ tag_popularity ビューの SECURITY DEFINER を外す（公開データのみなので INVOKER で動作する）
--   ④ spatial_ref_sys（PostGIS システムテーブル）の RLS を有効化し lint 警告を解消する

-- ============================================================
-- ③ tag_popularity — SECURITY DEFINER を外す
-- ============================================================
CREATE OR REPLACE VIEW public.tag_popularity
WITH (security_invoker = true) AS
SELECT
    t.id,
    t.name,
    t.readings,
    t.created_at,
    (COALESCE(r.cnt, (0)::bigint))::integer AS usage_count
FROM tags t
LEFT JOIN (
    SELECT rankings.tag_id, count(*) AS cnt
    FROM rankings
    GROUP BY rankings.tag_id
) r ON r.tag_id = t.id;

-- ④ spatial_ref_sys は supabase_admin 所有の PostGIS 拡張テーブル。
--    Supabase 管理環境では ownership 変更・RLS 有効化が不可。
--    ユーザーデータなし・実害ゼロのため lint 警告は許容ノイズとして放置。
