"use client";

import { StateScreen } from "@/components/state-screen";

export default function DraftLimitStatePage() {
  return (
    <StateScreen
      title="下書き上限到達"
      subtitle="モック16"
      bullets={[
        "ローカル下書き件数が 5/5 に到達。",
        "警告を表示し、追加の下書き保存をブロックする。",
        "既存下書きの公開または削除へ誘導する。",
      ]}
      actionHref="/drafts"
      actionLabel="下書きを開く"
    />
  );
}

