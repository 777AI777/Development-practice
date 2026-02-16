# API設計（タスク管理）

**前提**
- 用語は Backlog 準拠で「課題（チケット）」「子課題（タスク）」「マイルストーン」を使用する。
- WBS 階層は「プロジェクト → 課題（チケット） → 子課題（タスク）」の2段。
- 進捗は予定ベース（完了した予定時間 ÷ 予定時間合計）。
- 日付は `YYYY-MM-DD` もしくは `YYYY-MM-DD HH:MM:SS`。
- JSON のキーは `snake_case`。

**ベースURL**
- `/api/v1`

**認証**
- `Authorization: Bearer <token>` を利用するトークン方式。
- ログインでトークン発行、ログアウトで無効化。
- 認証不要: `POST /auth/login`, `POST /users`（ユーザー登録）。

**共通レスポンス（エラー）**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力に誤りがあります",
    "details": ["username is required"]
  }
}
```

**共通クエリ**
- 一覧系は `limit` / `offset` をサポート（省略時 `limit=20`, `offset=0`）。

---

## 認証

### `POST /api/v1/auth/login`
**目的**
- ユーザー名とパスワードでログインし、トークンを発行する。

**リクエスト**
- Body:
```json
{
  "username": "alice",
  "password": "secret"
}
```

**レスポンス**
- 200:
```json
{
  "token": "token_xxx",
  "user": {
    "id": 1,
    "username": "alice"
  }
}
```
- エラー: `400`（必須不足）, `401`（認証失敗）

### `POST /api/v1/auth/logout`
**目的**
- トークンを無効化してログアウトする。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "message": "ok" }
```
- エラー: `401`（未認証）

---

## ユーザー

### `POST /api/v1/users`
**目的**
- ユーザー登録（ユーザー名＋パスワードのみ）。

**リクエスト**
- Body:
```json
{
  "username": "alice",
  "password": "secret"
}
```

**レスポンス**
- 201:
```json
{
  "id": 1,
  "username": "alice",
  "created_at": "2026-02-01 10:00:00"
}
```
- エラー: `400`（重複や必須不足）

### `GET /api/v1/users`
**目的**
- ユーザー一覧を取得する（チーム追加用）。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{
  "items": [
    {"id": 1, "username": "alice"},
    {"id": 2, "username": "bob"}
  ],
  "limit": 20,
  "offset": 0,
  "total": 2
}
```
- エラー: `401`

---

## チーム

### `POST /api/v1/teams`
**目的**
- チームを作成する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "name": "開発チーム" }
```

**レスポンス**
- 201:
```json
{
  "id": 10,
  "name": "開発チーム",
  "created_at": "2026-02-01 10:00:00"
}
```
- エラー: `400`, `401`

### `GET /api/v1/teams`
**目的**
- 自分が所属するチーム一覧を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "items": [{"id": 10, "name": "開発チーム"}] }
```
- エラー: `401`

### `GET /api/v1/teams/{team_id}`
**目的**
- チーム詳細を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "id": 10, "name": "開発チーム" }
```
- エラー: `401`, `404`

### `PATCH /api/v1/teams/{team_id}`
**目的**
- チーム名を更新する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "name": "新チーム名" }
```

**レスポンス**
- 200:
```json
{ "id": 10, "name": "新チーム名" }
```
- エラー: `400`, `401`, `404`

### `DELETE /api/v1/teams/{team_id}`
**目的**
- チームを削除する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "message": "ok" }
```
- エラー: `401`, `404`

---

## チームメンバー

### `GET /api/v1/teams/{team_id}/members`
**目的**
- チームメンバー一覧を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{
  "items": [
    {"user_id": 1, "username": "alice", "role": "admin"},
    {"user_id": 2, "username": "bob", "role": "member"}
  ]
}
```
- エラー: `401`, `404`

### `POST /api/v1/teams/{team_id}/members`
**目的**
- チームにユーザーを追加する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "user_id": 2, "role": "member" }
```

**レスポンス**
- 201:
```json
{ "team_id": 10, "user_id": 2, "role": "member" }
```
- エラー: `400`, `401`, `404`

### `PATCH /api/v1/teams/{team_id}/members/{user_id}`
**目的**
- メンバー権限を変更する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "role": "admin" }
```

**レスポンス**
- 200:
```json
{ "team_id": 10, "user_id": 2, "role": "admin" }
```
- エラー: `400`, `401`, `404`

### `DELETE /api/v1/teams/{team_id}/members/{user_id}`
**目的**
- チームからメンバーを削除する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "message": "ok" }
```
- エラー: `401`, `404`

---

## プロジェクト

