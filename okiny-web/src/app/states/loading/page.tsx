"use client";

import { StateScreen } from "@/components/state-screen";

export default function LoadingStatePage() {
  return (
    <StateScreen
      title="ローディング状態"
      subtitle="モック13"
      bullets={[
        "読み込み中は本文の操作を無効化する。",
        "10秒後に遅延メッセージを表示する。",
        "60秒後にエラー状態へ遷移する（最新判断で固定）。",
      ]}
      actionHref="/rankings?state=loading"
      actionLabel="ローディング例を開く"
    />
  );
}

