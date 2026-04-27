import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";
import { InstagramPostCard } from "./shared/InstagramPostCard";
import type { PostCardRanking } from "./shared/InstagramPostCard";
import { ThreadCard } from "./shared/ThreadCard";
import type { ThreadCardData } from "./shared/ThreadCard";

interface UserProfileScreenProps {
  onNavigate: (screen: Screen) => void;
  isOwnProfile?: boolean;
  onSidebarToggle?: () => void;
  viewingUserId?: string | null;
  onViewProfile?: (userId: string | null) => void;
}

interface MockRanking {
  id: string;
  title: string;
  tagName: string;
  /** リンクカード表示用タグ。未指定の投稿はリンクカードを表示しない */
  linkCardTag?: string;
  items: string[];
  authorName: string;
  authorId: string;
  authorAvatarUrl?: string;
  viewCount: number;
  bookmarkCount: number;
  updatedAt: string;
  comment?: string;
  borderColor: string;
  markerIcon: string;
}

interface MockCommentedPost {
  id: string;
  commenterName: string;
  commenterId: string;
  comment: string;
  commentedAt: string;
  ranking: MockRanking;
}

interface MockThread {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorId: string;
  authorAvatarUrl?: string;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  tagName?: string;
  tags?: string[];
}

interface MockProfile {
  displayName: string;
  displayUserId: string;
  avatarUrl: string | null;
  introduction: string;
  links: { url: string }[];
  publicRankingCount: number;
  followingCount: number;
  followerCount: number;
}

// ---------------------------------------------------------------------------
// selfAuthor: 自分タブで全投稿に統一適用する author
// ---------------------------------------------------------------------------

const SELF_AUTHOR: PostCardRanking["author"] = {
  displayName: "あなた",
  avatarUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=80&h=80&fit=crop",
  displayUserId: "taro_y",
};

const MOCK_PROFILE: MockProfile = {
  displayName: "Taro Yamada",
  displayUserId: "taro_y",
  avatarUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=160&h=160&fit=crop",
  introduction: "映画とカフェが好きです。週末はいつも映画館に行ってます。最近は音楽とスキンケアにも興味あり。",
  links: [
    { url: "https://x.com/taro_y" },
    { url: "https://github.com/taro-yamada" },
  ],
  publicRankingCount: 6,
  followingCount: 34,
  followerCount: 56,
};

const OTHER_PROFILES: Record<string, MockProfile> = {
  hanako_t: {
    displayName: "Hanako Tanaka",
    displayUserId: "hanako_t",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    introduction: "映画と旅行が大好き。最近はドキュメンタリーにハマってます。",
    links: [{ url: "https://x.com/hanako_t" }],
    publicRankingCount: 8,
    followingCount: 45,
    followerCount: 120,
  },
  yuki_s: {
    displayName: "Yuki Sato",
    displayUserId: "yuki_s",
    avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=80&h=80&fit=crop",
    introduction: "音楽とカフェ巡りが趣味。J-POPからインディーズまで幅広く聴きます。",
    links: [{ url: "https://x.com/yuki_s" }],
    publicRankingCount: 6,
    followingCount: 28,
    followerCount: 85,
  },
  kenji_sz: {
    displayName: "Kenji Suzuki",
    displayUserId: "kenji_sz",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
    introduction: "日用品オタク。便利グッズを見つけるのが生きがい。",
    links: [],
    publicRankingCount: 4,
    followingCount: 15,
    followerCount: 32,
  },
  rina_m: {
    displayName: "Rina Matsuda",
    displayUserId: "rina_m",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    introduction: "化粧品レビューが趣味。デパコスからプチプラまで幅広くチェックしてます。肌に合うものを探す旅の途中。",
    links: [
      { url: "https://www.instagram.com/rina_beauty" },
      { url: "https://x.com/rina_m" },
    ],
    publicRankingCount: 18,
    followingCount: 72,
    followerCount: 310,
  },
  takeshi_w: {
    displayName: "渡辺タケシ",
    displayUserId: "takeshi_w",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    introduction: "料理と旅行が生きがい。47都道府県制覇まであと3県。ご当地グルメのランキングを作ってます。",
    links: [{ url: "https://youtube.com/@takeshi_travels" }],
    publicRankingCount: 22,
    followingCount: 38,
    followerCount: 145,
  },
  aoi_k: {
    displayName: "葵",
    displayUserId: "aoi_k",
    avatarUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=80&h=80&fit=crop",
    introduction: "読書とカフェ巡りの記録用。静かな場所で本を読む時間が一番好き。",
    links: [],
    publicRankingCount: 5,
    followingCount: 12,
    followerCount: 28,
  },
};

