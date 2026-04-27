import { useState, useCallback } from "react";
import { Plus, Layers, MessageSquare } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { InstagramPostCard } from "./shared/InstagramPostCard";
import type { PostCardRanking } from "./shared/InstagramPostCard";
import { ThreadCard } from "./shared/ThreadCard";
import type { ThreadCardData } from "./shared/ThreadCard";
import type { Screen } from "./types";

/* --- FeedItem type & interleave utility --- */

type FeedItem =
  | { kind: "post"; data: PostCardRanking }
  | { kind: "thread"; data: ThreadCardData };

/**
 * 投稿とスレッドをインターリーブする。
 * 投稿2〜3件ごとにスレッド1件を挿入し、自然な混在感を出す。
 * 同種が5件以上連続しないようにする。
 */
function interleaveFeed(
  posts: PostCardRanking[],
  threads: ThreadCardData[],
): FeedItem[] {
  const feed: FeedItem[] = [];
  let pi = 0;
  let ti = 0;

  // 投稿2〜3件の後にスレッド1件を配置するパターン: [2, 3, 2, 3, ...]
  const pattern = [2, 3];
  let patIdx = 0;

  while (pi < posts.length || ti < threads.length) {
    // 投稿をpattern[patIdx]件追加
    const postCount = pattern[patIdx % pattern.length];
    for (let i = 0; i < postCount && pi < posts.length; i++) {
      feed.push({ kind: "post", data: posts[pi] });
      pi++;
    }

    // スレッド1件追加
    if (ti < threads.length) {
      feed.push({ kind: "thread", data: threads[ti] });
      ti++;
    }

    patIdx++;
  }

  return feed;
}

type TabId = "myrank" | "recommend" | "following";

interface RankingListScreenProps {
  onNavigate: (screen: Screen) => void;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onSidebarToggle?: () => void;
  onViewProfile?: (userId: string | null) => void;
}

interface MockAuthor {
  displayName: string;
  avatarUrl: string | null;
  displayUserId: string | null;
}

interface MockRanking {
  id: string;
  title: string;
  tag: string;
  /** リンクカード表示用タグ。未指定の投稿はリンクカードを表示しない */
  linkCardTag?: string;
  items: string[];
  isPublic: boolean;
  viewCount: number;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
  author: MockAuthor;
  comment?: string;
  borderColor: string;
  markerIcon: string;
}

/* --- Authors --- */

const MOCK_AUTHOR: MockAuthor = {
  displayName: "Taro Yamada",
  avatarUrl: "https://i.pravatar.cc/100?u=taro_y",
  displayUserId: "taro_y",
};

const MOCK_AUTHOR_HANAKO: MockAuthor = {
  displayName: "Hanako Tanaka",
  avatarUrl: "https://picsum.photos/seed/hanako_portrait/100/100",
  displayUserId: "hanako_t",
};

const MOCK_AUTHOR_YUKI: MockAuthor = {
  displayName: "Yuki Sato",
  avatarUrl: "https://i.pravatar.cc/100?u=yuki_sato",
  displayUserId: "yuki_s",
};

const MOCK_AUTHOR_KENJI: MockAuthor = {
  displayName: "Kenji Suzuki",
  avatarUrl: "https://picsum.photos/seed/kenji_landscape/100/100",
  displayUserId: "kenji_sz",
};

/* --- My Rank data --- */

