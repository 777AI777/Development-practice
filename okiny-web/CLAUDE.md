# okiny-web — 危険ゾーンガイド

> このファイルはokiny-web固有の「触ると壊れやすい箇所」をまとめたもの。
> 全体ルールはルートの `CLAUDE.md` を、API詳細は `.claude/rules/api.md` を参照。

## Critical Files（変更時は要注意）

### Global Types & Configs（変更が全体に波及）

| ファイル | 役割 | 注意点 |
|---------|------|--------|
| `src/lib/types.ts` | 型定義 | 多数のファイルが依存。変更時は `supabase-rest.ts`, `drafts/`, `publish/`, 全page.tsx を確認 |
| `src/lib/tag-utils.ts` | タグ名正規化（NFKC）・表示ラベル取得 | tag-validation, tag-combobox, API が依存 |
| `src/lib/tag-validation.ts` | Zodスキーマ + 禁止ワード検査 | フロント・API両方で使用 |
| `src/lib/analytics.ts` | イベント計測 | イベント名変更は計測ダッシュボードに影響 |
| `src/app/api/og/rankings/[id]/route.tsx` | OGP画像生成 | 公開共有ページのメタ画像。フォント・レイアウト変更時は実機確認必須 |

### Core Logic（バグが直結）

| ファイル | 役割 | 注意点 |
|---------|------|--------|
| `src/lib/supabase-rest.ts` | Supabase REST直接アクセス | SDKなし。`ConflictError`で楽観ロック制御。ranking_items更新はDELETE→POST（全件削除→再挿入）。失敗時はロールバック付き |
| `src/lib/supabase/` | Supabase Auth認証基盤 | client.ts(ブラウザ), server.ts(APIルート), middleware.ts(セッション更新), auth-guard.ts(認証検証)。cookie操作はmiddlewareとserver clientが担当 |
| `src/lib/publish/` | 公開APIクライアント | シングルトンHTTPクライアント。エラーコード体系あり |
| `src/hooks/use-tags.ts` | タグ取得・検索フック（300ms debounce） | tag-combobox が依存 |
| `src/components/tag-combobox.tsx` | タグ選択・検索・新規作成UI | use-tags, tag-validation, tag-utils に依存 |
| `src/lib/rate-limit.ts` | APIレート制限（Upstash Redis） | 全APIルートで使用。UPSTASH_REDIS_REST_URL/TOKEN が必要 |

### Local State（データ消失リスク）

| ファイル | 役割 | 注意点 |
|---------|------|--------|
| `src/lib/drafts/` | IndexedDB下書き管理 | Repository Pattern。上限5件。公開後のドラフト削除忘れに注意 |

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
| `/onboarding` | オンボーディング | main |
| `/share/rankings/[id]` | ランキング公開共有 | public |
| `/privacy` | プライバシーポリシー | legal |
| `/terms` | 利用規約 | legal |

## 楽観ロック

→ `.claude/rules/api.md` にSSoTとして定義。ここには書かない。

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
