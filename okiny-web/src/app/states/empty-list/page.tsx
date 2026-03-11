"use client";

import { StateScreen } from "@/components/state-screen";

export default function EmptyListStatePage() {
  return (
    <StateScreen
      title="一覧空状態"
      subtitle="モック09"
      bullets={[
        "現在のユーザーに表示できるランキングがない。",
        "最初のランキング作成CTAを表示する。",
        "ローディング・エラー状態とは分離して扱う。",
      ]}
      actionHref="/rankings/new"
      actionLabel="最初のランキングを作成"
    />
  );
}

