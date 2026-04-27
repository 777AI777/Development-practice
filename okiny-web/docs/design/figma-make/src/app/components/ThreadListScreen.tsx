import { AppHeader } from "./AppHeader";
import { ThreadCard } from "./shared/ThreadCard";
import type { ThreadCardData } from "./shared/ThreadCard";
import type { Screen } from "./types";

interface Props {
  onNavigate: (screen: Screen) => void;
  onSidebarToggle?: () => void;
}

/* --- Authors（多様なアバター画像: 猫・犬・人物・風景等） --- */

const AUTHORS = {
  taro: {
    displayName: "Taro Yamada",
    avatarUrl: "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=100&h=100&fit=crop",
    displayUserId: "taro_y",
  },
  hana: {
    displayName: "Hana Miyamoto",
    avatarUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=100&h=100&fit=crop",
    displayUserId: "hana_m",
  },
  kenji: {
    displayName: "Kenji Tanaka",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    displayUserId: "kenji_t",
  },
  saki: {
    displayName: "Saki Watanabe",
    avatarUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop",
    displayUserId: "saki_w",
  },
  ryota: {
    displayName: "Ryota Kato",
    avatarUrl: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=100&h=100&fit=crop",
    displayUserId: "ryota_k",
  },
  yuki: {
    displayName: "Yuki Nakamura",
    avatarUrl: null,
    displayUserId: "yuki_n",
  },
  mai: {
    displayName: "Mai Suzuki",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    displayUserId: "mai_sz",
  },
  ren: {
    displayName: "Ren Inoue",
    avatarUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100&h=100&fit=crop",
    displayUserId: "ren_i",
  },
} as const;

/* --- Mock data --- */

