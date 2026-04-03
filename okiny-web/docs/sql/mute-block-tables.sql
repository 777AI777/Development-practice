-- ============================================================
-- ミュート・ブロック機能用テーブル定義
-- Phase2: SNS化に伴うユーザー間関係管理
-- ============================================================

-- ============================================================
-- 1. mutes テーブル
-- ============================================================
CREATE TABLE mutes (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, muted_id),
  CHECK (user_id <> muted_id)
);

CREATE INDEX idx_mutes_user_id ON mutes(user_id);

-- ============================================================
-- 2. blocks テーブル
-- ============================================================
CREATE TABLE blocks (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blocked_id),
  CHECK (user_id <> blocked_id)
);

CREATE INDEX idx_blocks_user_id ON blocks(user_id);
CREATE INDEX idx_blocks_blocked_id ON blocks(blocked_id);

-- ============================================================
-- 3. RLS ポリシー — mutes
-- ============================================================
ALTER TABLE mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mutes"
  ON mutes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mutes"
  ON mutes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own mutes"
  ON mutes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. RLS ポリシー — blocks
-- ============================================================
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
  ON blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can check if blocked by someone"
  ON blocks FOR SELECT USING (auth.uid() = blocked_id);
CREATE POLICY "Users can insert own blocks"
  ON blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own blocks"
  ON blocks FOR DELETE USING (auth.uid() = user_id);
