import { useState } from "react";
import type { Screen } from "./types";
import { InstagramPostCard } from "./shared/InstagramPostCard";
import { ThreadCard } from "./shared/ThreadCard";

interface Props {
  onNavigate: (screen: Screen) => void;
  onBack?: () => void;
  onSidebarToggle?: () => void;
  onViewProfile?: (displayUserId: string) => void;
  onEdit?: () => void;
}

type SortOrder = "new" | "reaction";

interface Reactions {
  light: number;
  star: number;
  handshake: number;
}

interface MockAnswer {
  id: string;
  userId: string;
  userName: string;
  avatarColor: string;
  avatarUrl?: string | null;
  items: string[];
  comment: string;
  createdAt: string;
  isPinned: boolean;
  isHidden?: boolean;
  reactions: Reactions;
  borderColor: string;
  markerIcon: string;
  onBookmarkClick?: () => void;
  onShareClick?: () => void;
}

const MOCK_THREAD = {
  id: "1",
  theme: "最近ハマっているもの",
  author: {
    displayName: "Taro Yamada",
    displayUserId: "taro_y",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg" as string | null,
  },
  createdAt: "2026-04-13T09:00:00Z",
  description: "好きなことでも、最近始めたことでも何でもOK。ジャンルは問わないので気軽に回答してほしい。みんなの「ハマり」を知って、新しい趣味を見つけるきっかけになれば嬉しい\n\n#日常 #趣味 #最近のハマり",
  tag: "日常",
};