const MOCK_RANKINGS: MockRanking[] = [
  {
    id: "1",
    title: "何度でも観たい映画",
    tag: "映画",
    linkCardTag: "映画",
    items: ["ショーシャンクの空に", "ゴッドファーザー", "パルプ・フィクション"],
    isPublic: true,
    viewCount: 42,
    bookmarkCount: 5,
    createdAt: "2025-03-01T10:00:00Z",
    updatedAt: "2025-03-01T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "何度見ても色褪せない作品ばかり。ショーシャンクの希望と、ゴッドファーザーの静かな迫力。映画館で観た記憶が今でも鮮やかに残ってる\n\n#映画 #洋画",
    borderColor: "#FFE5E5",
    markerIcon: "Film",
  },
  {
    id: "2",
    title: "人生を変えた邦画",
    tag: "映画",
    linkCardTag: "映画",
    items: ["千と千尋の神隠し", "七人の侍", "万引き家族"],
    isPublic: false,
    viewCount: 15,
    bookmarkCount: 2,
    createdAt: "2025-03-05T10:00:00Z",
    updatedAt: "2025-03-06T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "どれも観終わった後しばらく動けなかった。万引き家族は特に、何気ない食卓のシーンが一番泣ける。自分の中で邦画の見方が変わった3本\n\n#映画 #邦画",
    borderColor: "#DFECF8",
    markerIcon: "Tv",
  },
  {
    id: "3",
    title: "東京で通いたいカフェ",
    tag: "カフェ",
    linkCardTag: "カフェ",
    items: ["ブルーボトルコーヒー", "猿田彦珈琲", "Fuglen Tokyo"],
    isPublic: true,
    viewCount: 55,
    bookmarkCount: 12,
    createdAt: "2025-02-28T10:00:00Z",
    updatedAt: "2025-02-28T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "週末のカフェ巡りが生きがい。ブルーボトルは清澄白河の本店が特に好き。猿田彦は恵比寿で待ち合わせの定番になってる\n\n#カフェ #東京カフェ",
    borderColor: "#F8EFD5",
    markerIcon: "Coffee",
  },
  {
    id: "4",
    title: "夜に聴きたい曲",
    tag: "音楽",
    linkCardTag: "音楽",
    items: ["夜に駆ける - YOASOBI", "Midnight City - M83", "夜の踊り子 - サカナクション"],
    isPublic: true,
    viewCount: 78,
    bookmarkCount: 9,
    createdAt: "2025-03-10T10:00:00Z",
    updatedAt: "2025-03-10T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "イヤホンで聴くと沁みる。特にMidnight Cityのイントロは夜の街を歩くときの定番になった。一人の夜を少しだけ特別にしてくれる曲たち\n\n#音楽 #夜",
    borderColor: "#DCEDE2",
    markerIcon: "Headphones",
  },
  {
    id: "5",
    title: "何度も読み返す漫画",
    tag: "漫画",
    items: ["スラムダンク", "HUNTER×HUNTER", "ヴィンランド・サガ"],
    isPublic: true,
    viewCount: 120,
    bookmarkCount: 18,
    createdAt: "2025-02-15T10:00:00Z",
    updatedAt: "2025-02-15T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "読むたびに新しい発見がある。スラムダンクは花道の成長に毎回泣くし、ヴィンランド・サガは農業編で価値観が揺さぶられた\n\n#漫画",
    borderColor: "#E8DFF3",
    markerIcon: "Book",
  },
  {
    id: "6",
    title: "キャンプで使う道具",
    tag: "アウトドア",
    items: ["スノーピーク 焚き火台", "ユニフレーム ライスクッカー", "コールマン ランタン"],
    isPublic: true,
    viewCount: 33,
    bookmarkCount: 4,
    createdAt: "2025-03-20T10:00:00Z",
    updatedAt: "2025-03-20T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "この3つがあればどこでも快適。焚き火台は5年使ってるけど全然壊れない。ライスクッカーで炊くごはんは家より美味しく感じる不思議\n\n#アウトドア #キャンプ",
    borderColor: "#F8E7D4",
    markerIcon: "Tent",
  },
  {
    id: "7",
    title: "朝ごはんの定番",
    tag: "グルメ",
    items: ["納豆ごはん", "トースト＆目玉焼き", "グラノーラ＆ヨーグルト"],
    isPublic: true,
    viewCount: 64,
    bookmarkCount: 7,
    createdAt: "2025-03-22T10:00:00Z",
    updatedAt: "2025-03-22T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "曜日で変えるのが楽しい。平日は納豆ごはんでサッと済ませて、休日はトーストを丁寧に焼く。朝ごはんだけで一日の気分が決まる気がする",
    borderColor: "#FFE5E5",
    markerIcon: "Utensils",
  },
  {
    id: "8",
    title: "雨の日に観たいアニメ",
    tag: "アニメ",
    items: ["言の葉の庭", "蟲師", "夏目友人帳"],
    isPublic: true,
    viewCount: 91,
    bookmarkCount: 14,
    createdAt: "2025-03-08T10:00:00Z",
    updatedAt: "2025-03-08T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "静かな雨音と合う作品たち。言の葉の庭は新宿御苑に行くたびに思い出す。蟲師のゆったりした世界観に浸ると、雨の日が少し好きになる\n\n#アニメ #雨の日",
    borderColor: "#DFECF8",
    markerIcon: "Droplets",
  },
  {
    id: "9",
    title: "旅先で撮りたい風景",
    tag: "旅行",
    linkCardTag: "旅行",
    items: ["朝焼けの海", "古い路地裏", "山の稜線"],
    isPublic: true,
    viewCount: 47,
    bookmarkCount: 6,
    createdAt: "2025-02-20T10:00:00Z",
    updatedAt: "2025-02-20T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "カメラを持って出かけたくなる。路地裏は生活感が写り込むのがいい。朝焼けは何度見ても同じ色がなくて飽きない\n\n#旅行 #写真",
    borderColor: "#F8EFD5",
    markerIcon: "Camera",
  },
  {
    id: "10",
    title: "集中できるBGM",
    tag: "音楽",
    linkCardTag: "音楽",
    items: ["lo-fi hip hop", "環境音（雨＋カフェ）", "坂本龍一 ピアノ集"],
    isPublic: false,
    viewCount: 28,
    bookmarkCount: 3,
    createdAt: "2025-03-15T10:00:00Z",
    updatedAt: "2025-03-15T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "作業用として最強の組み合わせ。坂本龍一のピアノは集中したい時にも、少し疲れた時にも寄り添ってくれる。環境音は雨とカフェの混ざり具合が絶妙なやつを探し続けてる\n\n#音楽 #作業用BGM",
    borderColor: "#DCEDE2",
    markerIcon: "Music",
  },
  {
    id: "11",
    title: "子ども時代好きだったお菓子",
    tag: "グルメ",
    items: ["うまい棒", "ブタメン", "ねるねるねるね"],
    isPublic: true,
    viewCount: 156,
    bookmarkCount: 22,
    createdAt: "2025-02-10T10:00:00Z",
    updatedAt: "2025-02-10T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "駄菓子屋の記憶がよみがえる。100円握りしめて何を買うか真剣に悩んだあの時間。大人になった今でも見かけるとつい手が伸びる\n\n#グルメ #駄菓子",
    borderColor: "#E8DFF3",
    markerIcon: "Cookie",
  },
  {
    id: "12",
    title: "散歩で見つけた花",
    tag: "暮らし",
    items: ["紫陽花", "金木犀", "沈丁花"],
    isPublic: true,
    viewCount: 38,
    bookmarkCount: 5,
    createdAt: "2025-03-25T10:00:00Z",
    updatedAt: "2025-03-25T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "季節の移り変わりを教えてくれる。金木犀の香りがすると秋が来たんだなって思う。沈丁花は冬の終わりの合図\n\n#暮らし",
    borderColor: "#F8E7D4",
    markerIcon: "Flower",
  },
  {
    id: "13",
    title: "ペットと過ごす幸せな瞬間",
    tag: "暮らし",
    items: ["膝の上で眠るとき", "散歩中のしっぽ", "ごはんを待つ顔"],
    isPublic: true,
    viewCount: 203,
    bookmarkCount: 31,
    createdAt: "2025-03-02T10:00:00Z",
    updatedAt: "2025-03-02T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "毎日癒されてる。膝の上で寝ちゃうと動けなくなるけど、その重さが幸せ。散歩中に振り返るしっぽのリズムが最高にかわいい\n\n#暮らし #ペット",
    borderColor: "#FFE5E5",
    markerIcon: "PawPrint",
  },
  {
    id: "14",
    title: "冬に飲みたいドリンク",
    tag: "カフェ",
    linkCardTag: "カフェ",
    items: ["ホットチョコレート", "チャイラテ", "甘酒"],
    isPublic: true,
    viewCount: 85,
    bookmarkCount: 11,
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "寒い日はこれで温まる。チャイラテはスパイスの香りで体の芯からぽかぽかになる。甘酒は最近ハマって、米麹の甘さがやさしい\n\n#カフェ #冬",
    borderColor: "#DFECF8",
    markerIcon: "Snowflake",
  },
  {
    id: "15",
    title: "いつか行きたい場所",
    tag: "旅行",
    linkCardTag: "旅行",
    items: ["アイスランド", "パタゴニア", "屋久島の縄文杉"],
    isPublic: true,
    viewCount: 112,
    bookmarkCount: 16,
    createdAt: "2025-02-25T10:00:00Z",
    updatedAt: "2025-02-25T10:00:00Z",
    author: MOCK_AUTHOR,
    comment: "死ぬまでに必ず行きたい。アイスランドのオーロラは写真だけでも息を呑む。屋久島の縄文杉は何千年も静かにそこにいるって思うと、なんだか安心する\n\n#旅行",
    borderColor: "#F8EFD5",
    markerIcon: "Compass",
  },
];

/* --- Recommend data --- */

const MOCK_AUTHOR_RIN: MockAuthor = {
  displayName: "Rin Abe",
  avatarUrl: "https://i.pravatar.cc/100?u=rin_abe",
  displayUserId: "rin_a",
};

const MOCK_AUTHOR_SOTA: MockAuthor = {
  displayName: "Sota Nakamura",
  avatarUrl: "https://picsum.photos/seed/sota_cycling/100/100",
  displayUserId: "sota_n",
};

const MOCK_AUTHOR_MIKA: MockAuthor = {
  displayName: "Mika Inoue",
  avatarUrl: "https://i.pravatar.cc/100?u=mika_inoue",
  displayUserId: "mika_i",
};

