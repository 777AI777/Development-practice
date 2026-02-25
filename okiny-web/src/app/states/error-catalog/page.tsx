"use client";

import { StateScreen } from "@/components/state-screen";

export default function ErrorCatalogStatePage() {
  return (
    <StateScreen
      title="エラー状態カタログ"
      subtitle="モック12"
      bullets={[
        "NETWORK: 通信環境を確認して再試行。",
        "SERVER (5xx): 再試行アクションを表示。",
        "UNAUTHORIZED (401): ログインへリダイレクト。",
        "FORBIDDEN (403): 権限エラーを表示。",
        "VALIDATION (422): フィールド単位のヒントを表示。",
        "RATE_LIMIT (429): 待機してから再試行を案内。",
      ]}
      actionHref="/rankings?state=error"
      actionLabel="エラーサンプルへ"
    />
  );
}

