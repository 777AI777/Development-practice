# OKINY — 成功事例ログ

> MEMORY.md の肥大化を防ぐため、成功した判断・事例はここに退避する。
> 新規追加時はカテゴリ別に整理し、日付とコンテキストを記載すること。

## アーキテクチャ判断

### Supabase SDK不使用 → REST直接アクセス（2025-01 Phase1初期設計）

- バンドルサイズ削減に成功
- `supabase-rest.ts` に集約することでAPI層の見通しも良好

### Repository Patternで下書き管理（2025-01 Phase1初期設計）

- `draft-repository.ts`(interface) → `indexeddb-draft-repository.ts`(実装)
- テスタビリティ向上: `fake-indexeddb` でのテストが容易

### フラグ制御でPhase2機能を先行実装（2025-02 Phase2画面プロトタイプ）

- `ENABLE_SNS_EXPANSION` フラグで表示切替
- UIの全体像を早期に確認可能にしつつ、本番には影響させない