const OTHER_RANKINGS: Record<string, MockRanking[]> = {
  hanako_t: [
    {
      id: "other-h1",
      title: "おすすめ邦画3選",
      tagName: "映画",
      linkCardTag: "映画",
      items: ["万引き家族", "ドライブ・マイ・カー", "そして父になる"],
      authorName: "Hanako Tanaka",
      authorId: "hanako_t",
      viewCount: 210,
      bookmarkCount: 34,
      updatedAt: "2日前",
      comment: "どれも心に残る作品 #映画",
      borderColor: "#FFE5E5",
      markerIcon: "Film",
    },
    {
      id: "other-h2",
      title: "旅行先おすすめTOP3",
      tagName: "旅行",
      linkCardTag: "旅行",
      items: ["京都", "沖縄", "北海道"],
      authorName: "Hanako Tanaka",
      authorId: "hanako_t",
      viewCount: 180,
      bookmarkCount: 22,
      updatedAt: "5日前",
      borderColor: "#FFE5E5",
      markerIcon: "Sun",
    },
    {
      id: "other-h3",
      title: "推しリップまとめ",
      tagName: "化粧品",
      items: ["NARS パワーマットリップ", "Dior アディクトリップ", "MAC リップスティック"],
      authorName: "Hanako Tanaka",
      authorId: "hanako_t",
      viewCount: 425,
      bookmarkCount: 38,
      updatedAt: "1週間前",
      comment: "色持ちで選ぶならこの3本 #化粧品",
      borderColor: "#FFE5E5",
      markerIcon: "Heart",
    },
  ],
  yuki_s: [
    {
      id: "other-y1",
      title: "好きなJ-POP TOP3",
      tagName: "音楽",
      linkCardTag: "音楽",
      items: ["Lemon - 米津玄師", "夜に駆ける - YOASOBI", "Pretender - Official髭男dism"],
      authorName: "Yuki Sato",
      authorId: "yuki_s",
      viewCount: 340,
      bookmarkCount: 56,
      updatedAt: "1日前",
      borderColor: "#FFE5E5",
      markerIcon: "Music4",
    },
    {
      id: "other-y2",
      title: "渋谷カフェ巡りTOP3",
      tagName: "カフェ",
      linkCardTag: "カフェ",
      items: ["ABOUT LIFE COFFEE", "Fuglen Tokyo", "CAMELBACK sandwich&espresso"],
      authorName: "Yuki Sato",
      authorId: "yuki_s",
      viewCount: 198,
      bookmarkCount: 17,
      updatedAt: "4日前",
      comment: "休日にふらっと寄りたい店 #カフェ",
      borderColor: "#FFE5E5",
      markerIcon: "Coffee",
    },
  ],
  kenji_sz: [
    {
      id: "other-k1",
      title: "買ってよかった日用品",
      tagName: "日用品",
      items: ["珪藻土バスマット", "ドラム式洗濯機", "ボタニストシャンプー"],
      authorName: "Kenji Suzuki",
      authorId: "kenji_sz",
      viewCount: 203,
      bookmarkCount: 12,
      updatedAt: "4日前",
      comment: "どれも生活が変わったアイテム #日用品",
      borderColor: "#FFE5E5",
      markerIcon: "Star",
    },
  ],
  rina_m: [
    {
      id: "other-r1",
      title: "夏のベースメイクTOP3",
      tagName: "化粧品",
      items: ["NARS ライトリフレクティング", "Dior バックステージ", "PAUL & JOE プロテクティング"],
      authorName: "Rina Matsuda",
      authorId: "rina_m",
      viewCount: 612,
      bookmarkCount: 48,
      updatedAt: "3日前",
      comment: "崩れにくさ重視で選んだ #化粧品",
      borderColor: "#FFE5E5",
      markerIcon: "Smile",
    },
    {
      id: "other-r2",
      title: "プチプラスキンケアBEST3",
      tagName: "化粧品",
      items: ["ハトムギ化粧水", "メラノCC美容液", "肌ラボ極潤"],
      authorName: "Rina Matsuda",
      authorId: "rina_m",
      viewCount: 890,
      bookmarkCount: 67,
      updatedAt: "1週間前",
      borderColor: "#FFE5E5",
      markerIcon: "Leaf",
    },
  ],
  takeshi_w: [
    {
      id: "other-t1",
      title: "九州ご当地グルメ3選",
      tagName: "旅行",
      linkCardTag: "旅行",
      items: ["博多ラーメン", "長崎ちゃんぽん", "鹿児島黒豚"],
      authorName: "渡辺タケシ",
      authorId: "takeshi_w",
      viewCount: 445,
      bookmarkCount: 35,
      updatedAt: "2日前",
      comment: "どれも現地で食べてほしい #旅行",
      borderColor: "#FFE5E5",
      markerIcon: "Sun",
    },
    {
      id: "other-t2",
      title: "東北温泉ランキング",
      tagName: "旅行",
      items: ["銀山温泉", "乳頭温泉", "蔵王温泉"],
      authorName: "渡辺タケシ",
      authorId: "takeshi_w",
      viewCount: 278,
      bookmarkCount: 21,
      updatedAt: "1週間前",
      borderColor: "#FFE5E5",
      markerIcon: "Cloud",
    },
  ],
  aoi_k: [
    {
      id: "other-a1",
      title: "今年読んでよかった本3選",
      tagName: "映画",
      linkCardTag: "本",
      items: ["コンビニ人間", "推し、燃ゆ", "同志少女よ、敵を撃て"],
      authorName: "葵",
      authorId: "aoi_k",
      viewCount: 134,
      bookmarkCount: 9,
      updatedAt: "6日前",
      comment: "どれも一気読みした #映画",
      borderColor: "#FFE5E5",
      markerIcon: "Book",
    },
  ],
};