const MOCK_AUTHOR_DAIKI: MockAuthor = {
  displayName: "Daiki Ogawa",
  avatarUrl: "https://picsum.photos/seed/daiki_sunset/100/100",
  displayUserId: "daiki_o",
};

const RECOMMEND_RANKINGS: MockRanking[] = [
  {
    id: "r1",
    title: "泣ける是枝作品",
    tag: "映画",
    linkCardTag: "映画",
    items: ["万引き家族", "ドライブ・マイ・カー", "そして父になる"],
    isPublic: true,
    viewCount: 210,
    bookmarkCount: 34,
    createdAt: "2025-02-20T10:00:00Z",
    updatedAt: "2025-02-20T10:00:00Z",
    author: MOCK_AUTHOR_HANAKO,
    comment: "是枝作品は外せない。静かな日常の中にある痛みを丁寧に描いていて、観るたびに気づくことがある。ドライブ・マイ・カーは3時間があっという間だった\n\n#映画 #是枝裕和",
    borderColor: "#DCEDE2",
    markerIcon: "Film",
  },
  {
    id: "r2",
    title: "ドライブで聴きたい曲",
    tag: "音楽",
    linkCardTag: "音楽",
    items: ["Lemon - 米津玄師", "夜に駆ける - YOASOBI", "Pretender - Official髭男dism"],
    isPublic: true,
    viewCount: 340,
    bookmarkCount: 56,
    createdAt: "2025-03-12T10:00:00Z",
    updatedAt: "2025-03-12T10:00:00Z",
    author: MOCK_AUTHOR_YUKI,
    comment: "窓を開けて流したい曲たち。Lemonはサビで声を合わせたくなるし、Pretenderは夜の高速道路によく合う。ドライブの気分を作ってくれるプレイリストの常連\n\n#音楽 #ドライブ",
    borderColor: "#E8DFF3",
    markerIcon: "Music4",
  },
  {
    id: "r3",
    title: "秋に読みたい小説",
    tag: "本",
    linkCardTag: "本",
    items: ["ノルウェイの森", "夜のピクニック", "博士の愛した数式"],
    isPublic: true,
    viewCount: 185,
    bookmarkCount: 27,
    createdAt: "2025-03-05T10:00:00Z",
    updatedAt: "2025-03-05T10:00:00Z",
    author: MOCK_AUTHOR_RIN,
    comment: "涼しくなると読書が捗る。夜のピクニックは歩きながら語り合う感覚が心地よくて、秋の夜長にぴったり。博士の愛した数式は何度読んでも温かい\n\n#本 #読書",
    borderColor: "#F8EFD5",
    markerIcon: "Book",
  },
  {
    id: "r4",
    title: "ハマったゲーム",
    tag: "ゲーム",
    linkCardTag: "ゲーム",
    items: ["ゼルダの伝説 ティアキン", "Hades", "Stardew Valley"],
    isPublic: true,
    viewCount: 420,
    bookmarkCount: 63,
    createdAt: "2025-03-18T10:00:00Z",
    updatedAt: "2025-03-18T10:00:00Z",
    author: MOCK_AUTHOR_KENJI,
    comment: "寝る時間を奪われた。ティアキンは自由度が高すぎて毎回違う遊び方ができる。Stardew Valleyは「あと1日だけ」が止まらない\n\n#ゲーム",
    borderColor: "#FFE5E5",
    markerIcon: "Gamepad2",
  },
  {
    id: "r5",
    title: "推しのライブグッズ",
    tag: "推し活",
    items: ["アクリルスタンド", "ペンライト", "ツアーTシャツ"],
    isPublic: true,
    viewCount: 290,
    bookmarkCount: 41,
    createdAt: "2025-03-14T10:00:00Z",
    updatedAt: "2025-03-14T10:00:00Z",
    author: MOCK_AUTHOR_MIKA,
    comment: "部屋に飾ると毎日幸せ。アクスタはデスクの横に置いて仕事中もチラ見してる。ツアーTシャツは部屋着として最強\n\n#推し活",
    borderColor: "#DFECF8",
    markerIcon: "Sparkles",
  },
  {
    id: "r6",
    title: "自転車で走りたい道",
    tag: "アウトドア",
    items: ["しまなみ海道", "琵琶湖一周", "淡路島"],
    isPublic: true,
    viewCount: 156,
    bookmarkCount: 19,
    createdAt: "2025-03-09T10:00:00Z",
    updatedAt: "2025-03-09T10:00:00Z",
    author: MOCK_AUTHOR_SOTA,
    comment: "風を切って走る爽快感。しまなみ海道は橋から見える海が最高で、何度走っても飽きない。琵琶湖一周は達成感が段違い\n\n#アウトドア #自転車",
    borderColor: "#DCEDE2",
    markerIcon: "Bike",
  },
  {
    id: "r7",
    title: "ごほうびスイーツ",
    tag: "グルメ",
    items: ["ピエール・エルメ マカロン", "キルフェボン タルト", "ミスド ポン・デ・リング"],
    isPublic: true,
    viewCount: 510,
    bookmarkCount: 72,
    createdAt: "2025-03-20T10:00:00Z",
    updatedAt: "2025-03-20T10:00:00Z",
    author: MOCK_AUTHOR_HANAKO,
    comment: "頑張った自分にはこれ。ピエール・エルメのマカロンは色を見てるだけで気分が上がる。ミスドはポン・デ・リングの食感が癖になる",
    borderColor: "#F8E7D4",
    markerIcon: "Cake",
  },
  {
    id: "r8",
    title: "お気に入りの香り",
    tag: "暮らし",
    items: ["金木犀のルームフレグランス", "ヒノキのお風呂", "洗いたてのリネン"],
    isPublic: true,
    viewCount: 178,
    bookmarkCount: 24,
    createdAt: "2025-03-07T10:00:00Z",
    updatedAt: "2025-03-07T10:00:00Z",
    author: MOCK_AUTHOR_RIN,
    comment: "香りで気分が変わる。金木犀のフレグランスは秋を部屋に閉じ込めたみたいで好き。ヒノキのお風呂は旅館気分になれる\n\n#暮らし #香り",
    borderColor: "#E8DFF3",
    markerIcon: "Flower2",
  },
  {
    id: "r9",
    title: "寝る前のルーティン",
    tag: "暮らし",
    items: ["ストレッチ10分", "ハーブティー", "読書"],
    isPublic: true,
    viewCount: 245,
    bookmarkCount: 33,
    createdAt: "2025-02-28T10:00:00Z",
    updatedAt: "2025-02-28T10:00:00Z",
    author: MOCK_AUTHOR_DAIKI,
    comment: "これで睡眠の質が上がった。ストレッチは最初面倒だったけど、やると翌朝の体が全然違う。ハーブティーはカモミールが定番\n\n#暮らし",
    borderColor: "#F8EFD5",
    markerIcon: "Moon",
  },
  {
    id: "r10",
    title: "子どもに見せたい映画",
    tag: "映画",
    linkCardTag: "映画",
    items: ["となりのトトロ", "E.T.", "WALL·E"],
    isPublic: true,
    viewCount: 367,
    bookmarkCount: 48,
    createdAt: "2025-03-02T10:00:00Z",
    updatedAt: "2025-03-02T10:00:00Z",
    author: MOCK_AUTHOR_KENJI,
    comment: "いつか一緒に観たい。トトロは自分が子どもの頃に大好きだった作品。E.T.は友情の形を教えてくれる。WALL-Eのラストシーンは大人でも泣ける\n\n#映画",
    borderColor: "#FFE5E5",
    markerIcon: "Star",
  },
  {
    id: "r11",
    title: "地元のおすすめスポット",
    tag: "旅行",
    linkCardTag: "旅行",
    items: ["商店街の古本屋", "川沿いの遊歩道", "丘の上の展望台"],
    isPublic: true,
    viewCount: 89,
    bookmarkCount: 11,
    createdAt: "2025-03-22T10:00:00Z",
    updatedAt: "2025-03-22T10:00:00Z",
    author: MOCK_AUTHOR_SOTA,
    comment: "観光ガイドには載らない場所。古本屋は店主のセレクトが渋くて、行くたびに掘り出し物がある。展望台は夕暮れ時がおすすめ\n\n#旅行 #地元",
    borderColor: "#DFECF8",
    markerIcon: "Map",
  },
  {
    id: "r12",
    title: "作業用のお供",
    tag: "カフェ",
    linkCardTag: "カフェ",
    items: ["ドリップコーヒー", "チョコレート", "ジャズBGM"],
    isPublic: true,
    viewCount: 198,
    bookmarkCount: 26,
    createdAt: "2025-03-11T10:00:00Z",
    updatedAt: "2025-03-11T10:00:00Z",
    author: MOCK_AUTHOR_YUKI,
    comment: "この組み合わせで集中力が上がる。コーヒーはハンドドリップで丁寧に淹れる時間も含めてリフレッシュ。チョコは72%のビターが好み\n\n#カフェ #作業用",
    borderColor: "#DCEDE2",
    markerIcon: "Coffee",
  },
  {
    id: "r13",
    title: "心が落ち着くアニメ",
    tag: "アニメ",
    items: ["よつばと!", "日常", "ゆるキャン△"],
    isPublic: true,
    viewCount: 312,
    bookmarkCount: 44,
    createdAt: "2025-03-16T10:00:00Z",
    updatedAt: "2025-03-16T10:00:00Z",
    author: MOCK_AUTHOR_MIKA,
    comment: "疲れた日のお守り。ゆるキャン△はキャンプに行きたくなるし、日常のシュールさに何も考えず笑える。よつばと!は日常の小さな幸せを思い出させてくれる\n\n#アニメ",
    borderColor: "#F8E7D4",
    markerIcon: "Smile",
  },
  {
    id: "r14",
    title: "プレゼントに選ぶもの",
    tag: "暮らし",
    items: ["良い紅茶の詰め合わせ", "ハンドクリーム", "文庫本"],
    isPublic: true,
    viewCount: 134,
    bookmarkCount: 17,
    createdAt: "2025-03-19T10:00:00Z",
    updatedAt: "2025-03-19T10:00:00Z",
    author: MOCK_AUTHOR_RIN,
    comment: "もらって困らないものを選びたい。紅茶は自分では買わないちょっと良いやつを。ハンドクリームは冬のギフトの定番になってる",
    borderColor: "#E8DFF3",
    markerIcon: "Gift",
  },
  {
    id: "r15",
    title: "夏フェスの持ち物",
    tag: "音楽",
    linkCardTag: "音楽",
    items: ["折りたたみ椅子", "日焼け止め", "モバイルバッテリー"],
    isPublic: true,
    viewCount: 267,
    bookmarkCount: 38,
    createdAt: "2025-03-24T10:00:00Z",
    updatedAt: "2025-03-24T10:00:00Z",
    author: MOCK_AUTHOR_DAIKI,
    comment: "これを忘れると地獄。去年日焼け止めを忘れて真っ赤になった。モバイルバッテリーは2台持ちが安心。椅子があると待ち時間が快適\n\n#音楽 #フェス",
    borderColor: "#FFE5E5",
    markerIcon: "Flame",
  },
  {
    id: "r16",
    title: "料理初心者に教えたいレシピ",
    tag: "グルメ",
    items: ["ペペロンチーノ", "豚汁", "炊き込みごはん"],
    isPublic: true,
    viewCount: 445,
    bookmarkCount: 59,
    createdAt: "2025-03-06T10:00:00Z",
    updatedAt: "2025-03-06T10:00:00Z",
    author: MOCK_AUTHOR_HANAKO,
    comment: "失敗しにくくておいしい。ペペロンチーノはシンプルだからこそ奥が深い。豚汁は具材を変えるだけで無限にバリエーションが出る\n\n#グルメ #自炊",
    borderColor: "#DFECF8",
    markerIcon: "Pizza",
  },
  {
    id: "r17",
    title: "仕事帰りのワイン",
    tag: "グルメ",
    items: ["シャブリ", "キャンティ", "マルベック"],
    isPublic: true,
    viewCount: 102,
    bookmarkCount: 13,
    createdAt: "2025-03-21T10:00:00Z",
    updatedAt: "2025-03-21T10:00:00Z",
    author: MOCK_AUTHOR_SOTA,
    comment: "曜日で産地を変える楽しみ。金曜はちょっと奮発してシャブリを開ける。マルベックの濃さは肉料理と合わせると幸福度が跳ね上がる\n\n#グルメ #ワイン",
    borderColor: "#F8EFD5",
    markerIcon: "Wine",
  },
];

