import { useState } from "react";
import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";

interface NotificationSettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface NotificationItem {
  id: string;
  label: string;
  description: string;
}

const NOTIFICATION_ITEMS: NotificationItem[] = [
  {
    id: "daily-topic",
    label: "今日のお題",
    description: "毎日のお題が配信されたときに通知",
  },
  {
    id: "thread-reply",
    label: "スレッド回答",
    description: "自分のスレッドに回答があったときに通知",
  },
  {
    id: "pin-award",
    label: "ピン止め・Award",
    description: "投稿がピン止めやAwardされたときに通知",
  },
  {
    id: "follow-post",
    label: "フォロー中の新規投稿",
    description: "フォロー中のユーザーが投稿したときに通知",
  },
];

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}

function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer"
      } ${checked && !disabled ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full transition-transform ${
          checked
            ? "translate-x-6 bg-white"
            : "translate-x-1 bg-muted-foreground"
        }`}
      />
    </button>
  );
}

export function NotificationSettingsScreen({ onNavigate }: NotificationSettingsScreenProps) {
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [notificationStates, setNotificationStates] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(NOTIFICATION_ITEMS.map((item) => [item.id, true]))
  );

  const handleToggleItem = (id: string, value: boolean) => {
    setNotificationStates((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onNavigate={onNavigate} />

      <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
        <h1 className="mb-6 text-lg font-bold text-foreground">通知設定</h1>

        {/* 通知許可セクション */}
        <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            通知許可
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={
                  masterEnabled ? "text-primary" : "text-muted-foreground"
                }
              >
                {masterEnabled ? <BellIcon /> : <BellOffIcon />}
              </span>
              <span className="text-sm font-medium text-foreground">
                通知を許可する
              </span>
            </div>
            <ToggleSwitch
              checked={masterEnabled}
              onChange={setMasterEnabled}
              ariaLabel="通知を許可する"
            />
          </div>
        </div>

        {/* 通知種別セクション */}
        <div
          className={`rounded-xl border border-border bg-card transition-opacity ${
            masterEnabled ? "opacity-100" : "opacity-50"
          }`}
        >
          <p className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            通知種別
          </p>
          <ul className="divide-y divide-border">
            {NOTIFICATION_ITEMS.map((item) => (
              <li key={item.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        masterEnabled
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={notificationStates[item.id] ?? true}
                    onChange={(value) => handleToggleItem(item.id, value)}
                    disabled={!masterEnabled}
                    ariaLabel={item.label}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 補足テキスト */}
        <p className="mt-4 text-xs text-muted-foreground">
          通知を受け取るには、デバイスの通知設定でOKINYの通知を許可してください。
        </p>
      </div>
    </div>
  );
}