function getProfileForUser(userId: string | null | undefined): MockProfile {
  if (!userId || userId === "taro_y") {
    return MOCK_PROFILE;
  }
  return OTHER_PROFILES[userId] ?? {
    displayName: userId,
    displayUserId: userId,
    avatarUrl: null,
    introduction: "",
    links: [],
    publicRankingCount: 0,
    followingCount: 0,
    followerCount: 0,
  };
}

function getRankingsForUser(userId: string | null | undefined): MockRanking[] {
  if (!userId || userId === "taro_y") {
    return MOCK_POST_RANKINGS;
  }
  return OTHER_RANKINGS[userId] ?? [];
}

function toPostCardRanking(
  ranking: MockRanking,
  overrideAuthor?: PostCardRanking["author"],
): PostCardRanking {
  return {
    id: ranking.id,
    title: ranking.title,
    tag: ranking.linkCardTag,
    items: ranking.items.slice(0, 3),
    comment: ranking.comment,
    borderColor: ranking.borderColor,
    markerIcon: ranking.markerIcon,
    author: overrideAuthor ?? {
      displayName: ranking.authorName,
      avatarUrl: ranking.authorAvatarUrl,
      displayUserId: ranking.authorId,
    },
    viewCount: ranking.viewCount,
    bookmarkCount: ranking.bookmarkCount,
    updatedAt: ranking.updatedAt,
  };
}

