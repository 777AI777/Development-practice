"use client";

import { StateScreen } from "@/components/state-screen";

export default function CommonHeaderStatePage() {
  return (
    <StateScreen
      title="Common Header"
      subtitle="Mock 19"
      bullets={[
        "Header includes app brand, settings shortcut, and account controls.",
        "Sign-out action routes to confirmation screen.",
        "Current signed-in user is displayed for validation.",
      ]}
      actionHref="/settings"
      actionLabel="Open Settings"
    />
  );
}

