# OKINY — プロジェクトガイド

## 1. Purpose (The Why)

「好き」を整理・共有するランキングアプリ。
Phase1: 個人利用（CRUD + 下書き + タグ検索）。
Phase2: SNS化（フィード・フォロー・リアクション）。

## 2. Repo Map & Progressive Context (The Map)

```
Development-practice/
├── okiny-web/                # メインアプリ（Next.js App Router）
│   ├── CLAUDE.md             # 危険ゾーンガイド（Critical Files詳細はここ）
│   ├── src/
│   │   ├── app/              # ページ + APIルート
│   │   │   └── api/v1/       # 本番API（rankings）
│   │   ├── components/       # 共通UIコンポーネント
│   │   ├── hooks/            # カスタムHooks
│   │   └── lib/              # ビジネスロジック・ユーティリティ
│   └── docs/                 # 設計ドキュメント・デザイン資産
├── docs/memory/              # 成功事例ログ（MEMORY.mdから退避した記録）
├── .claude/                  # Rules・Skills・Scripts（自動読み込み対象）
│   ├── rules/                # パス別詳細ルール（api, coding-style, figma-make, git-workflow, orchestration, security, testing等）
│   └── skills/               # カスタムスキル（figma-sync, figma-analyze, figma-fix, figma-pipeline, update-registry）
├── CLAUDE.md                 # ← このファイル
└── MEMORY.md                 # 教訓・課題・未探索領域（運用規則はここに記載）
```

### Progressive Contextの読み込み順