const MOCK_POST_RANKINGS: MockRanking[] = [
  {
    id: "p1",
    title: "映画トップ3",
    tagName: "映画",
    linkCardTag: "映画",
    items: [
      "ショーシャンクの空に",
      "ゴッドファーザー",
      "ダークナイト",
    ],
    authorName: "Taro Yamada",
    authorId: "taro_y",
    viewCount: 128,
    bookmarkCount: 5,
    updatedAt: "3時間前",
    comment: "何度見ても色褪せない名作たち。ショーシャンクは観るたびに新しい発見がある。ラストシーンの美しさは映画史に残る。\n#映画 #洋画 #名作",
    borderColor: "#FFE5E5",
    markerIcon: "Film",
  },
  {
    id: "p2",
    title: "東京カフェベスト3",
    tagName: "カフェ",
    linkCardTag: "カフェ",
    items: [
      "ブルーボトルコーヒー",
      "猿田彦珈琲",
      "STREAMER COFFEE",
    ],
    authorName: "Taro Yamada",
    authorId: "taro_y",
    viewCount: 89,
    bookmarkCount: 3,
    updatedAt: "1日前",
    comment: "休日の朝に行くのが至福。どの店もこだわりの豆を使っていて、空間の居心地も抜群。特に猿田彦のドリップは毎回感動する。\n#カフェ #東京カフェ巡り",
    borderColor: "#DFECF8",
    markerIcon: "Coffee",
  },
  {
    id: "p3",
    title: "旅行で行きたい場所",
    tagName: "旅行",
    linkCardTag: "旅行",
    items: [
      "京都",
      "鎌倉",
      "奈良",
    ],
    authorName: "Taro Yamada",
    authorId: "taro_y",
    viewCount: 45,
    bookmarkCount: 1,
    updatedAt: "3日前",
    comment: "歴史ある街並みが好き。京都の朝の静けさ、鎌倉の海沿いの風、奈良の鹿と大仏。どこも何度行っても飽きない場所。\n#旅行 #国内旅行",
    borderColor: "#F8EFD5",
    markerIcon: "Sun",
  },
  {
    id: "p4",
    title: "毎日使う日用品ベスト3",
    tagName: "日用品",
    items: [
      "Anker充電器",
      "無印良品アロマディフューザー",
      "BALMUDA The Toaster",
    ],
    authorName: "Taro Yamada",
    authorId: "taro_y",
    viewCount: 210,
    bookmarkCount: 14,
    updatedAt: "5日前",
    comment: "地味だけど生活の質が上がるアイテムたち。特にBALMUDAのトースターは食パンの概念が変わった。毎朝のトーストが楽しみになる。\n#日用品 #QOL",
    borderColor: "#DCEDE2",
    markerIcon: "Star",
  },
  {
    id: "p5",
    title: "好きなアーティスト3選",
    tagName: "音楽",
    linkCardTag: "音楽",
    items: [
      "米津玄師",
      "King Gnu",
      "藤井風",
    ],
    authorName: "Taro Yamada",
    authorId: "taro_y",
    viewCount: 302,
    bookmarkCount: 22,
    updatedAt: "1週間前",
    comment: "歌詞の世界観が深いアーティストが好き。米津玄師のMVは映像作品としても素晴らしい。King Gnuのライブは一度行くと沼。\n#音楽 #JPOP #ライブ",
    borderColor: "#E8DFF3",
    markerIcon: "Music4",
  },
  {
    id: "p6",
    title: "スキンケアおすすめ3選",
    tagName: "化粧品",
    items: [
      "IPSA ザ・タイムR アクア",
      "Obagi C25 セラム",
      "Aesop フェイシャルクレンザー",
    ],
    authorName: "Taro Yamada",
    authorId: "taro_y",
    viewCount: 67,
    bookmarkCount: 2,
    updatedAt: "2週間前",
    comment: "季節の変わり目に頼れるラインナップ。IPSAの化粧水は肌荒れしにくくて安定感がある。ObagiはビタミンC濃度が高くて即効性を感じる。\n#化粧品 #スキンケア",
    borderColor: "#F8E7D4",
    markerIcon: "Leaf",
  },
];

// ---------------------------------------------------------------------------
// スレッドモックデータ
// ---------------------------------------------------------------------------

const SELF_THREADS: MockThread[] = [
  {
    id: "st1",
    title: "映画好きに聞きたい：「何度も観返す映画」ってある？",
    body: "名作と言われてるけど1回で満足する映画と、何度も観たくなる映画って違うと思ってて。皆さんの「つい観返しちゃう映画」を教えてほしいです。",
    authorName: "Taro Yamada",
    authorId: "taro_y",
    authorAvatarUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=80&h=80&fit=crop",
    replyCount: 12,
    viewCount: 234,
    createdAt: "2時間前",
    tagName: "映画",
    tags: ["映画", "邦画"],
  },
  {
    id: "st2",
    title: "東京でひとりカフェするならどこがいい？",
    body: "休日にひとりでゆっくりできるカフェを探してます。Wi-Fiとコンセントがあると嬉しい。",
    authorName: "Taro Yamada",
    authorId: "taro_y",
    authorAvatarUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=80&h=80&fit=crop",
    replyCount: 8,
    viewCount: 156,
    createdAt: "1日前",
    tagName: "カフェ",
    tags: ["カフェ", "東京"],
  },
  {
    id: "st3",
    title: "スキンケア、朝と夜で変えてる？",
    body: "最近スキンケアに凝り始めたんだけど、朝と夜で使い分けるべきなのか迷ってる。みんなどうしてる？",
    authorName: "Taro Yamada",
    authorId: "taro_y",
    authorAvatarUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=80&h=80&fit=crop",
    replyCount: 15,
    viewCount: 310,
    createdAt: "3日前",
    tagName: "化粧品",
    tags: ["化粧品", "おすすめ"],
  },
];

