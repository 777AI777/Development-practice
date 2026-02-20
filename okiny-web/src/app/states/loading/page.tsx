"use client";

import { StateScreen } from "@/components/state-screen";

export default function LoadingStatePage() {
  return (
    <StateScreen
      title="Loading State"
      subtitle="Mock 13"
      bullets={[
        "Body interactions are disabled while loading.",
        "After 10 sec show delayed message.",
        "After 60 sec transition to error state (fixed by latest decision).",
      ]}
      actionHref="/rankings?state=loading"
      actionLabel="Open Loading Example"
    />
  );
}

