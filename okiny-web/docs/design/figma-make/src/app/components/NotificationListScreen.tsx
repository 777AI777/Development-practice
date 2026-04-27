import type { Screen } from "./types";

interface NotificationListScreenProps {
  onNavigate: (screen: Screen) => void;
}

type NotificationType = "theme" | "reaction" | "pin" | "award";

interface Notification {
  id: string;
  type: NotificationType;
  text: string;
  subtext: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "theme", text: "新しいおすすめテーマが届きました", subtext: "「雨の日にやること」など5件", time: "30分前", read: false },
  { id: "2", type: "reaction", text: "あなたの回答にリアクションがありました", subtext: "「参考になった」と「共感した」", time: "2時間前", read: false },
  { id: "3", type: "pin", text: "あなたの回答がピン止めされました", subtext: "スレッド「最近ハマっているもの」", time: "1日前", read: false },
  { id: "4", type: "theme", text: "新しいおすすめテーマが届きました", subtext: "「子どもの頃に好きだったもの」など6件", time: "3日前", read: true },
  { id: "5", type: "reaction", text: "あなたの回答にリアクションがありました", subtext: "「新しい発見」", time: "5日前", read: true },
  { id: "6", type: "award", text: "Awardを受賞しました", subtext: "スレッド「旅行先でかならず食べるもの」", time: "1週間前", read: true },
  { id: "7", type: "theme", text: "新しいおすすめテーマが届きました", subtext: "「好きな季節とその理由」など4件", time: "2週間前", read: true },
  { id: "8", type: "pin", text: "あなたの回答がピン止めされました", subtext: "スレッド「リラックスできる場所」", time: "3週間前", read: true },
];

function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === "theme") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6m-3 3v-3m0-15a6 6 0 0 1 6 6c0 2.5-1 4.5-3 6H9c-2-1.5-3-3.5-3-6a6 6 0 0 1 6-6z" />
      </svg>
    );
  }
  if (type === "reaction") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (type === "pin") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="17" x2="12" y2="22" />
        <path d="M5 17h14v-2a6 6 0 0 0-6-6 6 6 0 0 0-6 6v2z" />
        <path d="M12 11V5" />
        <line x1="8" y1="5" x2="16" y2="5" />
      </svg>
    );
  }
  // award
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div
      className="flex items-start gap-4 px-4 py-4 border-b relative"
      style={{
        borderColor: "var(--border)",
        backgroundColor: notification.read ? "transparent" : "var(--card)",
      }}
    >
      {!notification.read && (
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
        />
      )}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}
      >
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm"
          style={{ color: notification.read ? "var(--muted-foreground)" : "var(--foreground)" }}
        >
          {notification.text}
        </p>
        {notification.subtext && (
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {notification.subtext}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {notification.time}
        </p>
      </div>
    </div>
  );
}

export function NotificationListScreen({ onNavigate }: NotificationListScreenProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center gap-3 px-4 border-b max-w-[480px] mx-auto"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={() => onNavigate("rankings")}
          className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: "var(--foreground)" }}
          aria-label="戻る"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          お知らせ
        </h1>
      </header>

      <div className="pt-14">
        {MOCK_NOTIFICATIONS.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