### `POST /api/v1/teams/{team_id}/projects`
**目的**
- チーム配下にプロジェクトを作成する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "name": "タスク管理", "description": "WBS管理" }
```

**レスポンス**
- 201:
```json
{
  "id": 100,
  "team_id": 10,
  "name": "タスク管理",
  "description": "WBS管理"
}
```
- エラー: `400`, `401`, `404`

### `GET /api/v1/teams/{team_id}/projects`
**目的**
- チーム配下のプロジェクト一覧を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "items": [{"id": 100, "name": "タスク管理"}] }
```
- エラー: `401`, `404`

### `GET /api/v1/projects/{project_id}`
**目的**
- プロジェクト詳細を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "id": 100, "name": "タスク管理", "description": "WBS管理" }
```
- エラー: `401`, `404`

### `PATCH /api/v1/projects/{project_id}`
**目的**
- プロジェクトを更新する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "name": "新プロジェクト名", "description": "説明" }
```

**レスポンス**
- 200:
```json
{ "id": 100, "name": "新プロジェクト名" }
```
- エラー: `400`, `401`, `404`

### `DELETE /api/v1/projects/{project_id}`
**目的**
- プロジェクトを削除する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "message": "ok" }
```
- エラー: `401`, `404`

---

## マイルストーン

### `POST /api/v1/projects/{project_id}/milestones`
**目的**
- マイルストーンを作成する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "name": "実装",
  "planned_start": "2026-02-01",
  "planned_end": "2026-02-10",
  "display_order": 1
}
```

**レスポンス**
- 201:
```json
{
  "id": 200,
  "project_id": 100,
  "name": "実装",
  "planned_start": "2026-02-01",
  "planned_end": "2026-02-10",
  "display_order": 1
}
```
- エラー: `400`, `401`, `404`

### `GET /api/v1/projects/{project_id}/milestones`
**目的**
- マイルストーン一覧を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "items": [{"id": 200, "name": "実装"}] }
```
- エラー: `401`, `404`

### `GET /api/v1/milestones/{milestone_id}`
**目的**
- マイルストーン詳細を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "id": 200, "name": "実装" }
```
- エラー: `401`, `404`

### `PATCH /api/v1/milestones/{milestone_id}`
**目的**
- マイルストーンを更新する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "name": "テスト", "display_order": 2 }
```

**レスポンス**
- 200:
```json
{ "id": 200, "name": "テスト", "display_order": 2 }
```
- エラー: `400`, `401`, `404`

### `DELETE /api/v1/milestones/{milestone_id}`
**目的**
- マイルストーンを削除する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "message": "ok" }
```
- エラー: `401`, `404`

---

## 課題（チケット）・子課題（タスク）

### `POST /api/v1/projects/{project_id}/issues`
**目的**
- 課題（チケット）または子課題（タスク）を作成する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "parent_issue_id": null,
  "title": "認証API",
  "status": "未着手",
  "planned_start": "2026-02-01",
  "planned_end": "2026-02-03",
  "planned_minutes": 180,
  "actual_minutes": 0,
  "priority": 1,
  "milestone_id": 200,
  "assignee_user_id": 1,
  "daily_reset_flag": 0
}
```

**レスポンス**
- 201:
```json
{ "id": 300, "project_id": 100, "title": "認証API" }
```
- エラー: `400`, `401`, `404`

### `GET /api/v1/projects/{project_id}/issues`
**目的**
- 課題・子課題の一覧を取得する（フィルタ対応）。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Query: `parent_issue_id`, `status`, `milestone_id`, `assignee_user_id`, `planned_start_from`, `planned_end_to`, `priority`

**レスポンス**
- 200:
```json
{
  "items": [
    {
      "id": 300,
      "parent_issue_id": null,
      "title": "認証API",
      "status": "未着手",
      "planned_start": "2026-02-01",
      "planned_end": "2026-02-03",
      "planned_minutes": 180,
      "priority": 1
    }
  ]
}
```
- エラー: `401`, `404`

### `GET /api/v1/issues/{issue_id}`
**目的**
- 課題・子課題の詳細を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{
  "id": 300,
  "project_id": 100,
  "parent_issue_id": null,
  "title": "認証API",
  "status": "未着手",
  "planned_start": "2026-02-01",
  "planned_end": "2026-02-03",
  "planned_minutes": 180,
  "actual_minutes": 0,
  "priority": 1,
  "milestone_id": 200,
  "assignee_user_id": 1,
  "daily_reset_flag": 0
}
```
- エラー: `401`, `404`

### `PATCH /api/v1/issues/{issue_id}`
**目的**
- 課題・子課題を更新する（状態変更、予定、実績、担当、タグ付け等）。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "status": "完了",
  "actual_minutes": 200,
  "completed_at": "2026-02-03 18:00:00"
}
```

**レスポンス**
- 200:
```json
{ "id": 300, "status": "完了" }
```
- エラー: `400`, `401`, `404`

### `DELETE /api/v1/issues/{issue_id}`
**目的**
- 課題・子課題を削除する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "message": "ok" }
```
- エラー: `401`, `404`

