---
description: okiny-webフロントエンドのUI・React・状態管理規約
paths:
  - "okiny-web/src/**"
---

# okiny-web ソースコード規約

## React / Next.js

- App Router使用。ページは `app/` 配下にディレクトリベースで配置
- Server ComponentsとClient Componentsを明確に分離（`"use client"` ディレクティブ）
- `route.ts` でAPIルートを定義（GET, POST, PATCH, DELETE）

## 状態管理

- グローバル状態: LocalStorage + React hooks
- 下書き: IndexedDB（Repository Pattern経由）
- サーバーデータ: APIルート経由でSupabase REST

## Zod v4 型安全

**重要**: このプロジェクトは Zod v4系（^4.1.13）を使用。v3との非互換に注意。

- `z.object()`, `z.string()` 等の基本APIは同じ
- 型推論: `z.infer<typeof schema>` を推奨
- `any` や `as` によるキャストは禁止。Zodの型推論を信頼する
- エラーハンドリング: v4では `ZodError` の構造が異なる。`error.issues` を使う
- `RankingItems = [string, string, string, string, string]`（5つ固定タプル）
- API入出力は必ずZodスキーマで定義すること

## フラグ制御

- `features.ts` のフラグで機能の表示/非表示を制御
- `ENABLE_SNS_EXPANSION`: false → SNS系ルート/UIが全て非表示
- `SHOW_STATE_SCREENS`: production以外は自動ON
- Phase2機能のコードは残すがフラグOFF時にアクセス不可にする
- 新しいフラグを追加する場合は `features.ts` に集約

## テスト

- **Vitest** のみ使用（React Testing Libraryは未導入）
- テストファイル: `*.test.ts` で配置
- IndexedDBテストには `fake-indexeddb` を使用
- 現状テストはユニットテストのみ（lib/drafts/, lib/publish/ 配下）
- `npm run test` で実行、`npm run test:watch` でwatch mode
