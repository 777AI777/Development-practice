"use client";

import { StateScreen } from "@/components/state-screen";

export default function ErrorCatalogStatePage() {
  return (
    <StateScreen
      title="Error States Catalog"
      subtitle="Mock 12"
      bullets={[
        "NETWORK: check internet connection then retry.",
        "SERVER (5xx): show retry action.",
        "UNAUTHORIZED (401): redirect to login.",
        "FORBIDDEN (403): show permission error.",
        "VALIDATION (422): show field-level hint.",
        "RATE_LIMIT (429): ask user to wait before retry.",
      ]}
      actionHref="/rankings?state=error"
      actionLabel="Go to Error Sample"
    />
  );
}