/* --- Following data --- */

const FOLLOWING_RANKINGS: MockRanking[] = [
  {
    id: "f1",
    title: "ふらっと行きたい国内旅行先",
    tag: "旅行",
    linkCardTag: "旅行",
    items: ["京都", "沖縄", "金沢"],
    isPublic: true,
    viewCount: 180,
    bookmarkCount: 22,
    createdAt: "2025-03-08T10:00:00Z",
    updatedAt: "2025-03-08T10:00:00Z",
    author: MOCK_AUTHOR_HANAKO,
    comment: "国内旅行も捨てがたい。京都は何度行っても新しい発見がある。金沢は街歩きと海鮮のセットが最高。思い立ったらすぐ行ける距離がいい\n\n#旅行 #国内",
    borderColor: "#F8E7D4",
    markerIcon: "Sun",
  },
  {
    id: "f2",
    title: "リピートしてるコスメ",
    tag: "化粧品",
    items: ["NARS ライトリフレクティング", "SUQQU シグニチャーカラーアイズ", "ADDICTION ザ アイシャドウ"],
    isPublic: true,
    viewCount: 95,
    bookmarkCount: 18,
    createdAt: "2025-03-15T10:00:00Z",
    updatedAt: "2025-03-15T10:00:00Z",
    author: MOCK_AUTHOR_YUKI,
    comment: "どれも2本目に突入してる。NARSの下地は光の当たり方が自然できれい。SUQQUのアイシャドウはラメ感が上品で、これだけで目元が決まる\n\n#化粧品 #リピ買い",
    borderColor: "#FFE5E5",
    markerIcon: "Star",
  },
  {
    id: "f3",
    title: "暮らしが変わった日用品",
    tag: "日用品",
    items: ["マーナ おさかなスポンジ", "無印良品 導入化粧液", "花王 アタックZERO"],
    isPublic: true,
    viewCount: 72,
    bookmarkCount: 11,
    createdAt: "2025-03-18T10:00:00Z",
    updatedAt: "2025-03-18T10:00:00Z",
    author: MOCK_AUTHOR_KENJI,
    comment: "地味だけど毎日の満足度が上がった。おさかなスポンジは泡立ちが良くて乾きも早い。導入化粧液は化粧水の浸透が全然違う\n\n#日用品",
    borderColor: "#DFECF8",
    markerIcon: "Leaf",
  },
  {
    id: "f4",
    title: "泣けるドキュメンタリー",
    tag: "映画",
    linkCardTag: "映画",
    items: ["Free Solo", "RBG", "はりぼて"],
    isPublic: true,
    viewCount: 134,
    bookmarkCount: 16,
    createdAt: "2025-03-10T10:00:00Z",
    updatedAt: "2025-03-10T10:00:00Z",
    author: MOCK_AUTHOR_YUKI,
    comment: "事実は小説より奇なり。Free Soloは手汗が止まらなかった。はりぼては日本のメディアの裏側を突きつけられる。どれも観た後に語りたくなる作品\n\n#映画 #ドキュメンタリー",
    borderColor: "#F8EFD5",
    markerIcon: "Film",
  },
  {
    id: "f5",
    title: "深夜ラジオの思い出",
    tag: "音楽",
    linkCardTag: "音楽",
    items: ["オールナイトニッポン", "JUNK", "Session"],
    isPublic: true,
    viewCount: 88,
    bookmarkCount: 10,
    createdAt: "2025-03-12T10:00:00Z",
    updatedAt: "2025-03-12T10:00:00Z",
    author: MOCK_AUTHOR_KENJI,
    comment: "布団の中でイヤホンで聴いてた。深夜ラジオは暗い部屋で一人だけど、なんだか誰かと繋がってる感じがした。あの頃の空気ごと好きだった\n\n#音楽 #ラジオ",
    borderColor: "#DCEDE2",
    markerIcon: "Headphones",
  },
  {
    id: "f6",
    title: "絵を描くときの道具",
    tag: "アート",
    items: ["コピック", "クリスタ", "POSCA"],
    isPublic: true,
    viewCount: 67,
    bookmarkCount: 8,
    createdAt: "2025-03-20T10:00:00Z",
    updatedAt: "2025-03-20T10:00:00Z",
    author: MOCK_AUTHOR_HANAKO,
    comment: "アナログもデジタルも好き。コピックは色のグラデーションが楽しいし、クリスタは何度でもやり直せる安心感がある。POSCAは発色が段違い\n\n#アート",
    borderColor: "#E8DFF3",
    markerIcon: "Palette",
  },
  {
    id: "f7",
    title: "飼ってみたい動物",
    tag: "暮らし",
    items: ["柴犬", "スコティッシュフォールド", "ハリネズミ"],
    isPublic: true,
    viewCount: 215,
    bookmarkCount: 29,
    createdAt: "2025-03-04T10:00:00Z",
    updatedAt: "2025-03-04T10:00:00Z",
    author: MOCK_AUTHOR_YUKI,
    comment: "動物のいる暮らしに憧れる。柴犬の忠実さとマイペースさが好き。ハリネズミは丸まった姿が反則的にかわいい\n\n#暮らし #動物",
    borderColor: "#F8E7D4",
    markerIcon: "Cat",
  },
  {
    id: "f8",
    title: "山で食べたいもの",
    tag: "アウトドア",
    items: ["カップヌードル", "おにぎり", "ドリップコーヒー"],
    isPublic: true,
    viewCount: 143,
    bookmarkCount: 20,
    createdAt: "2025-03-16T10:00:00Z",
    updatedAt: "2025-03-16T10:00:00Z",
    author: MOCK_AUTHOR_KENJI,
    comment: "山頂で食べると5倍おいしい。カップヌードルは山飯の王者。ドリップコーヒーは下山前にゆっくり飲む時間が至福\n\n#アウトドア #登山",
    borderColor: "#FFE5E5",
    markerIcon: "Mountain",
  },
  {
    id: "f9",
    title: "忘れられない旅の味",
    tag: "旅行",
    linkCardTag: "旅行",
    items: ["台湾の小籠包", "ベトナムのフォー", "ナポリのピザ"],
    isPublic: true,
    viewCount: 278,
    bookmarkCount: 37,
    createdAt: "2025-02-22T10:00:00Z",
    updatedAt: "2025-02-22T10:00:00Z",
    author: MOCK_AUTHOR_HANAKO,
    comment: "あの味を求めてまた行きたい。台湾の小籠包は路地裏の小さなお店で食べたのが一番おいしかった。ナポリのピザは生地が全然違う\n\n#旅行 #グルメ",
    borderColor: "#DFECF8",
    markerIcon: "Plane",
  },
  {
    id: "f10",
    title: "雨の日に読みたい詩集",
    tag: "本",
    linkCardTag: "本",
    items: ["谷川俊太郎 二十億光年の孤独", "茨木のり子 自分の感受性くらい", "まど・みちお てんぷらぴりぴり"],
    isPublic: true,
    viewCount: 56,
    bookmarkCount: 7,
    createdAt: "2025-03-25T10:00:00Z",
    updatedAt: "2025-03-25T10:00:00Z",
    author: MOCK_AUTHOR_YUKI,
    comment: "短い言葉が深く響く日。谷川俊太郎の詩はシンプルなのに何度読んでも新鮮。雨音をBGMにページをめくる時間が好き\n\n#本 #詩集",
    borderColor: "#F8EFD5",
    markerIcon: "Umbrella",
  },
  {
    id: "f11",
    title: "もらって嬉しいお土産",
    tag: "グルメ",
    items: ["白い恋人", "赤福", "ままどおる"],
    isPublic: true,
    viewCount: 189,
    bookmarkCount: 25,
    createdAt: "2025-03-13T10:00:00Z",
    updatedAt: "2025-03-13T10:00:00Z",
    author: MOCK_AUTHOR_KENJI,
    comment: "定番だけどやっぱり嬉しい。赤福はあんこの口溶けが唯一無二。ままどおるは福島出身の友人から毎回もらうのが楽しみ",
    borderColor: "#DCEDE2",
    markerIcon: "Gift",
  },
  {
    id: "f12",
    title: "朝の散歩で見つけた鳥",
    tag: "暮らし",
    items: ["メジロ", "シジュウカラ", "カワセミ"],
    isPublic: true,
    viewCount: 42,
    bookmarkCount: 5,
    createdAt: "2025-03-26T10:00:00Z",
    updatedAt: "2025-03-26T10:00:00Z",
    author: MOCK_AUTHOR_HANAKO,
    comment: "双眼鏡を持ち歩くようになった。カワセミは見つけた瞬間の感動が忘れられない。メジロのウグイス色が春の朝にぴったり\n\n#暮らし #野鳥",
    borderColor: "#E8DFF3",
    markerIcon: "Bird",
  },
];

