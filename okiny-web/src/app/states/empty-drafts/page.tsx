"use client";

import { StateScreen } from "@/components/state-screen";

export default function EmptyDraftsStatePage() {
  return (
    <StateScreen
      title="Empty Drafts State"
      subtitle="Mock 11"
      bullets={[
        "No local drafts found in IndexedDB.",
        "Show explain text about local browser storage.",
        "Provide quick action to create ranking.",
      ]}
      actionHref="/rankings/new"
      actionLabel="Create ranking"
    />
  );
}

