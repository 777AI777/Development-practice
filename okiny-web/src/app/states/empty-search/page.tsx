"use client";

import { StateScreen } from "@/components/state-screen";

export default function EmptySearchStatePage() {
  return (
    <StateScreen
      title="検索結果なし状態"
      subtitle="モック10"
      bullets={[
        "選択したタグに一致するランキングがない。",
        "わかりやすい説明と検索リセット導線を表示する。",
        "検索フロー内に留まる。",
      ]}
      actionHref="/search"
      actionLabel="タグ検索へ戻る"
    />
  );
}

