"use client";

import { StateScreen } from "@/components/state-screen";

export default function DraftLimitStatePage() {
  return (
    <StateScreen
      title="Draft Limit Reached"
      subtitle="Mock 16"
      bullets={[
        "Local draft count reached 5/5.",
        "Warn user and block additional draft save.",
        "Guide to publish or delete existing drafts.",
      ]}
      actionHref="/drafts"
      actionLabel="Open Drafts"
    />
  );
}

