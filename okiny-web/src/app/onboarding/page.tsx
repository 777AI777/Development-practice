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
  const [profileOnly, setProfileOnly] = useState(false);

  useEffect(() => {
    if (!isReady || !user) return;

    const checkOnboarded = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user?.user_metadata?.onboarded === true) {
        const hasDisplayUserId =
          typeof data.user.user_metadata.display_user_id === "string" &&
          data.user.user_metadata.display_user_id.length > 0;

        if (hasDisplayUserId) {
          router.replace("/rankings");
          return;
        }

        // 既存ユーザー: プロフィール設定のみ
        setProfileOnly(true);
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
        <OnboardingWizard profileOnly={profileOnly} />
      </div>
    </div>
  );
}
