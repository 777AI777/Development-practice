-- ranking_comments テーブル
CREATE TABLE ranking_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id  UUID NOT NULL REFERENCES rankings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  comment     TEXT NOT NULL CHECK (char_length(comment) <= 140),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス: あるランキングの最新コメント取得に最適化
CREATE INDEX idx_ranking_comments_ranking_created
  ON ranking_comments (ranking_id, created_at DESC);

-- インデックス: ユーザーのコメント一覧
CREATE INDEX idx_ranking_comments_user_id
  ON ranking_comments (user_id, created_at DESC);

-- RLS
ALTER TABLE ranking_comments ENABLE ROW LEVEL SECURITY;

-- 閲覧: 公開ランキングのコメントは誰でも読める
CREATE POLICY "ranking_comments_select"
  ON ranking_comments FOR SELECT
  USING (true);

-- 挿入: 自分のコメントのみ
CREATE POLICY "ranking_comments_insert"
  ON ranking_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 削除: 自分のコメントのみ
CREATE POLICY "ranking_comments_delete"
  ON ranking_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 更新: 不許可（コメントはINSERT-only設計）
CREATE POLICY "ranking_comments_update"
  ON ranking_comments FOR UPDATE
  USING (false);
