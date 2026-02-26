# 継続率改善の計測設計

## 目的

- 初回価値到達（Time to First Publish）を短縮する。
- D1/D7再訪を可視化し、投稿・反応ループの改善点を特定する。

## KPI

| 指標 | 定義 | 目標方向 |
|---|---|---|
| Time to First Publish | 初回ログインから初回公開までの時間 | 短縮 |
| D1 Retention | 翌日に再訪したユーザー比率 | 向上 |
| D7 Retention | 7日後に再訪したユーザー比率 | 向上 |
| 投稿/セッション | 1セッションあたり投稿数 | 向上 |
| 反応/セッション | 1セッションあたりLike/Save数 | 向上 |

## イベント定義

| Event | 発火タイミング | 主なプロパティ |
|---|---|---|
| `login_success` | ログイン成功時 | `user_id`, `provider`, `entry_route` |
| `ranking_create_start` | 作成フォーム表示時 | `user_id`, `source` (`list`,`draft`,`feed`) |
| `ranking_publish_success` | 公開成功時 | `user_id`, `ranking_id`, `tag_id` |
| `draft_save_success` | 下書き保存成功時 | `user_id`, `draft_id`, `tag_id` |
| `return_visit_d1` | D1再訪判定時 | `user_id`, `days_since_last_visit` |
| `feed_open` | Feed表示時 | `user_id`, `tab` (`for-you`,`following`) |
| `reaction_sent` | Like/Save実行時 | `user_id`, `ranking_id`, `reaction_type` |

## 計測ポイント（現行コード対応）

- `src/app/login/page.tsx`
  - ログイン成功時に `login_success`。
- `src/app/rankings/new/page.tsx`
  - 初回描画時に `ranking_create_start`。
  - 公開成功時に `ranking_publish_success`。
  - 下書き保存成功時に `draft_save_success`。
- `src/app/feed/page.tsx`
  - 表示時に `feed_open`。
- `src/app/feed/[id]/page.tsx`
  - Like/Save成功時に `reaction_sent`。

## 実装メモ

- まずは `console` または `localStorage` ベースでイベント送信インターフェースを実装し、後で分析基盤に差し替える。
- イベント名とプロパティ名は固定し、画面改修時も互換を維持する。
- PII（メール等）はイベントに含めない。
