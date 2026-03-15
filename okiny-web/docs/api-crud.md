# API CRUD 一覧

対象: `src/app/api/v1/**/route.ts` で実装されている API のみを列挙。
（未実装のAPIは含めていません）

## CRUD マップ（対象リソース + データソース/DB）

| メソッド | パス | 日本語名 | CRUD | 対象リソース | データソース | DB / テーブル |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/rankings` | ランキング一覧取得 | R | rankings | Supabase REST | Supabase: `rankings` → `ranking_items` |
| POST | `/api/v1/rankings` | ランキング作成 | C | rankings | Supabase REST | Supabase: `rankings` → `ranking_items` |
| GET | `/api/v1/rankings/{id}` | ランキング取得 | R | rankings | Supabase REST | Supabase: `rankings` → `ranking_items` |
| PATCH | `/api/v1/rankings/{id}` | ランキング更新 | U | rankings | Supabase REST | Supabase: `rankings` → `ranking_items`(DELETE) → `ranking_items`(INSERT) |
| DELETE | `/api/v1/rankings/{id}` | ランキング削除 | D | rankings | Supabase REST | Supabase: `ranking_items` → `rankings` |

## 競合検知（楽観ロック）

- `PATCH /api/v1/rankings/{id}` と `DELETE /api/v1/rankings/{id}` は `expectedUpdatedAt` を必須とする。
- `expectedUpdatedAt` が最新の `updated_at` と一致しない場合は `409 Conflict` を返す。

## DB構成（参考）

### Supabase（公開ランキングの永続化）

- `rankings`:
  - `id`, `user_id`, `title`, `tag_id`, `created_at`, `updated_at`
- `ranking_items`:
  - `id`, `ranking_id`, `rank`, `item_text`
- リレーション:
  - `ranking_items.ranking_id` → `rankings.id`

### IndexedDB（下書き・ローカル保存）

※ 下書きは API 経由ではなくクライアント内で完結。

- DB名: `okiny-local`
- store: `drafts`（keyPath: `draftId`, index: `userId`）