const MOCK_THREADS: ThreadCardData[] = [
  {
    id: "1",
    theme: "最近ハマっているもの",
    description:
      "ジャンル問わず、今あなたが夢中になっているものを教えてください。仕事終わりについやってしまうこと、気づいたら時間が溶けていたもの、なんでもOK。みんなの「今」が知りたい。\n#日常 #マイブーム",
    tag: "日常",
    author: AUTHORS.taro,
    answerCount: 12,
    createdAt: "2026-04-13T09:00:00Z",
    lastAnsweredAt: "2026-04-15T08:30:00Z",
    isPinned: true,
    borderColor: "#FFE5E5",
  },
  {
    id: "2",
    theme: "リラックスできる場所",
    description:
      "自分だけの「癒しスポット」ってある？家の中でも外でも、行くと気持ちが落ち着く場所を共有したい。意外な場所が誰かのヒントになるかも。\n#旅行 #癒し",
    tag: "旅行",
    author: AUTHORS.hana,
    answerCount: 8,
    createdAt: "2026-04-08T14:00:00Z",
    lastAnsweredAt: "2026-04-14T21:15:00Z",
    isPinned: false,
    borderColor: "#DFECF8",
  },
  {
    id: "3",
    theme: "子どもの頃に好きだったもの",
    description:
      "懐かしいけど今でも好きなものってありますか？お菓子、おもちゃ、テレビ番組なんでもOK。大人になってから買い直した人の話も聞きたい。あの頃の「好き」は意外と今の自分に繋がっている気がする。\n#日常 #懐かしい",
    tag: "日常",
    author: AUTHORS.kenji,
    answerCount: 24,
    createdAt: "2026-04-01T10:00:00Z",
    lastAnsweredAt: "2026-04-15T06:00:00Z",
    isPinned: true,
    borderColor: "#F8EFD5",
  },
  {
    id: "4",
    theme: "旅行先でかならず食べるもの",
    description:
      "旅の楽しみの大部分は食にある気がする。地元の人に教えてもらった名店、偶然入った食堂が最高だった話、定番だけど外せないグルメ。旅先の「食」エピソードを語ろう。\n#旅行 #グルメ",
    tag: "旅行",
    author: AUTHORS.saki,
    answerCount: 6,
    createdAt: "2026-03-25T18:30:00Z",
    lastAnsweredAt: "2026-04-12T11:00:00Z",
    isPinned: false,
    borderColor: "#DCEDE2",
  },
  {
    id: "5",
    theme: "雨の日にやること",
    description:
      "外に出られない日の過ごし方、みんなはどうしてる？読書、映画、それとも料理？雨音をBGMにして没頭できる趣味があると、雨の日が待ち遠しくなる。\n#日常 #雨の日",
    tag: "日常",
    author: AUTHORS.ryota,
    answerCount: 15,
    createdAt: "2026-03-20T08:00:00Z",
    lastAnsweredAt: "2026-04-10T19:45:00Z",
    isPinned: false,
    borderColor: "#E8DFF3",
  },
  {
    id: "6",
    theme: "一番おすすめの映画を1本だけ選ぶなら？",
    description:
      "迷っても1本だけ。究極の選択だからこそ、その人の「好き」が色濃く出る。選んだ理由もセットで聞きたい。自分では絶対選ばないジャンルの映画に出会えるかも。\n#映画 #おすすめ #究極の1本",
    tag: "映画",
    author: AUTHORS.yuki,
    answerCount: 31,
    createdAt: "2026-04-10T20:00:00Z",
    lastAnsweredAt: "2026-04-15T07:20:00Z",
    isPinned: false,
    borderColor: "#F8E7D4",
  },
  {
    id: "7",
    theme: "在宅ワークが捗るアイテム",
    description:
      "デスク周りでこれは買ってよかった！というものを知りたい。椅子やモニターだけじゃなく、小さなグッズで劇的に快適になった話も大歓迎。在宅歴が長い人のリアルな声を聞こう。\n#日用品 #在宅ワーク",
    tag: "日用品",
    author: AUTHORS.mai,
    answerCount: 19,
    createdAt: "2026-04-05T12:00:00Z",
    lastAnsweredAt: "2026-04-14T16:30:00Z",
    isPinned: false,
    borderColor: "#FFE5E5",
  },
  {
    id: "8",
    theme: "推しの曲をプレゼンして",
    description:
      "今一番聴いてほしい1曲とその魅力を語ってほしい。ジャンルは問わない。歌詞が刺さる、メロディが頭から離れない、MVが最高――どんな切り口でもOK。新しい推しに出会いたい人集合。\n#音楽 #推し活",
    tag: "音楽",
    author: AUTHORS.ren,
    answerCount: 42,
    createdAt: "2026-04-02T09:30:00Z",
    lastAnsweredAt: "2026-04-15T09:00:00Z",
    isPinned: false,
    borderColor: "#DFECF8",
  },
  {
    id: "9",
    theme: "コスパ最強のコスメ",
    description:
      "ドラコスでもデパコスでもOK。値段以上の価値があると感じたコスメを教えて。リピ買いしているものや、友達にも勧めたくなるアイテムが知りたい。プチプラの底力を見せつけよう。\n#化粧品 #コスパ",
    tag: "化粧品",
    author: AUTHORS.hana,
    answerCount: 17,
    createdAt: "2026-03-28T15:00:00Z",
    lastAnsweredAt: "2026-04-13T22:00:00Z",
    isPinned: false,
    borderColor: "#F8EFD5",
  },
  {
    id: "10",
    theme: "この春行きたい場所",
    description:
      "桜の名所でも、新しくできた施設でも。春に行くならここ！というスポットを募集。写真映えだけじゃなく、空気感や雰囲気まで伝わるような回答を期待してる。\n#旅行 #春",
    tag: "旅行",
    author: AUTHORS.kenji,
    answerCount: 9,
    createdAt: "2026-04-12T07:00:00Z",
    lastAnsweredAt: "2026-04-14T18:00:00Z",
    isPinned: false,
    borderColor: "#DCEDE2",
  },
  {
    id: "11",
    theme: "カフェ選びで重視すること",
    description:
      "味、雰囲気、Wi-Fi、電源、席の広さ。人によって優先順位が全然違うのが面白い。みんなのカフェ選びの基準を知って、次のカフェ探しの参考にしたい。\n#カフェ #こだわり",
    tag: "カフェ",
    author: AUTHORS.mai,
    answerCount: 0,
    createdAt: "2026-04-14T22:00:00Z",
    lastAnsweredAt: null,
    isPinned: false,
    borderColor: "#E8DFF3",
  },
  {
    id: "12",
    theme: "人生で一番美味しかった食べ物",
    description:
      "忘れられない味の記憶。お店でも家庭料理でも旅先の屋台でもいい。その時の状況やエピソードも込みで教えてほしい。味覚の記憶って、場所や人の記憶と結びついてるから面白い。\n#日常 #グルメ #思い出",
    tag: "日常",
    author: AUTHORS.ryota,
    answerCount: 38,
    createdAt: "2026-03-18T11:00:00Z",
    lastAnsweredAt: "2026-04-15T01:30:00Z",
    isPinned: false,
    borderColor: "#F8E7D4",
  },
];

/* --- Main screen --- */

export function ThreadListScreen({ onNavigate, onSidebarToggle }: Props) {
  const pinnedThreads = MOCK_THREADS.filter((t) => t.isPinned);
  const regularThreads = MOCK_THREADS.filter((t) => !t.isPinned);
  const sortedThreads = [...pinnedThreads, ...regularThreads];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="mb-4">
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            スレッド
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            お題に自分の好きなものを回答しよう
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          {sortedThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onNavigate={onNavigate}
              onAuthorClick={() => onNavigate("user-profile")}
              onBookmarkClick={() => {}}
              onShareClick={() => {}}
            />
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => onNavigate("thread-create")}
        aria-label="スレッドを作成"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-20 transition hover:opacity-90 active:scale-95"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
