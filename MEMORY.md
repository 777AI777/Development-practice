# OKINY — 共有メモリ

> **AIへの厳格な運用ルール:**
> - このファイルは200行以内を維持すること。超過時は `docs/memory/success-logs.md` に退避
> - 「成功した判断」はここに書かない。成功バイアスを排除し、教訓・失敗パターンを優先記録
> - 未探索領域・現在の課題を常に先頭付近に配置。解決してもチェック済みで残す
> - コンベンション（コミット規約等）はルートCLAUDE.mdや.claude/rulesで管理。ここには書かない

> auto memoryが先頭200行を自動読込する。未探索・課題を上部に配置。

## 未探索領域

- [ ] テストカバレッジが不明（Vitestは入っているがカバレッジ計測未設定）
- [ ] Supabase RLS（Row Level Security）の設定状況が未確認
- [ ] CI/CD パイプラインが未構築（GitHub Actions等）
- [ ] Google OAuth認証の実装（現在はMock認証）
- [ ] エラーバウンダリの実装状況
- [ ] レスポンシブ対応の完成度
- [ ] パフォーマンス計測（Core Web Vitals）

## 現在の課題

- Phase1の機能実装は概ね完了しているが、本番認証が未実装
- SNS機能（Phase2）はMock APIで画面だけ先行実装済み
- [x] ~~figma-make.config.jsonのパスが実際のディレクトリ構造と不一致~~ → 解消済み

## 教訓とアンチパターン

### Tailwind CSS v4 + @theme inline

- `:root` にCSS変数を追加しただけではTailwindクラスに反映されない
- `@theme inline` ブロックで `--color-*` へのマッピングが必須
- 例: `:root { --foreground: #1a1a1a }` → `@theme inline { --color-foreground: var(--foreground) }`
- 詳細は `.claude/rules/figma-make.md` 参照

### 楽観ロック（Optimistic Concurrency）

- PATCH/DELETEで `expectedUpdatedAt` を送り忘れると409にならず不整合が起きる
- `supabase-rest.ts` の `ConflictError` を必ずキャッチすること
- 更新後はレスポンスの `updatedAt` でクライアント側の値を必ず更新（`supabase-rest.ts` が snake→camelCase変換済み）
- **SSoT**: `.claude/rules/api.md` の楽観ロック5ステップを参照

### IndexedDB 下書き管理

- 上限5件（`MAX_DRAFTS_PER_USER`）を超えると `DraftLimitError`
- `draftId` はUUID、`userId` でインデックス
- 公開（publish）成功時にドラフトを削除する処理を忘れないこと
- fake-indexeddb はテスト用（vitest環境で使用）

### .pen ファイル編集

- JSON形式だがBOM付きだと読めない（UTF-8 BOMなし必須）
- `version` フィールドを変更すると `Unsupported file format`
- `id` の重複で表示が壊れる（画面prefixで回避）
- 大量追加は2-4画面単位で検証しながら進める

### Zod v4 注意

- Zod v4系（^4.1.13）を使用。v3とはAPI互換性がない部分あり
- `z.object()`, `z.string()` 等の基本は同じだが、エラーハンドリングが異なる
- 詳細は `.claude/rules/okiny-web.md` 参照

### Mock/本番 境界の混同（アンチパターン）

- `api/v1/` 配下にMock API（Phase2）と本番API（Rankings）が混在している
- Mock APIに本番品質のバリデーションやエラーハンドリングを実装しない
- 本番APIの修正時にMock APIを参考にしない（設計思想が異なる）

## デグレパターン

- ランキング更新後に一覧画面の表示が古いままになる（キャッシュ問題）
  - → 更新後にrevalidateOrリロードが必要
- 下書き保存のautosaveと手動保存の競合
  - → debounce 1200msの間に手動保存すると二重書き込み

## 成功した判断

→ 詳細は `docs/memory/success-logs.md` に退避済み