1. **CLAUDE.md（本ファイル）** — 全体像・Tech Stack・ルール
2. **MEMORY.md** — 教訓・課題・未探索領域
3. **okiny-web/CLAUDE.md** — 危険ゾーン・フロントエンド固有事項
4. **.claude/rules/** — パス別の詳細ルール（自動ロード）
   - `api.md` — 楽観ロック・APIルール
   - `coding-style.md` — イミュータビリティ・ファイル分割・エラー処理・品質チェックリスト
   - `figma-make.md` — Figma Make / Tailwind v4 ガードレール
   - `figma-routing.md` — Figma タスク自動ルーティング
   - `git-workflow.md` — コミット規約・PR・実装ワークフロー
   - `okiny-web.md` — okiny-web 固有ルール
   - `orchestration.md` — エージェントオーケストレーション（SSoT）
   - `security.md` — セキュリティチェック・シークレット管理
   - `testing.md` — カバレッジ80%・TDD必須・Vitest
5. **docs/memory/** — 成功事例ログ（MEMORY.mdから退避した過去記録。通常は参照不要）

## 3. Workflow Rules

- タスクを受けたら、自律的な探索やコード変更を始める前に、まず確認の質問をすること。ファイル読み込みに30秒以上かけず、アプローチをユーザーに確認してから着手する。
- 変更は最小限かつ焦点を絞る。依頼された範囲を超えてスコープを拡大しないこと。追加変更が必要と判断した場合は、先に確認する。
- ツール（Bash, Edit, Write等）を呼び出す**前に**、そのツールが何をするか・実行するとどうなるかを日本語テキストで簡潔に説明すること。ユーザーが許可プロンプトで判断できるようにする目的。説明なしにいきなりツールを呼ばない。

## 4. Tech Stack & Commands

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript | 5.9.3 |
| CSS | Tailwind CSS v4（@theme inline必須） | ^4 |
| Validation | Zod | ^4.1.13 (v4系) |
| DB | Supabase (REST API直接) | — |
| Local Storage | IndexedDB (okiny-local) | — |
| Test | Vitest | ^4.0.8 |
| D&D | @dnd-kit | ^6.3 |
| Rate Limit | @upstash/ratelimit + redis | ^2.0 |
| Auth SSR | @supabase/ssr | ^0.9 |
| Design | Figma Make + Pencil (.pen) | — |

> CSS生成時はTailwind v4構文を必ず使うこと。TSXファイル編集時は、文字エンコーディング（特に日本語文字）を正確に保持すること。

```bash
cd okiny-web
npm install          # 初回セットアップ（.env.local の設定も必要 → Environment Variables参照）

npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run lint         # ESLint実行
npm run start        # プロダクションサーバー起動
npm run test         # Vitest実行（run mode）
npm run test:watch   # Vitest（watch mode）
```

### API Endpoints（本番: Rankings）

| Method | Path | Description | 楽観ロック |
|--------|------|-------------|-----------|
| GET | `/api/v1/rankings` | 一覧取得（tagIdフィルタ可） | — |
| POST | `/api/v1/rankings` | 新規作成 | — |
| GET | `/api/v1/rankings/{id}` | 詳細取得 | — |
| PATCH | `/api/v1/rankings/{id}` | 更新 | `expectedUpdatedAt` 必須 |
| DELETE | `/api/v1/rankings/{id}` | 削除 | `expectedUpdatedAt` 必須 |
| POST | `/api/v1/rankings/{id}/views` | 閲覧数記録（24h重複排除） | — |
| POST | `/api/v1/rankings/impressions` | インプレッション一括記録（レート制限あり） | — |
| GET | `/api/v1/bookmarks` | ブックマーク一覧取得 | — |
| POST | `/api/v1/bookmarks/{rankingId}` | ブックマーク追加（冪等） | — |
| DELETE | `/api/v1/bookmarks/{rankingId}` | ブックマーク削除（冪等） | — |
| GET | `/api/v1/tags` | タグ一覧・検索（`?q=`） | — |
| POST | `/api/v1/tags` | タグ新規作成 | — |
| GET | `/api/v1/tags/search` | タグ検索 | — |
| GET | `/api/v1/tags/mine` | 自分のタグ一覧 | — |
| GET | `/api/v1/tags/popular` | 人気タグ一覧 | — |
| GET | `/api/v1/tags/bootstrap` | タグ初期化（ユーザータグ+人気タグ統合） | — |
| GET | `/api/v1/users/check-availability` | 表示用ユーザーID利用可否確認 | — |
| GET | `/api/v1/users/{userId}` | ユーザープロフィール公開取得 | — |
| GET | `/api/v1/og/rankings/{id}` | OGP画像生成 | — |
| GET | `/api/auth/callback` | OAuthコールバック（PKCE） | — |

### 楽観ロック

詳細は `.claude/rules/api.md` にSSoTとして定義。概要:
PATCH/DELETEでは `expectedUpdatedAt` を送信 → 不一致で 409 Conflict。

## 5. Architectural Rules (The Rules)

### DB Schema

**Supabase:**
- `rankings`: id (UUID), user_id, title, tag_id (→ tags.id), is_public (BOOLEAN), view_count, impression_count, bookmark_count, created_at, updated_at
- `ranking_items`: id, ranking_id (→ rankings.id), rank, item_text
- `tags`: id (UUID), name (UNIQUE), readings (TEXT[]), created_at
- `bookmarks`: user_id, ranking_id (→ rankings.id) — 複合PK
- `user_profiles` (VIEW): id, display_name (フォールバックチェーン), avatar_url, display_user_id
- `tag_popularity` (VIEW): id, name, readings, created_at, usage_count (rankingsから動的集計)
- trigger: `update_ranking()` / `delete_ranking()` で楽観ロック（`expectedUpdatedAt`不一致 → エラーコード 23P01）
- RPC: `search_tags_unified()`, `get_user_tag_usage()`, `list_public_rankings_by_tag()`, `increment_impression_count()`, `append_tag_readings()`

**IndexedDB:**
- DB: `okiny-local` (version: 2), Store: `drafts` / `autosave`
- keyPath: `draftId` (drafts), composite `userId:key` (autosave)
- index: `userId`
- 上限: 1ユーザーあたり5件（`MAX_DRAFTS_PER_USER`）
- autosave: ランキングフォームの編集状態を自動保存（公開前の作業データ）

### Tags

DB管理（`tags` テーブル）。ユーザーが新規作成可能。デフォルトタグ: movie(映画), music(音楽), travel(旅行), cafe(カフェ), cosmetics(化粧品), daily(日用品)。
バリデーション: `tag-validation.ts`（Zodスキーマ + 禁止ワード検査）。読み方自動取得: Yahoo Furigana API。

### Session

- Supabase Auth (Google OAuth) を使用
- cookieベースのセッション管理
- middleware.ts でセッションリフレッシュ + 未認証リダイレクト
- クライアント: `src/lib/supabase/client.ts`
- サーバー: `src/lib/supabase/server.ts`
- 認証ガード: `src/lib/supabase/auth-guard.ts`

### Environment Variables

| 変数 | 用途 | デフォルト |
|------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | — (必須) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (クライアント・サーバー共通) | — (必須) |
| `NEXT_PUBLIC_APP_URL` | アプリのベースURL（OAuthリダイレクト等） | — (必須) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（公開ランキング取得等） | — (必須) |
| `YAHOO_CLIENT_ID` | Yahoo ふりがなAPI クライアントID | — (必須) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL（レート制限） | — (必須) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST トークン（レート制限） | — (必須) |
| `VERCEL_PROJECT_PRODUCTION_URL` | Vercel本番URL（自動設定） | Vercel自動 |
| `VERCEL_URL` | Vercelデプロイ先URL（自動設定） | Vercel自動 |

### Key Patterns

- **Immutable更新**: ミューテーション禁止、常にスプレッドで新規作成 → 詳細: `.claude/rules/coding-style.md`
- **Repository Pattern**: drafts/はinterface → IndexedDB実装
- **HTTP Client**: publish/にシングルトン、エラーコード体系あり
- **RankingForm**: autosave（1200ms debounce）+ unload警告 → 詳細: `okiny-web/CLAUDE.md`
- **Toast**: キューイング方式、type: success/error/warning/info

### Design Assets

- `.pen` ファイル: Pencil互換JSON。UIモック定義
- `figma-make/`: Figma Makeから同期したReactコンポーネント
- デザイン仕様は `okiny-web/docs/design/figma-make/guidelines/Guidelines.md`

## 6. Agent Orchestration（最重要）

メインエージェントは **オーケストレーター** に徹する。自ら調査・コード変更をしない。

→ 詳細ルール・パイプライン定義は `.claude/rules/orchestration.md` を参照（SSoT）。

## 7. Core Principles (The Workflows)

1. **Plan & Verify**: 変更前に影響範囲を確認。楽観ロック・型定義・フラグの副作用を把握してから着手
2. **Simplicity First**: 最小限の変更で目的を達成。不要な抽象化・先回り実装は避ける
3. **SSoT (Single Source of Truth)**: 情報は1箇所に定義し、他はポインタで参照。重複定義は禁止
