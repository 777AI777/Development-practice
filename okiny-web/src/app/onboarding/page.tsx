"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useSessionUser } from "@/hooks/use-session-user";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isReady } = useSessionUser();
  const [isCheckingOnboarded, setIsCheckingOnboarded] = useState(true);

  useEffect(() => {
    if (!isReady || !user) return;

    const checkOnboarded = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user?.user_metadata?.onboarded === true) {
        router.replace("/rankings");
        return;
      }

      setIsCheckingOnboarded(false);
    };

    void checkOnboarded();
  }, [isReady, user, router]);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  if (!isReady || isCheckingOnboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <OnboardingWizard />
      </div>
    </div>
  );
}