/* --- Mapping --- */

function toPostCard(r: MockRanking) {
  return {
    id: r.id,
    title: r.title,
    tag: r.linkCardTag,
    items: r.items,
    comment: r.comment,
    borderColor: r.borderColor,
    markerIcon: r.markerIcon,
    author: {
      displayName: r.author.displayName,
      avatarUrl: r.author.avatarUrl ?? undefined,
      displayUserId: r.author.displayUserId ?? undefined,
    },
    viewCount: r.viewCount,
    bookmarkCount: r.bookmarkCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "myrank", label: "マイランク", icon: "☰" },
  { id: "recommend", label: "おすすめ", icon: "★" },
  { id: "following", label: "フォロー", icon: "♥" },
];

function groupByTag(
  rankings: MockRanking[]
): { tag: string; items: MockRanking[] }[] {
  const groups = new Map<string, MockRanking[]>();
  for (const ranking of rankings) {
    const existing = groups.get(ranking.tag);
    if (existing) {
      existing.push(ranking);
    } else {
      groups.set(ranking.tag, [ranking]);
    }
  }
  return Array.from(groups.entries())
    .map(([tag, items]) => ({ tag, items }))
    .sort((a, b) => a.tag.localeCompare(b.tag, "ja"));
}


/* --- Tab content components --- */

