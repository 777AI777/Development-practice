-- Migration 016: tags.embedding の次元数を 1536 → 768 に変更（Gemini text-embedding-004 対応）
--
-- Gemini API の text-embedding-004 は 768 次元を出力する。
-- 015 で vector(1536) として作成したカラムを再作成する。

-- 既存カラムを削除してインデックスごと作り直す
ALTER TABLE public.tags DROP COLUMN IF EXISTS embedding;

ALTER TABLE public.tags ADD COLUMN embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_tags_embedding
  ON public.tags USING hnsw (embedding vector_cosine_ops);