const MOCK_ANSWERS: readonly MockAnswer[] = [
  {
    id: "a1",
    userId: "hana_m",
    userName: "Hana Miyamoto",
    avatarColor: "var(--muted)",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    items: ["抹茶スイーツ", "ヨガ", "古本屋巡り"],
    comment: "週末に必ずどれかやっています。特に古本屋巡りは最近のお気に入りで、棚の間を歩いていると思いがけない本に出会えるのが楽しい。抹茶スイーツは季節限定ものを追いかけていて、コンビニ新作は発売日にチェックしてる。ヨガは朝の15分だけだけど、それだけで1日の調子が変わる\n\n#週末の過ごし方 #抹茶",
    createdAt: "2026-04-14T14:00:00Z",
    isPinned: true,
    reactions: { light: 8, star: 3, handshake: 5 },
    borderColor: "#FFE5E5",
    markerIcon: "Heart",
  },
  {
    id: "a2",
    userId: "kenji_t",
    userName: "Kenji Tanaka",
    avatarColor: "var(--muted)",
    avatarUrl: "https://randomuser.me/api/portraits/men/75.jpg",
    items: ["将棋", "コーヒー豆の自家焙煎", "ドライブ"],
    comment: "将棋は詰将棋を毎朝解くのが日課になった。頭が冴えてから仕事に入ると集中力が段違い。コーヒー豆は浅煎りにハマっていて、焙煎の秒数で味が全然変わるのが奥深い。ドライブは目的地を決めずに出発するのが好き\n\n#趣味 #コーヒー",
    createdAt: "2026-04-14T12:00:00Z",
    isPinned: true,
    reactions: { light: 1, star: 6, handshake: 0 },
    borderColor: "#DFECF8",
    markerIcon: "Coffee",
  },
  {
    id: "a3",
    userId: "saki_w",
    userName: "Saki Watanabe",
    avatarColor: "var(--muted)",
    avatarUrl: "https://placekitten.com/100/100",
    items: ["刺繍", "韓国ドラマ", "パン作り"],
    comment: "刺繍は思ったよりも集中できて、完成したときの達成感がたまらない。最近はトートバッグにワンポイントで入れるのにハマっている。韓国ドラマは刺繍しながら流し見するのがちょうどいい。パン作りは焼きたての香りだけで幸福度が3割上がる\n\n#手芸 #韓ドラ #パン",
    createdAt: "2026-04-14T08:30:00Z",
    isPinned: false,
    reactions: { light: 0, star: 2, handshake: 1 },
    borderColor: "#F8EFD5",
    markerIcon: "Star",
  },
  {
    id: "a4",
    userId: "ryota_k",
    userName: "Ryota Kato",
    avatarColor: "var(--muted)",
    avatarUrl: "https://picsum.photos/seed/mountain_sunrise/100/100",
    items: ["登山", "山岳写真", "テントサウナ"],
    comment: "山で過ごす時間が一番好き。山岳写真は朝焼けを狙って前日入りすることもあって、寝袋の中で目覚ましが鳴る瞬間のワクワク感がたまらない。テントサウナは山の川で水風呂代わりにするのが最高に気持ちいい\n\n#アウトドア #登山",
    createdAt: "2026-04-13T18:00:00Z",
    isPinned: false,
    reactions: { light: 4, star: 0, handshake: 7 },
    borderColor: "#DCEDE2",
    markerIcon: "Leaf",
  },
  {
    id: "a5",
    userId: "yuki_n",
    userName: "Yuki Nakamura",
    avatarColor: "var(--muted)",
    avatarUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    items: ["サウナ", "読書", "料理"],
    comment: "最近始めた趣味ばかりだけど、どれも生活の質を上げてくれている。サウナは整うと何もかもリセットされる感覚があって週2で通っている。読書は寝る前の30分が定番で、積読が減らない。料理は作り置きにハマっていて、日曜に1週間分まとめて仕込む\n\n#サウナ #読書 #料理",
    createdAt: "2026-04-15T08:50:00Z",
    isPinned: false,
    reactions: { light: 2, star: 1, handshake: 0 },
    borderColor: "#E8DFF3",
    markerIcon: "Sun",
  },
  {
    id: "a6",
    userId: "mai_sz",
    userName: "Mai Suzuki",
    avatarColor: "var(--muted)",
    avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
    items: ["ネイルアート", "カフェ巡り", "ポッドキャスト"],
    comment: "ネイルは自分でやるのがコスパ最強で、YouTube見ながら練習中。友達に褒められるとモチベが上がる。カフェ巡りは新しいお店を見つけるとすぐ行きたくなって、写真フォルダがラテアートだらけ。ポッドキャストは通勤中の相棒で、最近は英語学習系を聴いてる\n\n#ネイル #カフェ",
    createdAt: "2026-04-13T22:00:00Z",
    isPinned: false,
    reactions: { light: 3, star: 5, handshake: 2 },
    borderColor: "#F8E7D4",
    markerIcon: "Smile",
  },
  {
    id: "a7",
    userId: "ren_i",
    userName: "Ren Inoue",
    avatarColor: "var(--muted)",
    avatarUrl: "https://placedog.net/100/100?id=3",
    items: ["ボードゲーム", "クラフトビール", "DIY"],
    comment: "週末は友人を呼んでボドゲ会を開催している。最近はテラフォーミングマーズにハマっていて、3時間ぶっ通しで遊ぶことも。クラフトビールはIPAが好みで、各地の醸造所を巡るのが旅の目的になりつつある。DIYは本棚を作るところから始めたけど、今はデスクに挑戦中\n\n#ボードゲーム #クラフトビール #DIY",
    createdAt: "2026-04-12T20:00:00Z",
    isPinned: false,
    reactions: { light: 6, star: 2, handshake: 4 },
    borderColor: "#FFE5E5",
    markerIcon: "Music4",
  },
  {
    id: "a8",
    userId: "daichi_o",
    userName: "Daichi Okada",
    avatarColor: "var(--muted)",
    avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    items: ["筋トレ", "プロテインレシピ", "睡眠管理"],
    comment: "筋トレは週4でジムに通っていて、最近ベンチプレスの自己記録を更新した。プロテインレシピは飽きないように日々研究中で、プロテインパンケーキが朝食の定番になった。睡眠管理アプリで質を数値化するようになってから体調が明らかに安定した\n\n#筋トレ #健康",
    createdAt: "2026-04-13T14:00:00Z",
    isPinned: false,
    reactions: { light: 1, star: 0, handshake: 2 },
    borderColor: "#DFECF8",
    markerIcon: "Moon",
  },
  {
    id: "a9",
    userId: "mika_a",
    userName: "Mika Aoyama",
    avatarColor: "var(--muted)",
    avatarUrl: "https://picsum.photos/seed/watercolor_art/100/100",
    items: ["水彩画", "美術館巡り", "ジャズ"],
    comment: "水彩は紙と絵の具の相性で全然違う仕上がりになるのが面白い。最近は風景画にハマっていて、旅先でスケッチブックを開く時間が贅沢。美術館は一人で行って、気に入った絵の前にずっと立っているのが好き。Bill Evansを聴きながら絵を描く時間が至福\n\n#アート #ジャズ #水彩",
    createdAt: "2026-04-11T10:00:00Z",
    isPinned: false,
    reactions: { light: 5, star: 8, handshake: 3 },
    borderColor: "#F8EFD5",
    markerIcon: "Book",
  },
  {
    id: "a10",
    userId: "taro_y",
    userName: "Taro Yamada",
    avatarColor: "var(--muted)",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    items: ["自転車", "写真", "カレー作り"],
    comment: "スレ主だけど自分も回答。自転車で遠出して写真を撮るのが休日の定番になった。峠道を越えた先の景色を撮る瞬間が好き。カレーは最近スパイスから作るようになって、クミンとコリアンダーの配合を毎回変えて実験している\n\n#自転車 #カレー #写真",
    createdAt: "2026-04-13T12:00:00Z",
    isPinned: false,
    reactions: { light: 7, star: 3, handshake: 6 },
    borderColor: "#DCEDE2",
    markerIcon: "Film",
  },
];