const OTHER_THREADS: Record<string, MockThread[]> = {
  hanako_t: [
    {
      id: "ot-h1",
      title: "邦画で泣ける映画を教えて",
      body: "最近涙活したくて。おすすめの泣ける邦画があったら教えてください。",
      authorName: "Hanako Tanaka",
      authorId: "hanako_t",
      authorAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
      replyCount: 18,
      viewCount: 412,
      createdAt: "1日前",
      tagName: "映画",
      tags: ["映画", "邦画"],
    },
  ],
  yuki_s: [
    {
      id: "ot-y1",
      title: "フェスに持っていくべきもの3つ",
      body: "今年初めて夏フェスに行くんだけど、絶対持っていった方がいいものって何？",
      authorName: "Yuki Sato",
      authorId: "yuki_s",
      authorAvatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=80&h=80&fit=crop",
      replyCount: 22,
      viewCount: 567,
      createdAt: "3日前",
      tagName: "音楽",
      tags: ["音楽", "J-POP"],
    },
  ],
  kenji_sz: [
    {
      id: "ot-k1",
      title: "一人暮らしで本当に必要な家電って？",
      body: "引っ越し予定なんだけど、最低限これは買っとけっていう家電ある？",
      authorName: "Kenji Suzuki",
      authorId: "kenji_sz",
      authorAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
      replyCount: 30,
      viewCount: 890,
      createdAt: "5日前",
      tagName: "日用品",
      tags: ["日用品", "おすすめ"],
    },
  ],
  rina_m: [
    {
      id: "ot-r1",
      title: "乾燥肌におすすめのファンデーションは？",
      body: "冬になると粉吹きが気になる...。乾燥肌でもきれいに仕上がるファンデーションを探してます。",
      authorName: "Rina Matsuda",
      authorId: "rina_m",
      authorAvatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
      replyCount: 25,
      viewCount: 678,
      createdAt: "2日前",
      tagName: "化粧品",
      tags: ["化粧品", "おすすめ"],
    },
  ],
  takeshi_w: [
    {
      id: "ot-t1",
      title: "47都道府県で一番ご飯が美味しかったところは？",
      body: "旅行先のご飯が一番の楽しみ。皆さんが行って「ここのご飯最高だった！」っていう県を教えて。",
      authorName: "渡辺タケシ",
      authorId: "takeshi_w",
      authorAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
      replyCount: 45,
      viewCount: 1230,
      createdAt: "4日前",
      tagName: "旅行",
      tags: ["旅行", "グルメ"],
    },
  ],
  aoi_k: [
    {
      id: "ot-a1",
      title: "読書記録ってどうやってつけてる？",
      body: "読んだ本の感想を残したいんだけど、アプリ？ノート？皆さんの方法を知りたい。",
      authorName: "葵",
      authorId: "aoi_k",
      authorAvatarUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=80&h=80&fit=crop",
      replyCount: 11,
      viewCount: 198,
      createdAt: "1週間前",
      tags: ["雑談", "おすすめ"],
    },
  ],
};

function getThreadsForUser(userId: string | null | undefined): MockThread[] {
  if (!userId || userId === "taro_y") {
    return SELF_THREADS;
  }
  return OTHER_THREADS[userId] ?? [];
}

/** タグ名からスレッドのボーダー色を導出する */
function threadBorderColor(tagName?: string): string {
  switch (tagName) {
    case "映画": return "#FFE5E5";
    case "カフェ": return "#DFECF8";
    case "旅行": return "#F8EFD5";
    case "日用品": return "#DCEDE2";
    case "音楽": return "#E8DFF3";
    case "化粧品": return "#F8E7D4";
    default: return "#E0E0E0";
  }
}

