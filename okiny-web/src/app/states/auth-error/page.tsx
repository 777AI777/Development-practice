"use client";

import { StateScreen } from "@/components/state-screen";

export default function AuthErrorStatePage() {
  return (
    <StateScreen
      title="認証エラー状態"
      subtitle="モック14"
      bullets={[
        "Googleログインに失敗した状態。",
        "再試行ボタンとサポート案内を表示する。",
        "ログイン画面へ戻る導線を出す。",
      ]}
      actionHref="/login"
      actionLabel="ログインを再試行"
    />
  );
}

