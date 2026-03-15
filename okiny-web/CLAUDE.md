# okiny-web — 危険ゾーンガイド

> このファイルはokiny-web固有の「触ると壊れやすい箇所」をまとめたもの。
> 全体ルールはルートの `CLAUDE.md` を、API詳細は `.claude/rules/api.md` を参照。

## Critical Files（変更時は要注意）

### Global Types & Configs（変更が全体に波及）

| ファイル | 役割 | 注意点 |
|---------|------|--------|
| `src/lib/types.ts` | 型定義 | 多数のファイルが依存。変更時は `supabase-rest.ts`, `drafts/`, `publish/`, 全page.tsx を確認 |
| `src/lib/tags.ts` | 固定タグ定義 | DB上のtag_idと1:1対応。追加・削除はDB側と同期必須 |
| `src/lib/route-map.ts` | ルーティング定義 | ナビゲーション全体が依存。パス変更時は `app/` 配下の対応ディレクトリも同期 |
| `src/lib/features.ts` | フラグ制御 | フラグ変更はアプリ全体の表示に影響 |
| `src/lib/analytics.ts` | イベント計測 | イベント名変更は計測ダッシュボードに影響 |

### Core Logic（バグが直結）

| ファイル | 役割 | 注意点 |
|---------|------|--------|
| `src/lib/supabase-rest.ts` | Supabase REST直接アクセス | SDKなし。`ConflictError`で楽観ロック制御。ranking_items更新はDELETE→POST（全件削除→再挿入）。失敗時はロールバック付き |
| `src/lib/supabase/` | Supabase Auth認証基盤 | client.ts(ブラウザ), server.ts(APIルート), middleware.ts(セッション更新), auth-guard.ts(認証検証)。cookie操作はmiddlewareとserver clientが担当 |
| `src/lib/publish/` | 公開APIクライアント | シングルトンHTTPクライアント。エラーコード体系あり |

### Local State（データ消失リスク）

| ファイル | 役割 | 注意点 |
|---------|------|--------|
| `src/lib/drafts/` | IndexedDB下書き管理 | Repository Pattern。上限5件。公開後のドラフト削除忘れに注意 |
| `src/lib/social/mock-social-store.ts` | SNS Mockデータ | インメモリ。Phase2本実装時にSupabase連携に切替予定 |

## ページ構造

| パス | 画面 | グループ |
|------|------|---------|
| `/login` | ログイン | main |
| `/rankings` | ランキング一覧 | main |
| `/rankings/new` | ランキング作成 | main |
| `/rankings/[id]` | ランキング詳細 | main |
| `/rankings/[id]/edit` | ランキング編集 | main |
| `/rankings/[id]/delete` | 削除確認 | main |
| `/search` | タグ検索 | main |
| `/drafts` | 下書き一覧 | main |
| `/settings` | 設定 | main |
| `/settings/logout` | ログアウト確認 | main |
| `/feed`, `/composer`, `/profile/[userId]`, `/notifications`, `/onboarding` | SNS系 | sns（フラグ制御） |
| `/states/*` | UI状態デモ | states（dev時のみ） |

> 全ルート定義: `src/lib/route-map.ts`

## 楽観ロック

→ `.claude/rules/api.md` にSSoTとして定義。ここには書かない。

## Mock API 混在警告

> **禁止**: Mock API（Phase2 SNS用）と本番API（Rankings）を同一品質で扱うこと。

- `src/app/api/v1/rankings/` — **本番**（Supabase連携、楽観ロック、Zodバリデーション）
- `src/app/api/v1/rankings/[id]/comments/` — **Mock**（インメモリ、rankings配下だがSNS機能）
- `src/app/api/v1/rankings/[id]/reactions/` — **Mock**（同上）
- `src/app/api/v1/feed/`, `follows/`, `profiles/` — **Mock**（インメモリ）
- `ENABLE_SNS_EXPANSION=false` の時、Mock API系の**画面・導線は非表示**（APIルート自体は残る。バックエンド側にフラグガードなし）
- Mock APIに本番品質のバリデーションやエラーハンドリングを実装しない
- 本番APIの修正時にMock APIの実装を参考にしない

## フロントエンド固有の複雑性

### IndexedDB操作

- DB名: `okiny-local`, Store: `drafts`
- `MAX_DRAFTS_PER_USER = 5` — 超過で `DraftLimitError`
- Repository Pattern: `draft-repository.ts`(interface) → `indexeddb-draft-repository.ts`(実装)
- シングルトン: `client-repository.ts` の `draftRepository` を使う
- 公開成功後のドラフト削除を忘れると下書き枠が埋まっていく
- テスト時は `fake-indexeddb` を使用

### RankingForm autosave

- LocalStorageに1200ms debounceで自動保存
- `beforeunload` イベントで未保存警告
- 手動保存と自動保存の競合に注意（debounce中の手動保存で二重書き込みの可能性）

### Tailwind CSS v4

- `:root` のCSS変数だけではTailwindクラスに反映されない
- `@theme inline` でのマッピングが必須
- 詳細は `.claude/rules/figma-make.md` 参照

## Progressive Context: 参照先一覧

| 情報 | 参照先 |
|------|--------|
| プロジェクト全体 | ルート `CLAUDE.md` |
| 教訓・課題 | `MEMORY.md` |
| API実装ルール・楽観ロック | `.claude/rules/api.md` |
| フロントエンドUI規約 | `.claude/rules/okiny-web.md` |
| Figma Make | `.claude/rules/figma-make.md` |
| デザイン仕様 | `okiny-web/docs/design/figma-make/guidelines/Guidelines.md` |
| 画面遷移 | `okiny-web/docs/screen-transition.md` |
| 要件定義 | `okiny-web/docs/requirements/要件定義.md` |
