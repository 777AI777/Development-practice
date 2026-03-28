import type { ToastMessage } from "@/lib/types";

export function buildSessionExpiredToast(): ToastMessage {
  return {
    type: "error",
    message: "セッションの有効期限が切れました。",
    persistent: true,
    action: {
      label: "ログインページへ",
      href: "/login",
    },
  };
}
