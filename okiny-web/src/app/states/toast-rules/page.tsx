"use client";

import { StateScreen } from "@/components/state-screen";

export default function ToastRulesStatePage() {
  return (
    <StateScreen
      title="Toast Rules"
      subtitle="Mock 17"
      bullets={[
        "Placement: bottom-right.",
        "Types: success (3s), error (6s), warning (5s), info (4s).",
        "Max visible: 5 toasts with queue handling.",
        "Critical errors may stay persistent until manually closed.",
      ]}
      actionHref="/rankings"
      actionLabel="Trigger toasts from app flow"
    />
  );
}

