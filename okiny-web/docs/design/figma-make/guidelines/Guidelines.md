# OKINY デザインルール

## タイポグラフィ
- フォント: Noto Sans JP

## カラー
- プライマリ: #005FCC
- 破壊的アクション: #B00020
- 背景: #F3F5F7
- テキスト: #1A1A1A
- サブテキスト: #55606E

## コンポーネント
- 角丸: 0.75rem (xl)
- カード: 白背景、border, shadow-sm, rounded-xl
- ボタン: shadcn Button使用、variant="default"(primary), variant="outline", variant="destructive"
- タブ: shadcn Tabs使用、アクティブタブはborder-b-2 + primary色
- 入力: shadcn Input使用

## レイアウト
- 最大コンテンツ幅: 480px (モバイルファースト)
- ヘッダー: 白背景、border-b、高さ56px
- 画面遷移: onNavigate prop経由

## Screen型定義
```typescript
type Screen =
  | "login"
  | "rankings"
  | "ranking-detail"
  | "ranking-new"
  | "ranking-edit"
  | "delete-confirm"
  | "drafts"
  | "search"
  | "settings"
  | "logout-confirm";
```