function toThreadCardData(thread: MockThread): ThreadCardData {
  return {
    id: thread.id,
    theme: thread.title,
    description: thread.body,
    tag: thread.tagName,
    author: {
      displayName: thread.authorName,
      displayUserId: thread.authorId,
      avatarUrl: thread.authorAvatarUrl ?? null,
    },
    answerCount: thread.replyCount,
    createdAt: thread.createdAt,
    borderColor: threadBorderColor(thread.tagName),
    tags: thread.tags,
  };
}

const MOCK_COMMENTED_POSTS: MockCommentedPost[] = [
  {
    id: "cp1",
    commenterName: "Taro Yamada",
    commenterId: "taro_y",
    comment:
      "この映画は本当に名作！ショーシャンクは何度見ても泣ける",
    commentedAt: "5時間前",
    ranking: {
      id: "cp1-ref",
      title: "おすすめ洋画3選",
      tagName: "映画",
      items: [
        "ショーシャンクの空に",
        "インターステラー",
        "グリーンブック",
      ],
      authorName: "Hanako Tanaka",
      authorId: "hanako_t",
      viewCount: 312,
      bookmarkCount: 15,
      updatedAt: "1日前",
      borderColor: "#FFE5E5",
      markerIcon: "Film",
    },
  },
  {
    id: "cp2",
    commenterName: "Taro Yamada",
    commenterId: "taro_y",
    comment: "金沢のカフェ巡り最高だった！次は鎌倉も行きたい",
    commentedAt: "2日前",
    ranking: {
      id: "cp2-ref",
      title: "金沢おすすめカフェ",
      tagName: "カフェ",
      items: [
        "HUM&Go#",
        "東出珈琲店",
        "cafe & gallery Musee",
      ],
      authorName: "Yuki Sato",
      authorId: "yuki_s",
      viewCount: 87,
      bookmarkCount: 4,
      updatedAt: "3日前",
      borderColor: "#DFECF8",
      markerIcon: "Coffee",
    },
  },
  {
    id: "cp3",
    commenterName: "Taro Yamada",
    commenterId: "taro_y",
    comment: "沖縄の海は本当に綺麗だった。次は離島にも行きたい",
    commentedAt: "3日前",
    ranking: {
      id: "cp3-ref",
      title: "国内旅行ベスト3",
      tagName: "旅行",
      items: [
        "沖縄",
        "北海道",
        "京都",
      ],
      authorName: "Kenji Suzuki",
      authorId: "kenji_sz",
      viewCount: 156,
      bookmarkCount: 8,
      updatedAt: "2日前",
      borderColor: "#F8EFD5",
      markerIcon: "Sun",
    },
  },
  {
    id: "cp4",
    commenterName: "Taro Yamada",
    commenterId: "taro_y",
    comment: "3つ目のシャンプー使ってみたけど確かに良い。リピートする",
    commentedAt: "5日前",
    ranking: {
      id: "cp4-ref",
      title: "買ってよかった日用品",
      tagName: "日用品",
      items: [
        "珪藻土バスマット",
        "ドラム式洗濯機",
        "ボタニストシャンプー",
      ],
      authorName: "Kenji Suzuki",
      authorId: "kenji_sz",
      viewCount: 203,
      bookmarkCount: 12,
      updatedAt: "4日前",
      borderColor: "#DCEDE2",
      markerIcon: "Star",
    },
  },
  {
    id: "cp5",
    commenterName: "Taro Yamada",
    commenterId: "taro_y",
    comment: "YOASOBIのライブ映像は圧巻。音源とはまた違う良さがある",
    commentedAt: "1週間前",
    ranking: {
      id: "cp5-ref",
      title: "2024年ベストアルバム",
      tagName: "音楽",
      items: [
        "THE BOOK 3 - YOASOBI",
        "Subtract - Ed Sheeran",
        "SOS - SZA",
      ],
      authorName: "Yuki Sato",
      authorId: "yuki_s",
      viewCount: 420,
      bookmarkCount: 31,
      updatedAt: "6日前",
      borderColor: "#E8DFF3",
      markerIcon: "Music4",
    },
  },
  {
    id: "cp6",
    commenterName: "Taro Yamada",
    commenterId: "taro_y",
    comment: "下北沢のカレー屋は穴場が多い。スパイスカレーが絶品",
    commentedAt: "1週間前",
    ranking: {
      id: "cp6-ref",
      title: "下北沢カレー屋3選",
      tagName: "カフェ",
      items: [
        "Mikazuki Curry SAMURAI.",
        "般若",
        "カレーの惑星",
      ],
      authorName: "Hanako Tanaka",
      authorId: "hanako_t",
      viewCount: 178,
      bookmarkCount: 9,
      updatedAt: "1週間前",
      borderColor: "#F8E7D4",
      markerIcon: "Smile",
    },
  },
  {
    id: "cp7",
    commenterName: "Taro Yamada",
    commenterId: "taro_y",
    comment: "リップはやっぱりデパコスが持ちが良い。参考になった",
    commentedAt: "2週間前",
    ranking: {
      id: "cp7-ref",
      title: "おすすめリップ3選",
      tagName: "化粧品",
      items: [
        "NARS パワーマットリップ",
        "Dior アディクトリップ",
        "MAC リップスティック",
      ],
      authorName: "Hanako Tanaka",
      authorId: "hanako_t",
      viewCount: 534,
      bookmarkCount: 42,
      updatedAt: "10日前",
      borderColor: "#FFE5E5",
      markerIcon: "Heart",
    },
  },
];

