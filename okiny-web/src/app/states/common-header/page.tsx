"use client";

import { StateScreen } from "@/components/state-screen";

export default function CommonHeaderStatePage() {
  return (
    <StateScreen
      title="共通ヘッダー"
      subtitle="モック19"
      bullets={[
        "ヘッダーにアプリ名・設定ショートカット・アカウント操作を含む。",
        "サインアウト操作は確認画面へ遷移する。",
        "確認用に現在のログインユーザー名を表示する。",
      ]}
      actionHref="/settings"
      actionLabel="設定を開く"
    />
  );
}

