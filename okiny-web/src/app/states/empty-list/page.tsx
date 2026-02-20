"use client";

import { StateScreen } from "@/components/state-screen";

export default function EmptyListStatePage() {
  return (
    <StateScreen
      title="Empty List State"
      subtitle="Mock 09"
      bullets={[
        "No rankings available for current user.",
        "Show CTA to create first ranking.",
        "This is separated from loading and error states.",
      ]}
      actionHref="/rankings/new"
      actionLabel="Create your first ranking"
    />
  );
}