/* --- Icons --- */

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6m-3 3v-3m0-15a6 6 0 0 1 6 6c0 2.5-1 4.5-3 6H9c-2-1.5-3-3.5-3-6a6 6 0 0 1 6-6z" />
    </svg>
  );
}

function StarIconSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76z" />
    </svg>
  );
}

/* --- Comment / Tag splitting helpers --- */

/**
 * コメント末尾のハッシュタグ専用行を除いた本文テキストを返す。
 */
function extractCommentBody(comment: string): string {
  const lines = comment.split("\n");
  let splitIdx = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    if (/^(#[^\s#]+\s*)+$/.test(trimmed)) {
      splitIdx = i;
    } else {
      break;
    }
  }
  return lines.slice(0, splitIdx).join("\n").replace(/\n+$/, "");
}

/**
 * コメント末尾のハッシュタグ専用行からタグ文字列の配列を返す。
 */
function extractCommentTags(comment: string): string[] {
  const lines = comment.split("\n");
  const tagLines: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    if (/^(#[^\s#]+\s*)+$/.test(trimmed)) {
      tagLines.unshift(trimmed);
    } else {
      break;
    }
  }
  const allTags: string[] = [];
  for (const line of tagLines) {
    const matches = line.match(/#([^\s#]+)/g);
    if (matches) {
      for (const m of matches) {
        allTags.push(m.slice(1));
      }
    }
  }
  return allTags;
}

/* --- Main screen --- */

export function ThreadDetailScreen({ onNavigate, onBack, onViewProfile, onEdit }: Props) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("new");

  // デモ用: スレッド主視点（true = ピン止めUI表示）
  const isThreadOwner = true;

  const sortedAnswers = [...MOCK_ANSWERS].sort((a, b) => {
    if (a.isHidden && !b.isHidden) return 1;
    if (!a.isHidden && b.isHidden) return -1;
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (sortOrder === "reaction") {
      const totalA = a.reactions.light + a.reactions.star + a.reactions.handshake;
      const totalB = b.reactions.light + b.reactions.star + b.reactions.handshake;
      return totalB - totalA;
    }
    return 0;
  });

  const threadDescriptionBody = extractCommentBody(MOCK_THREAD.description ?? "");
  const threadTags = extractCommentTags(MOCK_THREAD.description ?? "");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Custom header */}
      <header
        className="fixed left-1/2 top-0 z-30 flex h-14 w-full max-w-[480px] -translate-x-1/2 items-center border-b px-4 gap-3"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={() => onBack ? onBack() : onNavigate("thread-list")}
          className="flex items-center justify-center w-8 h-8 rounded-full transition hover:opacity-70 bg-transparent border-none cursor-pointer"
          style={{ color: "var(--foreground)" }}
          aria-label="戻る"
        >
          <BackArrowIcon />
        </button>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          スレッド
        </span>
      </header>

      <main className="pt-14 pb-24">
        {/* お題カード — ThreadCard で一覧と統一表示 */}
        <div className="px-4 pt-4 pb-3">
          <ThreadCard
            thread={{
              id: MOCK_THREAD.id,
              theme: MOCK_THREAD.theme,
              description: threadDescriptionBody || undefined,
              tags: threadTags.length > 0 ? threadTags : undefined,
              author: MOCK_THREAD.author,
              answerCount: MOCK_ANSWERS.length,
              createdAt: MOCK_THREAD.createdAt,
              borderColor: "#E8DFF3",
            }}
            onNavigate={onNavigate}
            onAuthorClick={
              !isThreadOwner && onViewProfile
                ? () => onViewProfile(MOCK_THREAD.author.displayUserId)
                : undefined
            }
            disableNavigate
            showCreatedAt
            showEditButton={isThreadOwner}
            onEditClick={onEdit}
          />
        </div>

        {/* ソートタブ */}
        <div
          className="flex border-b px-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          {(["new", "reaction"] as SortOrder[]).map((order) => {
            const label = order === "new" ? "新着順" : "リアクション数順";
            const isActive = sortOrder === order;
            return (
              <button
                key={order}
                type="button"
                onClick={() => setSortOrder(order)}
                className="py-3 mr-4 text-sm transition"
                style={{
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                  background: "none",
                  cursor: "pointer",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </button>
            );
          })}
          <span className="ml-auto self-center text-xs" style={{ color: "var(--muted-foreground)" }}>
            {MOCK_ANSWERS.length}件の回答
          </span>
        </div>

        {/* 回答一覧 */}
        <div className="max-w-[480px] mx-auto px-4 py-4 flex flex-col space-y-2">
          {sortedAnswers.map((answer) => {
            const isSelf = answer.userId === MOCK_THREAD.author.displayUserId && isThreadOwner;
            const canNavigateToProfile = !isSelf && !!onViewProfile;
            return (
              <InstagramPostCard
                key={answer.id}
                ranking={{
                  id: answer.id,
                  items: answer.items,
                  comment: answer.comment,
                  borderColor: answer.borderColor,
                  markerIcon: answer.markerIcon,
                  createdAt: answer.createdAt,
                  author: {
                    displayName: answer.userName,
                    avatarUrl: answer.avatarUrl ?? undefined,
                    displayUserId: answer.userId,
                  },
                }}
                onAuthorClick={canNavigateToProfile ? () => onViewProfile(answer.userId) : undefined}
                onBookmarkClick={answer.onBookmarkClick}
                onShareClick={answer.onShareClick}
                topBadge={
                  isThreadOwner && answer.isPinned ? (
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <PinIcon />
                      <span>ピン留め</span>
                    </span>
                  ) : undefined
                }
                footerLeft={
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-1 opacity-40 cursor-default"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-label="ひらめき（スレッド主のみ）"
                    >
                      <LightbulbIcon />
                      <span className="text-xs">{answer.reactions.light}</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 opacity-40 cursor-default"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-label="スター（スレッド主のみ）"
                    >
                      <StarIconSvg />
                      <span className="text-xs">{answer.reactions.star}</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 opacity-40 cursor-default"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-label="共感（スレッド主のみ）"
                    >
                      <HandshakeIcon />
                      <span className="text-xs">{answer.reactions.handshake}</span>
                    </button>
                  </div>
                }
              />
            );
          })}
        </div>
      </main>

      {/* Bottom CTA */}
      <div
        className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 px-4 pb-6 pt-3 z-20"
        style={{ backgroundColor: "var(--background)" }}
      >
        <button
          type="button"
          onClick={() => onNavigate("thread-answer")}
          className="w-full h-12 rounded-xl text-sm font-medium transition hover:opacity-90 active:scale-[0.98]"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          回答する
        </button>
      </div>
    </div>
  );
}