---

## タグ

### `POST /api/v1/teams/{team_id}/tags`
**目的**
- タグを作成する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "name": "重要", "color": "#FF9900" }
```

**レスポンス**
- 201:
```json
{ "id": 500, "team_id": 10, "name": "重要", "color": "#FF9900" }
```
- エラー: `400`, `401`, `404`

### `GET /api/v1/teams/{team_id}/tags`
**目的**
- タグ一覧を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "items": [{"id": 500, "name": "重要", "color": "#FF9900"}] }
```
- エラー: `401`, `404`

### `PATCH /api/v1/tags/{tag_id}`
**目的**
- タグを更新する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "name": "要対応", "color": "#FF0000" }
```

**レスポンス**
- 200:
```json
{ "id": 500, "name": "要対応", "color": "#FF0000" }
```
- エラー: `400`, `401`, `404`

### `DELETE /api/v1/tags/{tag_id}`
**目的**
- タグを削除する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "message": "ok" }
```
- エラー: `401`, `404`

### `POST /api/v1/issues/{issue_id}/tags`
**目的**
- 課題・子課題にタグを付与する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "tag_id": 500 }
```

**レスポンス**
- 201:
```json
{ "issue_id": 300, "tag_id": 500 }
```
- エラー: `400`, `401`, `404`

### `DELETE /api/v1/issues/{issue_id}/tags/{tag_id}`
**目的**
- 課題・子課題からタグを外す。

**リクエスト**
- Headers: `Authorization: Bearer <token>`

**レスポンス**
- 200:
```json
{ "message": "ok" }
```
- エラー: `401`, `404`

---

## 進捗集計（予定ベース）

### `GET /api/v1/projects/{project_id}/progress`
**目的**
- プロジェクト進捗を予定時間ベースで取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Query: `scope`（`project`/`milestone`/`issue`）

**レスポンス**
- 200:
```json
{
  "scope": "project",
  "total_planned_minutes": 600,
  "completed_planned_minutes": 300,
  "progress_rate": 0.5
}
```
- エラー: `401`, `404`

### `GET /api/v1/projects/{project_id}/progress/weekly`
**目的**
- 週次の完了数と予定消化量を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Query: `week_start`（例: `2026-02-02`）

**レスポンス**
- 200:
```json
{
  "week_start": "2026-02-02",
  "completed_count": 4,
  "completed_planned_minutes": 240
}
```
- エラー: `400`, `401`, `404`

---

## ビュー取得（ガント・一覧・未着手一覧）

### `GET /api/v1/projects/{project_id}/views/gantt`
**目的**
- ガントチャート用のデータを取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Query: `from`, `to`（日付範囲）

**レスポンス**
- 200:
```json
{
  "milestones": [
    {"id": 200, "name": "実装", "planned_start": "2026-02-01", "planned_end": "2026-02-10"}
  ],
  "issues": [
    {"id": 300, "title": "認証API", "planned_start": "2026-02-01", "planned_end": "2026-02-03"}
  ]
}
```
- エラー: `401`, `404`

### `GET /api/v1/projects/{project_id}/views/list`
**目的**
- 一覧ビュー用に期日順のデータを取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Query: `from`, `to`, `status`

**レスポンス**
- 200:
```json
{
  "items": [
    {"id": 300, "title": "認証API", "planned_end": "2026-02-03", "status": "未着手"}
  ]
}
```
- エラー: `401`, `404`

### `GET /api/v1/projects/{project_id}/views/backlog`
**目的**
- 未着手一覧（バックログ）を取得する。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Query: `limit`, `offset`

**レスポンス**
- 200:
```json
{
  "items": [
    {"id": 301, "title": "API設計", "priority": 1, "planned_start": null, "planned_end": null}
  ]
}
```
- エラー: `401`, `404`

---

## 運用・バッチ

### `POST /api/v1/maintenance/daily-reset`
**目的**
- デイリータスクを未完了に戻す（運用/バッチ専用）。

**リクエスト**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{ "target_date": "2026-02-03" }
```

**レスポンス**
- 200:
```json
{ "reset_count": 12 }
```
- エラー: `400`, `401`

---

## 要確認事項
- 認証方式はトークン固定でよいか、セッション方式が必要か。
- トークン有効期限やリフレッシュの要否。
- WBS 階層は2段固定でよいか。
- 状態（`status`）の取り得る値は `未着手/進行中/完了` 固定でよいか。
- 優先度のスケール（例: 1〜5）と「小さいほど高い」ルールでよいか。
- 未着手一覧（バックログ）は「予定日未設定 + 優先度順」で十分か。
- チーム参加は「管理者が追加」方式でよいか。
- デイリータスクのリセット実行タイミングと実行主体（バッチ/API）の定義。
- 週次実績の集計起点は `completed_at` でよいか、週の開始曜日定義。