function MoreVerticalIcon() {
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
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}


function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function getDomainLabel(url: string): { label: string; icon: React.ReactNode } {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname.includes("x.com") || hostname.includes("twitter.com")) {
      return { label: "X", icon: <XIcon /> };
    }
    if (hostname.includes("instagram.com")) {
      return { label: "Instagram", icon: <InstagramIcon /> };
    }
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return { label: "YouTube", icon: <YouTubeIcon /> };
    }
    if (hostname.includes("github.com")) {
      return { label: "GitHub", icon: <GitHubIcon /> };
    }
    return { label: hostname, icon: <LinkIcon /> };
  } catch {
    return { label: url, icon: <LinkIcon /> };
  }
}

function getUserInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}


export function UserProfileScreen({
  onNavigate,
  isOwnProfile = true,
  onSidebarToggle,
  viewingUserId,
  onViewProfile,
}: UserProfileScreenProps) {
  const profile = getProfileForUser(viewingUserId);
  const userRankings = getRankingsForUser(viewingUserId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);

  const handleFollowToggle = useCallback(() => {
    setIsFollowing((prev) => {
      const next = !prev;
      setFollowerCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
      return next;
    });
  }, []);

  const [activeTab, setActiveTab] = useState<"posts" | "threads">("posts");

  const postRankings = isOwnProfile ? MOCK_POST_RANKINGS : userRankings;
  const userThreads = getThreadsForUser(viewingUserId);

  const postCards: PostCardRanking[] = postRankings.map((r) => toPostCardRanking(r));

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto">
        {/* Back button */}
        <div className="px-4 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("rankings")}
            className="text-sm transition mb-2 inline-block bg-transparent border-none cursor-pointer"
            style={{ color: "var(--primary)" }}
          >
            &larr;
          </button>
        </div>

        {/* Profile Section */}
        <section
          className="px-4 pb-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {/* Avatar */}
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.displayName}のアバター`}
                  className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  {getUserInitial(profile.displayName)}
                </div>
              )}
              <div className="min-w-0">
                <h1
                  className="truncate text-xl font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  {profile.displayName}
                </h1>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  @{profile.displayUserId}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="rounded-md p-1 transition hover:bg-muted bg-transparent border-none cursor-pointer"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label="メニュー"
                  >
                    <MoreVerticalIcon />
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute right-0 top-8 z-10 min-w-[160px] rounded-lg py-1 shadow-md"
                      style={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onNavigate("profile-edit");
                        }}
                        className="w-full px-4 py-2 text-left text-sm transition hover:bg-muted bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--foreground)" }}
                      >
                        プロフィール編集
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Follow button */}
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    className="rounded-full px-4 h-10 text-sm font-semibold"
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "フォロー中" : "フォローする"}
                  </Button>

                  {/* User action menu (mute/block) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActionMenuOpen((prev) => !prev)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition hover:bg-muted border-none cursor-pointer"
                      style={{ color: "var(--foreground)" }}
                      aria-label="ユーザーメニュー"
                    >
                      <span className="text-base font-black leading-none">{"\u22EF"}</span>
                    </button>
                    {actionMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActionMenuOpen(false)}
                        />
                        <div
                          className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg py-1 shadow-md"
                          style={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setActionMenuOpen(false)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:bg-muted bg-transparent border-none cursor-pointer"
                            style={{ color: "var(--foreground)" }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 5L6 9H2v6h4l5 4V5z" />
                              <line x1="23" y1="9" x2="17" y2="15" />
                              <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                            ミュート
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionMenuOpen(false)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:bg-muted bg-transparent border-none cursor-pointer"
                            style={{ color: "var(--destructive)" }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                            ブロック
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Introduction */}
          {profile.introduction && (
            <p
              className="mt-3 text-sm whitespace-pre-line"
              style={{ color: "var(--muted-foreground)" }}
            >
              {profile.introduction}
            </p>
          )}

          {/* Links */}
          {profile.links.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {profile.links.map((link, index) => {
                const domain = getDomainLabel(link.url);
                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 text-sm cursor-pointer transition hover:opacity-70"
                    style={{ color: "var(--primary)" }}
                  >
                    {domain.icon}
                    <span>{domain.label}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
              <span
                className="font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {profile.publicRankingCount}
              </span>
              <span style={{ color: "var(--muted-foreground)" }}>
                公開投稿
              </span>
            </span>
            <button
              type="button"
              onClick={() => onNavigate("follow-list")}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm cursor-pointer transition hover:opacity-70 bg-transparent border-none p-0"
            >
              <span
                className="font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {profile.followingCount}
              </span>
              <span style={{ color: "var(--muted-foreground)" }}>
                フォロー
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("follow-list")}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm cursor-pointer transition hover:opacity-70 bg-transparent border-none p-0"
            >
              <span
                className="font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {followerCount}
              </span>
              <span style={{ color: "var(--muted-foreground)" }}>
                フォロワー
              </span>
            </button>
          </div>

          {/* 自己分析ツール導線 */}
          {isOwnProfile && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => onNavigate("self-analysis")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                自己分析
              </button>
            </div>
          )}
        </section>

        {/* タブ切替（自分・他ユーザー共通） */}
        <div
          className="flex border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className="flex-1 py-3 text-sm font-semibold text-center bg-transparent border-none cursor-pointer transition"
            style={{
              color: activeTab === "posts" ? "var(--foreground)" : "var(--muted-foreground)",
              borderBottom: activeTab === "posts" ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            投稿
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("threads")}
            className="flex-1 py-3 text-sm font-semibold text-center bg-transparent border-none cursor-pointer transition"
            style={{
              color: activeTab === "threads" ? "var(--foreground)" : "var(--muted-foreground)",
              borderBottom: activeTab === "threads" ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            スレッド
          </button>
        </div>

        {/* 投稿リスト */}
        <div className="px-4 py-4">
          {activeTab === "posts" ? (
            postCards.length === 0 ? (
              <p
                className="py-12 text-center text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                公開投稿はまだありません。
              </p>
            ) : (
              <div className="flex flex-col space-y-2">
                {postCards.map((card) => (
                  <InstagramPostCard
                    key={card.id}
                    ranking={card}
                    onClick={() => onNavigate("ranking-detail")}
                    onAuthorClick={
                      isOwnProfile && card.author?.displayUserId === "taro_y"
                        ? undefined
                        : card.author?.displayUserId
                          ? () => onViewProfile?.(card.author!.displayUserId!)
                          : undefined
                    }
                    isBookmarked={false}
                    onBookmarkClick={() => {}}
                    onShareClick={() => {}}
                    variant="list"
                  />
                ))}
              </div>
            )
          ) : (
            userThreads.length === 0 ? (
              <p
                className="py-12 text-center text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                スレッドはまだありません。
              </p>
            ) : (
              <div className="flex flex-col space-y-3">
                {userThreads.map((thread) => {
                  const threadData = toThreadCardData(thread);
                  const isSelfThread =
                    isOwnProfile && thread.authorId === "taro_y";
                  return (
                    <ThreadCard
                      key={thread.id}
                      thread={threadData}
                      onNavigate={onNavigate}
                      onAuthorClick={
                        isSelfThread
                          ? undefined
                          : thread.authorId
                            ? () => onViewProfile?.(thread.authorId)
                            : undefined
                      }
                      isBookmarked={false}
                      onBookmarkClick={() => {}}
                      onShareClick={() => {}}
                    />
                  );
                })}
              </div>
            )
          )}
        </div>

        <div className="h-8" aria-hidden="true" />
      </div>
    </div>
  );
}
