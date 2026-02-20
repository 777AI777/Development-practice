"use client";

import { StateScreen } from "@/components/state-screen";

export default function AuthErrorStatePage() {
  return (
    <StateScreen
      title="Auth Error State"
      subtitle="Mock 14"
      bullets={[
        "Google sign-in failed.",
        "Display retry button and support message.",
        "Route back to login screen.",
      ]}
      actionHref="/login"
      actionLabel="Retry login"
    />
  );
}

