# UI リフレッシュ TODO（Phase1 未着手機能）

## 背景
figma-make側がUI要件のSSoT。今回のリフレッシュではUI反映で完結する部分のみ実装し、バックエンド実装が必要な機能はここに記録して後続対応とする。

## 対応方針
- UIのみで完結する部分 → 即実装
- バックエンド必須（DB/API/外部連携） → 本ファイルに記載し、後続PRで対応

## TODO一覧

### 1. スレッド機能（知恵袋型Q&A・防音壁モデル）
- figma-make画面: ThreadListScreen, ThreadDetailScreen, ThreadCreateScreen, ThreadAnswerScreen
- 必要: DBスキーマ（threads, thread_answers）、API (`/api/v1/threads/*`)、防音壁ロジック
- 優先度: 高（Phase1主要機能）

### 2. 今日のお題
- 運営発の全体質問配信
- 必要: 管理側投稿基盤、配信スケジューラ
- 優先度: 中

### 3. おすすめテーマ
- 運営発 + ユーザー発のテーマ表示
- 必要: 推薦アルゴリズム、ランキング計算バッチ
- 優先度: 中

### 4. 投稿時レコメンド
- 投稿作成時のサジェスト
- 必要: サジェストAPI、外部DB連携（Phase2でSpotify/TMDB連携）
- 優先度: 中

### 5. 自己分析ツール（ポイント消費型・段階解放）
- figma-make画面: SelfAnalysisMenuScreen, SelfAnalysisResultScreen
- 必要: ユーザー投稿の集計ロジック、段階解放ロジック、ポイント消費連携
- 優先度: 高（差別化機能）

### 6. ポイントシステム
- figma-make画面: PointPurchaseScreen, PointHistoryScreen
- 必要: 決済基盤（Stripe等）、ポイント残高DB、取引履歴DB
- 優先度: 高

### 7. プレミアムプラン（月額550円）
- figma-make画面: PremiumPlanScreen
- 必要: サブスク決済、機能ゲート
- 優先度: 高

### 8. AdMobバナー広告
- 必要: AdMob SDK、広告配信制御
- 優先度: 中

### 9. プッシュ通知
- figma-make画面: NotificationListScreen, NotificationSettingsScreen
- 必要: Web Push、通知配信基盤、通知DB
- 優先度: 高

### 10. 投稿統計画面
- figma-make画面: PostStatsScreen
- 必要: 詳細な閲覧/インプレッション集計API
- 優先度: 低（MVP後）

### 11. 投稿詳細「もっと見つける」セクション
- figma-make: RankingDetailScreen内の類似投稿表示
- **UI骨組み実装済み**（ranking-detail-content.tsx に `<section>` 追加済み、空状態「類似の投稿は近日公開予定」を表示）
- 残タスク: 類似投稿取得APIとの接続（類似度計算ロジック or タグベース推薦API）
- 優先度: 中

### 12. 検索タブ統合
- 検索画面の `posts` タブと `rankings` タブを単一の「投稿」タブに統合する
- 影響範囲: タブkey（`SearchTab` 型定義）、API呼び出し、スクロールキー（`useListCache`）、ルーティングフォールバック等
- 投稿フォーマット改修（テーマ+好きなもの3つの並列リスト）と合わせて実施予定
- 優先度: 中（フォーマット改修との同時対応が望ましい）

## 本PRで対応するUI項目
- 投稿カード構造のfigma-make準拠化（ranking-card.tsx）
- 引用リツイート風コメント表示の撤廃（commented-ranking-card.tsx）
- カラートークン・タイポグラフィの揃え（globals.css）
- 各ページのfigma-make準拠UIリフレッシュ
