"use client";

import { StateScreen } from "@/components/state-screen";

export default function ToastRulesStatePage() {
  return (
    <StateScreen
      title="トースト表示ルール"
      subtitle="モック17"
      bullets={[
        "表示位置: 右下。",
        "種類: success (3秒), error (6秒), warning (5秒), info (4秒)。",
        "同時表示上限: 5件（キュー処理あり）。",
        "重大エラーは手動で閉じるまで常駐可能。",
      ]}
      actionHref="/rankings"
      actionLabel="アプリ導線でトーストを確認"
    />
  );
}

