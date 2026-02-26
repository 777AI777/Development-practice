"use client";

import { StateScreen } from "@/components/state-screen";

export default function EmptyDraftsStatePage() {
  return (
    <StateScreen
      title="下書き空状態"
      subtitle="モック11"
      bullets={[
        "IndexedDB にローカル下書きが存在しない。",
        "ブラウザ内保存であることの説明文を表示する。",
        "ランキング作成へのクイックアクションを出す。",
      ]}
      actionHref="/rankings/new"
      actionLabel="ランキング作成"
    />
  );
}

