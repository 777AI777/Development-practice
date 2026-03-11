"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";

export default function SettingsPage() {
  const { user, updateDisplayName } = useSessionUser();
  const { pushToast } = useToast();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user?.name]);

  const isDirty = useMemo(() => displayName.trim() !== (user?.name ?? ""), [displayName, user?.name]);
  const canSave = displayName.trim().length > 0 && isDirty;

  const save = () => {
    if (!canSave) {
      return;
    }
    updateDisplayName(displayName.trim());
    pushToast({ type: "success", message: "設定を保存しました。" });
  };

  return (
    <AppShell
      title="設定"
      subtitle="表示名編集・ログイン情報確認・明示保存。モック07に準拠。"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <label htmlFor="display-name" className="mb-1 block text-sm font-semibold text-slate-800">
            表示名（編集可能）
          </label>
          <input
            id="display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="表示名"
          />
          <p className="mt-3 text-sm text-slate-600">メール: {user?.email ?? "-"}</p>
          <p className="mt-1 text-xs text-slate-500">認証プロバイダ: Google OAuth（設定済み想定）</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            設定を保存
          </button>
          <button
            type="button"
            onClick={() => setDisplayName(user?.name ?? "")}
            disabled={!isDirty}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            キャンセル
          </button>
          <Link href="/settings/logout" className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">
            ログアウト
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
