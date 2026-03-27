-- One-off manual SQL for replacing legacy mock user IDs in public.rankings.
-- This is not a migration. Edit the VALUES block, then run in Supabase SQL Editor.

-- 1. Find legacy non-UUID user IDs still stored in rankings.
SELECT
  user_id,
  COUNT(*) AS ranking_count
FROM public.rankings
WHERE user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
GROUP BY user_id
ORDER BY ranking_count DESC, user_id;

-- 2. Replace the mapping below with the real Supabase Auth UUID(s).
BEGIN;

CREATE TEMP TABLE user_id_mapping (
  old_user_id TEXT PRIMARY KEY,
  new_user_id TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO user_id_mapping (old_user_id, new_user_id)
VALUES
  ('user-google-001', 'REPLACE_WITH_REAL_SUPABASE_AUTH_UUID');

-- 3. Verify every target UUID actually exists in auth.users.
SELECT
  m.old_user_id,
  m.new_user_id,
  au.id IS NOT NULL AS auth_user_exists,
  COUNT(r.id) AS affected_rankings
FROM user_id_mapping m
LEFT JOIN auth.users au
  ON au.id::TEXT = m.new_user_id
LEFT JOIN public.rankings r
  ON r.user_id = m.old_user_id
GROUP BY m.old_user_id, m.new_user_id, au.id
ORDER BY m.old_user_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM user_id_mapping m
    LEFT JOIN auth.users au
      ON au.id::TEXT = m.new_user_id
    WHERE au.id IS NULL
  ) THEN
    RAISE EXCEPTION 'At least one new_user_id does not exist in auth.users.';
  END IF;
END $$;

-- 4. Update rankings ownership.
UPDATE public.rankings r
SET user_id = m.new_user_id
FROM user_id_mapping m
WHERE r.user_id = m.old_user_id;

-- 5. Verify the replacement before commit.
SELECT
  id,
  user_id,
  title,
  created_at
FROM public.rankings
WHERE user_id IN (SELECT new_user_id FROM user_id_mapping)
ORDER BY created_at DESC;

SELECT
  user_id,
  COUNT(*) AS ranking_count
FROM public.rankings
WHERE user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
GROUP BY user_id
ORDER BY ranking_count DESC, user_id;

COMMIT;

-- If you also kept mock user IDs in other public tables such as bookmarks,
-- run the same old_user_id -> new_user_id replacement there as a separate step.
