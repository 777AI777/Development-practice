export interface ScreenRoute {
  href: string;
  label: string;
  group: "main" | "sns" | "states";
}

export const SCREEN_ROUTES: ScreenRoute[] = [
  { href: "/login", label: "01 ログイン", group: "main" },
  { href: "/rankings", label: "02 ランキング一覧", group: "main" },
  { href: "/rankings/new", label: "03 ランキング作成", group: "main" },
  { href: "/rankings/demo", label: "04 ランキング詳細", group: "main" },
  { href: "/search", label: "05 タグ検索", group: "main" },
  { href: "/drafts", label: "06 下書き一覧", group: "main" },
  { href: "/settings", label: "07 設定", group: "main" },
  { href: "/settings/logout", label: "07a ログアウト確認", group: "main" },
  { href: "/rankings/demo/delete", label: "08 削除確認", group: "main" },
  { href: "/onboarding", label: "オンボーディング", group: "sns" },
  { href: "/feed", label: "ホームフィード", group: "sns" },
  { href: "/composer", label: "投稿作成", group: "sns" },
  { href: "/composer/preview", label: "公開プレビュー", group: "sns" },
  { href: "/feed/demo", label: "投稿詳細", group: "sns" },
  { href: "/profile/user-google-001", label: "プロフィール", group: "sns" },
  { href: "/notifications", label: "通知", group: "sns" },
  { href: "/states/empty-list", label: "09 空一覧", group: "states" },
  { href: "/states/empty-search", label: "10 検索結果なし", group: "states" },
  { href: "/states/empty-drafts", label: "11 下書きなし", group: "states" },
  { href: "/states/error-catalog", label: "12 エラー状態一覧", group: "states" },
  { href: "/states/loading", label: "13 ローディング", group: "states" },
  { href: "/states/auth-error", label: "14 認証エラー", group: "states" },
  { href: "/states/not-found", label: "15 404", group: "states" },
  { href: "/states/draft-limit", label: "16 下書き上限", group: "states" },
  { href: "/states/toast-rules", label: "17 トースト規約", group: "states" },
  { href: "/states/transition-check", label: "18 状態遷移確認", group: "states" },
  { href: "/states/common-header", label: "19 共通ヘッダー", group: "states" },
];