function MyRankContent({
  grouped,
  collapsedTags,
  onToggleTag,
  onNavigate,
  onViewProfile: _onViewProfile,
}: {
  grouped: { tag: string; items: MockRanking[] }[];
  collapsedTags: string[];
  onToggleTag: (tag: string) => void;
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
}) {
  // タググループの間にスレッドを挟む: 2グループ目の後、以降3グループごとに1件
  const threadInsertIndices = new Map<number, ThreadCardData>();
  let ti = 0;
  for (let gi = 0; gi < grouped.length && ti < MY_THREADS.length; gi++) {
    // 2番目のグループの後、その後は3グループごと
    if (gi === 1 || (gi > 1 && (gi - 1) % 3 === 0)) {
      threadInsertIndices.set(gi, MY_THREADS[ti]);
      ti++;
    }
  }
  // グループ数が少ない場合、残りのスレッドを最後に追加
  const trailingThreads = MY_THREADS.slice(ti);

  return (
    <div className="space-y-3">
      {/* おすすめテーマ */}
      <div className="pt-1 pb-1">
        <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>こんなテーマはどう？</p>
        <div className="flex flex-wrap gap-1.5">
          {["好きな映画", "おすすめカフェ", "旅行先ベスト", "最近の推し", "週末の過ごし方", "好きな音楽"].map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => onNavigate("ranking-new")}
              className="px-2.5 py-1 rounded-full border text-xs transition hover:bg-muted"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "transparent" }}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      {grouped.map((group, groupIdx) => {
        const isCollapsed = collapsedTags.includes(group.tag);
        const panelId = `tag-panel-${group.tag}`;
        const threadAfter = threadInsertIndices.get(groupIdx);

        return (
          <div key={group.tag}>
            <section className="space-y-1.5">
              <button
                type="button"
                onClick={() => onToggleTag(group.tag)}
                aria-expanded={!isCollapsed}
                aria-controls={panelId}
                className="flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-muted px-4 text-left transition hover:opacity-80"
              >
                <span className="text-sm font-bold text-foreground">
                  #{group.tag}
                </span>
                <span
                  className={`text-xs font-bold text-muted-foreground transition-transform ${
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </button>

              {!isCollapsed ? (
                <div
                  id={panelId}
                  className="flex flex-col space-y-2"
                >
                  {group.items.map((ranking) => {
                    const card = toPostCard(ranking);
                    return (
                      <InstagramPostCard
                        key={ranking.id}
                        ranking={card}
                        onClick={() => onNavigate("ranking-detail")}
                        onAuthorClick={
                          card.author?.displayUserId && _onViewProfile
                            ? () => _onViewProfile(card.author!.displayUserId!)
                            : undefined
                        }
                        onBookmarkClick={() => {}}
                        onShareClick={() => {}}
                        variant="list"
                      />
                    );
                  })}
                </div>
              ) : null}
            </section>

            {threadAfter && (
              <div className="mt-3">
                <ThreadCard
                  key={`thread-${threadAfter.id}`}
                  thread={threadAfter}
                  onNavigate={onNavigate}
                  onAuthorClick={
                    threadAfter.author?.displayUserId && _onViewProfile
                      ? () => _onViewProfile(threadAfter.author.displayUserId)
                      : undefined
                  }
                  onBookmarkClick={() => {}}
                  onShareClick={() => {}}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* グループ数が少なく挿入しきれなかったスレッド */}
      {trailingThreads.map((thread) => (
        <ThreadCard
          key={`thread-${thread.id}`}
          thread={thread}
          onNavigate={onNavigate}
          onAuthorClick={
            thread.author?.displayUserId && _onViewProfile
              ? () => _onViewProfile(thread.author.displayUserId)
              : undefined
          }
          onBookmarkClick={() => {}}
          onShareClick={() => {}}
        />
      ))}
    </div>
  );
}

/* --- 自分が立てたスレッド（マイランク用） --- */

const MY_THREADS: ThreadCardData[] = [
  {
    id: "my-t1",
    theme: "地元の人しか知らないグルメ",
    description: "旅行ガイドには載ってない、地元民のソウルフード。チェーン店じゃない、その土地でしか食べられない味を教えてほしい\n\n#ご当地グルメ #地元飯",
    author: { displayName: "Taro Yamada", displayUserId: "taro_y", avatarUrl: "https://i.pravatar.cc/100?u=taro_y" },
    answerCount: 8,
    createdAt: "3日前",
    borderColor: "#F8E7D4",
    tags: ["グルメ", "旅行", "地元"],
  },
  {
    id: "my-t2",
    theme: "雨の日にやりたいこと",
    description: "外に出られない日こそ楽しめることがある。読書、映画、料理、DIY。雨の日の過ごし方にはその人の「好き」が詰まってる気がする\n\n#雨の日 #インドア",
    author: { displayName: "Taro Yamada", displayUserId: "taro_y", avatarUrl: "https://i.pravatar.cc/100?u=taro_y" },
    answerCount: 14,
    createdAt: "1週間前",
    borderColor: "#DFECF8",
    tags: ["雑談", "インドア"],
  },
  {
    id: "my-t3",
    theme: "人生で一番リピートした作品",
    description: "何度観ても飽きない映画、何度読んでも新しい発見がある本、永遠にリピートしてる曲。回数じゃなくて、自分にとっての定番を語りたい\n\n#リピート #殿堂入り",
    author: { displayName: "Taro Yamada", displayUserId: "taro_y", avatarUrl: "https://i.pravatar.cc/100?u=taro_y" },
    answerCount: 23,
    createdAt: "2週間前",
    borderColor: "#E8DFF3",
    tags: ["映画", "音楽", "おすすめ"],
  },
];

const RECOMMEND_THREADS: ThreadCardData[] = [
  {
    id: "rec-t1",
    theme: "子どもの頃に好きだったもの",
    description: "大人になって忘れかけてた「好き」を思い出したい。駄菓子でも遊びでもテレビでも、ジャンル問わず教えてほしいな。懐かしさを共有できたら嬉しい\n\n#思い出 #子ども時代",
    author: { displayName: "Kenji Inoue", displayUserId: "kenji_i", avatarUrl: "https://i.pravatar.cc/100?u=kenji_inoue" },
    answerCount: 20,
    createdAt: "2週間前",
    borderColor: "#DCEDE2",
    tags: ["雑談", "思い出"],
  },
  {
    id: "rec-t2",
    theme: "最近発見したお気に入りの場所",
    description: "散歩中にふらっと見つけたカフェとか、通りすがりの公園とか。ガイドブックに載ってない「自分だけの場所」を知りたい。近所の穴場でもOK\n\n#散歩 #穴場",
    author: { displayName: "Yumi Honda", displayUserId: "yumi_h", avatarUrl: "https://picsum.photos/seed/yumi_garden/100/100" },
    answerCount: 14,
    createdAt: "3日前",
    borderColor: "#FFE5E5",
    tags: ["カフェ", "東京"],
  },
  {
    id: "rec-t3",
    theme: "忘れられない味",
    description: "旅先で食べたあの料理、おばあちゃんの味、初めてのデートで行ったお店。記憶と結びついた味の話を聞いてみたい。きっとその人の物語が見える\n\n#グルメ #思い出の味",
    author: { displayName: "Takeshi Ono", displayUserId: "takeshi_o", avatarUrl: "https://i.pravatar.cc/100?u=takeshi_ono" },
    answerCount: 31,
    createdAt: "1日前",
    borderColor: "#E8DFF3",
    tags: ["グルメ", "旅行"],
  },
  {
    id: "rec-t4",
    theme: "朝起きてまずやること",
    description: "カーテンを開ける？スマホを見る？ストレッチする？朝のルーティンってその人の生き方が出る気がする。理想じゃなくてリアルなやつを教えて\n\n#朝活 #ルーティン",
    author: { displayName: "Saki Nishida", displayUserId: "saki_n", avatarUrl: "https://picsum.photos/seed/saki_sunrise/100/100" },
    answerCount: 18,
    createdAt: "4日前",
    borderColor: "#F8EFD5",
    tags: ["雑談", "おすすめ"],
  },
  {
    id: "rec-t5",
    theme: "推しに出会ったきっかけ",
    description: "友達に勧められた？たまたまMVを観た？推しとの出会いは運命みたいなものだと思う。最初の衝撃を語り合いたい\n\n#推し活 #出会い",
    author: { displayName: "Ren Takahashi", displayUserId: "ren_t", avatarUrl: "https://i.pravatar.cc/100?u=ren_takahashi" },
    answerCount: 42,
    createdAt: "6日前",
    borderColor: "#DFECF8",
    tags: ["音楽", "J-POP"],
  },
  {
    id: "rec-t6",
    theme: "一人の時間の過ごし方",
    description: "一人でいることは寂しいことじゃなくて、自分と向き合える贅沢な時間。映画を観る、散歩する、何もしない。みんなの「ひとり時間」を聞いてみたい\n\n#ひとり時間",
    author: { displayName: "Mai Tanaka", displayUserId: "mai_t", avatarUrl: null },
    answerCount: 11,
    createdAt: "1週間前",
    borderColor: "#F8E7D4",
    tags: ["雑談", "おすすめ"],
  },
  {
    id: "rec-t7",
    theme: "季節の変わり目に聴く曲",
    description: "春から夏、夏から秋。空気が変わると聴きたくなる曲ってあるよね。季節の境目にしっくりくる1曲を教えてほしい\n\n#音楽 #季節",
    author: { displayName: "Daiki Ogawa", displayUserId: "daiki_o", avatarUrl: "https://picsum.photos/seed/daiki_sunset/100/100" },
    answerCount: 7,
    createdAt: "5日前",
    borderColor: "#DCEDE2",
    tags: ["音楽", "J-POP"],
  },
];

function RecommendContent({
  onNavigate,
  onViewProfile: _onViewProfile,
}: {
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
}) {
  const allCards: PostCardRanking[] = RECOMMEND_RANKINGS.map(toPostCard);
  const feed = interleaveFeed(allCards, RECOMMEND_THREADS);

  return (
    <div className="flex flex-col space-y-2">
      {feed.map((item) =>
        item.kind === "post" ? (
          <InstagramPostCard
            key={`post-${item.data.id}`}
            ranking={item.data}
            onClick={() => onNavigate("ranking-detail")}
            onAuthorClick={
              item.data.author?.displayUserId && _onViewProfile
                ? () => _onViewProfile(item.data.author!.displayUserId!)
                : undefined
            }
            onBookmarkClick={() => {}}
            onShareClick={() => {}}
            variant="list"
          />
        ) : (
          <ThreadCard
            key={`thread-${item.data.id}`}
            thread={item.data}
            onNavigate={onNavigate}
            onAuthorClick={
              item.data.author?.displayUserId && _onViewProfile
                ? () => _onViewProfile(item.data.author.displayUserId)
                : undefined
            }
            onBookmarkClick={() => {}}
            onShareClick={() => {}}
          />
        ),
      )}
    </div>
  );
}

const FOLLOWING_THREADS: ThreadCardData[] = [
  {
    id: "fol-t1",
    theme: "旅行先でかならず食べるもの",
    description: "その土地でしか食べられないものを探す旅が好き。定番の名物でも、ローカルな屋台でも。旅の目的が「食」な人、語ろう\n\n#旅行 #ご当地グルメ",
    author: { displayName: "Hana Mori", displayUserId: "hana_m", avatarUrl: "https://i.pravatar.cc/100?u=hana_mori" },
    answerCount: 9,
    createdAt: "5日前",
    borderColor: "#F8E7D4",
    tags: ["旅行", "グルメ"],
  },
  {
    id: "fol-t2",
    theme: "ペットとの思い出エピソード",
    description: "一緒に過ごした何気ない瞬間が宝物になってる。笑ったこと、困ったこと、泣いたこと。ペットがくれた愛の話を聞かせてほしい\n\n#ペット #思い出",
    author: { displayName: "Yuki Sato", displayUserId: "yuki_s", avatarUrl: "https://i.pravatar.cc/100?u=yuki_sato" },
    answerCount: 16,
    createdAt: "2日前",
    borderColor: "#FFE5E5",
    tags: ["雑談", "思い出"],
  },
  {
    id: "fol-t3",
    theme: "最近買ってよかったもの",
    description: "地味な日用品から衝動買いのガジェットまで。買ってよかった！ってQOLが上がった瞬間を共有しよう。口コミより信頼できる生の声を集めたい\n\n#買い物 #QOL",
    author: { displayName: "Kenji Suzuki", displayUserId: "kenji_sz", avatarUrl: "https://picsum.photos/seed/kenji_landscape/100/100" },
    answerCount: 22,
    createdAt: "1日前",
    borderColor: "#DFECF8",
    tags: ["日用品", "おすすめ"],
  },
  {
    id: "fol-t4",
    theme: "帰り道に寄るお店",
    description: "仕事帰りに立ち寄るコンビニ、週末だけ行くパン屋、気分転換の本屋。帰り道のちょっとした楽しみが1日を締めくくってくれる\n\n#帰り道 #日常",
    author: { displayName: "Hanako Tanaka", displayUserId: "hanako_t", avatarUrl: "https://picsum.photos/seed/hanako_portrait/100/100" },
    answerCount: 8,
    createdAt: "4日前",
    borderColor: "#DCEDE2",
    tags: ["カフェ", "雑談"],
  },
  {
    id: "fol-t5",
    theme: "休日のモーニングルーティン",
    description: "平日とは違う朝の過ごし方。ゆっくりコーヒーを淹れる人も、早朝ランニングする人も。休日の朝のリアルを知りたい\n\n#休日 #モーニング",
    author: { displayName: "Sota Nakamura", displayUserId: "sota_n", avatarUrl: "https://picsum.photos/seed/sota_cycling/100/100" },
    answerCount: 13,
    createdAt: "3日前",
    borderColor: "#E8DFF3",
    tags: ["雑談", "おすすめ"],
  },
];

function FollowingContent({
  onNavigate,
  onViewProfile: _onViewProfile,
}: {
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
}) {
  const allCards: PostCardRanking[] = FOLLOWING_RANKINGS.map(toPostCard);
  const feed = interleaveFeed(allCards, FOLLOWING_THREADS);

  return (
    <div className="flex flex-col space-y-2">
      {feed.map((item) =>
        item.kind === "post" ? (
          <InstagramPostCard
            key={`post-${item.data.id}`}
            ranking={item.data}
            onClick={() => onNavigate("ranking-detail")}
            onAuthorClick={
              item.data.author?.displayUserId && _onViewProfile
                ? () => _onViewProfile(item.data.author!.displayUserId!)
                : undefined
            }
            onBookmarkClick={() => {}}
            onShareClick={() => {}}
            variant="list"
          />
        ) : (
          <ThreadCard
            key={`thread-${item.data.id}`}
            thread={item.data}
            onNavigate={onNavigate}
            onAuthorClick={
              item.data.author?.displayUserId && _onViewProfile
                ? () => _onViewProfile(item.data.author.displayUserId)
                : undefined
            }
            onBookmarkClick={() => {}}
            onShareClick={() => {}}
          />
        ),
      )}
    </div>
  );
}

/* --- Main screen --- */

export function RankingListScreen({
  onNavigate,
  activeTab: externalTab,
  onTabChange,
  onSidebarToggle,
  onViewProfile,
}: RankingListScreenProps) {
  const [internalTab, setInternalTab] = useState<TabId>("myrank");
  const activeTab = externalTab ?? internalTab;

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (onTabChange) {
        onTabChange(tab);
      } else {
        setInternalTab(tab);
      }
    },
    [onTabChange]
  );

  const [collapsedTags, setCollapsedTags] = useState<string[]>([]);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const toggleTagAccordion = useCallback((tag: string) => {
    setCollapsedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const grouped = groupByTag(MOCK_RANKINGS);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto px-4 py-6 pb-[76px]">
        <div className={activeTab !== "myrank" ? "hidden" : undefined}>
          <MyRankContent
            grouped={grouped}
            collapsedTags={collapsedTags}
            onToggleTag={toggleTagAccordion}
            onNavigate={onNavigate}
            onViewProfile={onViewProfile}
          />
        </div>

        <div className={activeTab !== "recommend" ? "hidden" : undefined}>
          <RecommendContent onNavigate={onNavigate} onViewProfile={onViewProfile} />
        </div>

        <div className={activeTab !== "following" ? "hidden" : undefined}>
          <FollowingContent onNavigate={onNavigate} onViewProfile={onViewProfile} />
        </div>
      </div>

      {/* FAB + 作成メニュー */}
      {isFabMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
          onClick={() => setIsFabMenuOpen(false)}
        />
      )}

      {/* ボトムシート風メニュー */}
      <div
        className={[
          "fixed bottom-[60px] left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2",
          "transition-all duration-200 ease-out",
          isFabMenuOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none",
        ].join(" ")}
        role="menu"
        aria-label="投稿タイプを選択"
      >
        <div className="mx-4 mb-4 rounded-2xl bg-card shadow-lg border border-border overflow-hidden">
          <button
            type="button"
            role="menuitem"
            aria-label="ランキングを投稿"
            onClick={() => {
              setIsFabMenuOpen(false);
              onNavigate("ranking-new");
            }}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted active:bg-muted"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">ランキングを投稿</p>
              <p className="text-xs text-muted-foreground">好きなもの3つをテーマで共有</p>
            </div>
          </button>

          <div className="h-px bg-border mx-3" />

          <button
            type="button"
            role="menuitem"
            aria-label="スレッドを立てる"
            onClick={() => {
              setIsFabMenuOpen(false);
              onNavigate("thread-create");
            }}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted active:bg-muted"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">スレッドを立てる</p>
              <p className="text-xs text-muted-foreground">質問・話題を投げかける</p>
            </div>
          </button>
        </div>
      </div>

      {/* FAB ボタン */}
      <div className="fixed bottom-[76px] left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 pointer-events-none">
        <button
          type="button"
          aria-label="投稿メニューを開く"
          aria-haspopup="menu"
          aria-expanded={isFabMenuOpen}
          onClick={() => setIsFabMenuOpen((prev) => !prev)}
          className={[
            "pointer-events-auto absolute right-4 bottom-0",
            "flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg",
            "transition-all duration-200 hover:opacity-90 active:scale-95",
            isFabMenuOpen ? "rotate-45" : "rotate-0",
          ].join(" ")}
        >
          <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom tab navigation */}
      <nav className="fixed bottom-0 left-1/2 z-40 flex h-[60px] w-full max-w-[480px] -translate-x-1/2 rounded-t-lg border-x border-t border-border bg-card">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className="relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 bg-transparent transition"
              style={{
                color: isActive
                  ? "var(--primary)"
                  : "var(--muted-foreground)",
              }}
            >
              {isActive ? (
                <span className="absolute left-4 right-4 top-0 h-0.5 rounded-full bg-primary" />
              ) : null}
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="h-[60px]" aria-hidden="true" />
    </div>
  );
}
