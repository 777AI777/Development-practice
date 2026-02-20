"use client";

import { StateScreen } from "@/components/state-screen";

export default function EmptySearchStatePage() {
  return (
    <StateScreen
      title="Empty Search State"
      subtitle="Mock 10"
      bullets={[
        "No ranking matched selected tag.",
        "Display clear message with reset search action.",
        "Remain inside search flow.",
      ]}
      actionHref="/search"
      actionLabel="Back to Tag Search"
    />
  );
}

