---
description: 本番用REST API（Supabase連携）のバックエンド実装ルール
paths:
  - "okiny-web/src/app/api/v1/rankings/route.ts"
  - "okiny-web/src/app/api/v1/rankings/[id]/route.ts"
  - "okiny-web/src/lib/publish/**"
  - "okiny-web/src/lib/supabase-rest.ts"
---

# API ルート規約（本番: Rankings）

## リクエスト/レスポンス

- 入力: Zodスキーマでバリデーション後に処理
- 出力: `NextResponse.json()`（DELETE成功時のみ 204 No Content）
- エラー: 適切なHTTPステータスコードを返す（422, 404, 409, 500）

### レスポンス形式

成功時（GET / POST / PATCH）:
```json
{ "data": { ... } }
```

DELETE成功時:
- **204 No Content**（レスポンスボディなし）

エラー時:
```json
{ "error": { "code": "ERROR_CODE", "message": "説明" } }
```

エラーコード:
| コード | HTTPステータス | 意味 |
|--------|---------------|------|
| `VALIDATION` | 422 | Zodバリデーション失敗・必須パラメータ不足 |
| `NOT_FOUND` | 404 | リソースが存在しない |
| `CONFLICT` | 409 | 楽観ロック不一致 |
| `SERVER` | 500 | サーバー内部エラー |

## 楽観ロック（SSoT）

### PATCH（ボディで受け取る）

1. **リクエスト**: クライアントが `expectedUpdatedAt`（ISO 8601文字列）を**ボディ**に含める
2. **取得**: サーバーがDB上の `updated_at` を取得
3. **比較**: 不一致 → 409 Conflict を返す
4. **実行**: 一致した場合のみ更新を実行
5. **レスポンス**: `{ "data": { ..., "updatedAt": "..." } }` — クライアントはこの値でローカル状態を更新（`supabase-rest.ts` が snake_case → camelCase 変換済み）

### DELETE（クエリ文字列で受け取る）

1. **リクエスト**: `expectedUpdatedAt` と `userId` を**クエリ文字列**で送信
2. **取得**: サーバーがDB上の `updated_at` を取得
3. **比較**: 不一致 → 409 Conflict を返す
4. **実行**: 一致した場合のみ削除を実行
5. **レスポンス**: 204 No Content（ボディなし）

```typescript
// DELETE実装例（[id]/route.ts）
const url = new URL(request.url)
const userId = url.searchParams.get("userId") ?? ""
const expectedUpdatedAt = url.searchParams.get("expectedUpdatedAt") ?? ""
```

## Supabase REST

- `supabase-rest.ts` 経由でアクセス。直接fetchしない
- 環境変数: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- サービスロールキーはサーバーサイドのみ使用（クライアントに露出させない）

## ranking_items 更新パターン

- 更新時: 既存items全DELETE → 新items全INSERT
- 失敗時のロールバック処理が `supabase-rest.ts` に実装済み
- この順序を変更しないこと
