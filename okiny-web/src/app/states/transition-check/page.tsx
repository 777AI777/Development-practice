"use client";

import { StateScreen } from "@/components/state-screen";

export default function TransitionCheckStatePage() {
  return (
    <StateScreen
      title="状態遷移確認"
      subtitle="モック18"
      bullets={[
        "各メイン画面は必要に応じて通常/空/エラー/ローディング状態を持つ。",
        "優先順位: エラー > ローディング > 空 > 通常。",
        "タイムアウト: 10秒で遅延ヒント、60秒でエラー遷移。",
        "404 は専用の未検出画面として分離。",
      ]}
      actionHref="/rankings"
      actionLabel="手動確認用に一覧へ戻る"
    />
  );
}

