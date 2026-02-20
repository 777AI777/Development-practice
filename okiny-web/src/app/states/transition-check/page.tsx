"use client";

import { StateScreen } from "@/components/state-screen";

export default function TransitionCheckStatePage() {
  return (
    <StateScreen
      title="State Transition Check"
      subtitle="Mock 18"
      bullets={[
        "Each main screen supports normal/empty/error/loading when applicable.",
        "Priority: Error > Loading > Empty > Normal.",
        "Timeouts: delayed hint at 10 sec, error transition at 60 sec.",
        "404 is isolated as dedicated not-found screen.",
      ]}
      actionHref="/rankings"
      actionLabel="Back to list for manual validation"
    />
  );
}

