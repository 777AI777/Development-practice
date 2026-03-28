import type { ToastMessage } from "@/lib/types";

export function buildSessionExpiredToast(): ToastMessage {
  return {
    type: "error",
    message: "セッションが切れました。",
    persistent: true,
    action: { label: "ログインページへ", href: "/login" },
  };
}
