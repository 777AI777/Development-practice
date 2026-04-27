import { useState, useCallback } from "react";
import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";
import { type PostCardRanking } from "./shared/InstagramPostCard";
import { ThreadCard } from "./shared/ThreadCard";
import { InstagramPostCard } from "./shared/InstagramPostCard";

type SearchTab = "posts" | "threads" | "accounts" | "tags";

interface SearchScreenProps {
  onNavigate: (screen: Screen) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSearch?: (query: string) => void;
  onSidebarToggle?: () => void;
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
  viewCount: number;
  bookmarkCount: number;
  updatedAt: string;
  comment?: string;
  borderColor: string;
  markerIcon: string;
}


interface MockUser {
  id: string;
  displayName: string;
  displayUserId: string | null;
  avatarUrl: string | null;
  publicRankingCount: number;
}

interface MockTag {
  id: string;
  name: string;
  usageCount: number;
}

const MOCK_MY_TAGS = ["映画", "カフェ", "旅行"] as const;

const MOCK_POPULAR_TAGS = [
  "映画",
  "音楽",
  "カフェ",
  "旅行",
  "アニメ",
  "ゲーム",
  "グルメ",
  "スポーツ",
] as const;

const MOCK_SEARCH_HISTORY = ["映画", "東京 カフェ", "旅行 おすすめ"] as const;

const MOCK_POST_RESULTS: MockRanking[] = [
  {
    id: "sp1",
    title: "映画トップ3",
    tagName: "映画",
    linkCardTag: "映画",
    comment: "永遠の名作ばかり。何年経っても心に響く作品ってあるよね。ショーシャンクのラストシーンは何度見ても胸が熱くなる\n\n#映画 #洋画",
    items: ["ショーシャンクの空に", "ゴッドファーザー", "ダークナイト"],
    authorName: "映画好き太郎",
    authorId: "movie_taro",
    viewCount: 128,
    bookmarkCount: 5,
    updatedAt: "3時間前",
    borderColor: "#FFE5E5",
    markerIcon: "Film",
  },
  {
    id: "sp2",
    title: "感動した映画",
    tagName: "映画",
    comment: "泣きたい時に見返す映画リスト。フォレスト・ガンプは走るシーンだけで泣ける。最強のふたりはコメディなのに最後じわっとくる\n\n#映画",
    items: ["ショーシャンクの空に", "フォレスト・ガンプ", "最強のふたり"],
    authorName: "シネマファン",
    authorId: "cinema_fan",
    viewCount: 95,
    bookmarkCount: 3,
    updatedAt: "1日前",
    borderColor: "#DFECF8",
    markerIcon: "Tv",
  },
  {
    id: "sp3",
    title: "何度も聴くアルバム",
    tagName: "音楽",
    linkCardTag: "音楽",
    comment: "作業中のヘビロテ。Radioheadは聴くたびに新しい音が聞こえてくる。OK Computerは通勤電車でも世界が変わる\n\n#音楽 #Radiohead",
    items: ["OK Computer", "Kid A", "In Rainbows"],
    authorName: "音楽漬け",
    authorId: "music_life",
    viewCount: 210,
    bookmarkCount: 12,
    updatedAt: "5時間前",
    borderColor: "#F8EFD5",
    markerIcon: "Music4",
  },
  {
    id: "sp4",
    title: "国内旅行で最高だった場所",
    tagName: "旅行",
    linkCardTag: "旅行",
    comment: "どこも「ここに来てよかった」と思えた場所。屋久島の森は空気が違う。直島はアートと自然が溶け込んでいて不思議な感覚になる\n\n#旅行",
    items: ["屋久島", "直島", "知床"],
    authorName: "旅するエンジニア",
    authorId: "travel_eng",
    viewCount: 340,
    bookmarkCount: 18,
    updatedAt: "2日前",
    borderColor: "#DCEDE2",
    markerIcon: "Compass",
  },
  {
    id: "sp5",
    title: "東京で通うカフェ",
    tagName: "カフェ",
    linkCardTag: "カフェ",
    comment: "Wi-Fiと電源があるお店を中心に。STREAMER COFFEEはラテアートが毎回違って楽しい。Fuglenは北欧の空気感が好き\n\n#カフェ #東京",
    items: ["STREAMER COFFEE", "Fuglen Tokyo", "ONIBUS COFFEE"],
    authorName: "カフェ巡りさん",
    authorId: "cafe_meguri",
    viewCount: 187,
    bookmarkCount: 9,
    updatedAt: "12時間前",
    borderColor: "#E8DFF3",
    markerIcon: "Coffee",
  },
  {
    id: "sp6",
    title: "リピ買い化粧品",
    tagName: "化粧品",
    comment: "全部2本目以上リピートしてるもの。NARSの下地は肌がきれいに見えるし崩れにくい。IPSAの化粧水はさっぱりなのに潤う\n\n#化粧品 #リピ買い",
    items: ["NARS ライトリフレクティング", "IPSA ザ・タイムR アクア", "RMK メイクアップベース"],
    authorName: "コスメオタク",
    authorId: "cosme_otaku",
    viewCount: 412,
    bookmarkCount: 24,
    updatedAt: "6時間前",
    borderColor: "#F8E7D4",
    markerIcon: "Sparkles",
  },
  {
    id: "sp7",
    title: "買ってよかった日用品",
    tagName: "日用品",
    comment: "QOL爆上がりアイテム。ドラム式洗濯機は時間を買ったと思えるレベル。電動歯ブラシに替えてから歯医者に褒められるようになった\n\n#日用品",
    items: ["珪藻土バスマット", "ドラム式洗濯機", "電動歯ブラシ"],
    authorName: "暮らし改善部",
    authorId: "kurashi_up",
    viewCount: 560,
    bookmarkCount: 31,
    updatedAt: "1日前",
    borderColor: "#FFE5E5",
    markerIcon: "Smile",
  },
  {
    id: "sp8",
    title: "2025年ベストアニメ",
    tagName: "アニメ",
    comment: "2025年は豊作だった。チ。は科学と信念のぶつかり合いが熱い。ダンダダンはテンポが良くて毎週楽しみだった\n\n#アニメ",
    items: ["チ。", "ダンダダン", "推しの子 2期"],
    authorName: "アニメウォッチャー",
    authorId: "anime_watcher",
    viewCount: 289,
    bookmarkCount: 15,
    updatedAt: "3日前",
    borderColor: "#DFECF8",
    markerIcon: "Heart",
  },
  {
    id: "sp9",
    title: "週末のピザ屋さん",
    tagName: "グルメ",
    comment: "窯焼きにこだわりたい。Savoyのマルゲリータは生地のもちもち感が別格。PSTは予約が取りづらいけどその分感動する\n\n#グルメ #ピザ",
    items: ["Savoy 麻布十番", "PST 六本木", "ピッツェリア ダ・イーサ"],
    authorName: "ピザ探検家",
    authorId: "pizza_hunter",
    viewCount: 178,
    bookmarkCount: 22,
    updatedAt: "8時間前",
    borderColor: "#F8EFD5",
    markerIcon: "Pizza",
  },
  {
    id: "sp10",
    title: "仕事終わりのゲーム",
    tagName: "ゲーム",
    linkCardTag: "ゲーム",
    comment: "30分だけのつもりが気づいたら2時間。Slay the Spireは「もう1回だけ」が止まらない。Balatroはポーカー知らなくてもハマる",
    items: ["Slay the Spire", "Vampire Survivors", "Balatro"],
    authorName: "ゲーマー社会人",
    authorId: "gamer_shakaijin",
    viewCount: 356,
    bookmarkCount: 42,
    updatedAt: "4時間前",
    borderColor: "#DCEDE2",
    markerIcon: "Gamepad2",
  },
  {
    id: "sp11",
    title: "キャンプ場の朝ごはん",
    tagName: "アウトドア",
    comment: "外で食べるだけでなぜかおいしい。ホットサンドメーカーは焚き火との相性が最高。コーヒーはハンドドリップで丁寧に淹れるのが朝の楽しみ\n\n#アウトドア #キャンプ",
    items: ["ホットサンド", "ドリップコーヒー", "目玉焼き＆ベーコン"],
    authorName: "キャンプ好き",
    authorId: "camp_lover",
    viewCount: 198,
    bookmarkCount: 26,
    updatedAt: "2日前",
    borderColor: "#E8DFF3",
    markerIcon: "Tent",
  },
  {
    id: "sp12",
    title: "心に残る写真集",
    tagName: "アート",
    comment: "何度もページをめくる。ソール・ライターの色彩感覚は写真を超えて絵画のよう。星野道夫の自然写真は時間の流れが変わる\n\n#アート #写真集",
    items: ["ソール・ライター", "星野道夫 悠久の時を旅する", "川内倫子 illuminance"],
    authorName: "写真好き",
    authorId: "photo_fan",
    viewCount: 87,
    bookmarkCount: 11,
    updatedAt: "5日前",
    borderColor: "#F8E7D4",
    markerIcon: "Camera",
  },
  {
    id: "sp13",
    title: "冬の温泉地",
    tagName: "旅行",
    linkCardTag: "旅行",
    comment: "雪景色を眺めながらの露天風呂が最高。草津は湯畑の雰囲気だけで癒される。別府は地獄めぐりとセットで楽しめる\n\n#旅行 #温泉",
    items: ["草津温泉", "別府温泉", "登別温泉"],
    authorName: "温泉マニア",
    authorId: "onsen_mania",
    viewCount: 423,
    bookmarkCount: 55,
    updatedAt: "1日前",
    borderColor: "#FFE5E5",
    markerIcon: "Snowflake",
  },
  {
    id: "sp14",
    title: "猫が好きな場所",
    tagName: "暮らし",
    comment: "うちの子の定位置を観察してみた。キーボードの上に乗ってくるのは仕事の邪魔だけど、その温もりが嬉しいから許してしまう\n\n#暮らし #猫",
    items: ["窓辺の日だまり", "段ボール箱の中", "キーボードの上"],
    authorName: "猫の下僕",
    authorId: "neko_geboku",
    viewCount: 612,
    bookmarkCount: 78,
    updatedAt: "7時間前",
    borderColor: "#DFECF8",
    markerIcon: "Cat",
  },
  {
    id: "sp15",
    title: "目覚めのプレイリスト",
    tagName: "音楽",
    comment: "朝は明るい曲で目を覚ます。Here Comes The Sunのイントロで布団から出る勇気をもらってる。Sunshineシリーズは朝の定番",
    items: ["Here Comes The Sun - Beatles", "Good Day Sunshine - Beatles", "Walking on Sunshine - Katrina"],
    authorName: "朝型人間",
    authorId: "morning_person",
    viewCount: 145,
    bookmarkCount: 17,
    updatedAt: "10時間前",
    borderColor: "#F8EFD5",
    markerIcon: "Sunrise",
  },
  {
    id: "sp16",
    title: "もらって嬉しい花",
    tagName: "暮らし",
    comment: "花をもらうと部屋の空気が変わる。かすみ草は主役じゃないのに、あるだけで華やかになる。ミモザの黄色は春を連れてくる\n\n#暮らし #花",
    items: ["かすみ草", "ラナンキュラス", "ミモザ"],
    authorName: "花のある暮らし",
    authorId: "hana_life",
    viewCount: 231,
    bookmarkCount: 33,
    updatedAt: "3日前",
    borderColor: "#DCEDE2",
    markerIcon: "Flower",
  },
  {
    id: "sp17",
    title: "レトロ喫茶の魅力",
    tagName: "カフェ",
    linkCardTag: "カフェ",
    comment: "昭和の空気が残る場所。クリームソーダの緑色を見るだけで気持ちが上がる。ナポリタンは甘めのケチャップ味がノスタルジック\n\n#カフェ #純喫茶",
    items: ["クリームソーダ", "ナポリタン", "固めのプリン"],
    authorName: "純喫茶巡り",
    authorId: "junkissa",
    viewCount: 389,
    bookmarkCount: 47,
    updatedAt: "2日前",
    borderColor: "#E8DFF3",
    markerIcon: "IceCream",
  },
  {
    id: "sp18",
    title: "宝石みたいな和菓子",
    tagName: "グルメ",
    comment: "見た目の美しさに惹かれて集めるようになった。琥珀糖は光に透かすと本当に宝石みたい。練り切りは職人の手仕事に感動する\n\n#グルメ #和菓子",
    items: ["琥珀糖", "練り切り", "水まんじゅう"],
    authorName: "和菓子好き",
    authorId: "wagashi_love",
    viewCount: 267,
    bookmarkCount: 35,
    updatedAt: "4日前",
    borderColor: "#F8E7D4",
    markerIcon: "Gem",
  },
];


const MOCK_USER_RESULTS: MockUser[] = [
  {
    id: "su1",
    displayName: "映画好き太郎",
    displayUserId: "movie_taro",
    avatarUrl: "https://picsum.photos/seed/movie_taro/100/100",
    publicRankingCount: 15,
  },
  {
    id: "su2",
    displayName: "シネマファン",
    displayUserId: "cinema_fan",
    avatarUrl: "https://picsum.photos/seed/cinema_fan/100/100",
    publicRankingCount: 9,
  },
  {
    id: "su3",
    displayName: "映画レビュアー",
    displayUserId: null,
    avatarUrl: "https://picsum.photos/seed/reviewer/100/100",
    publicRankingCount: 4,
  },
  {
    id: "su4",
    displayName: "旅するエンジニア",
    displayUserId: "travel_eng",
    avatarUrl: "https://picsum.photos/seed/travel_eng/100/100",
    publicRankingCount: 22,
  },
  {
    id: "su5",
    displayName: "カフェ巡りさん",
    displayUserId: "cafe_meguri",
    avatarUrl: "https://picsum.photos/seed/cafe_meguri/100/100",
    publicRankingCount: 8,
  },
  {
    id: "su6",
    displayName: "コスメオタク",
    displayUserId: "cosme_otaku",
    avatarUrl: null,
    publicRankingCount: 31,
  },
];

const MOCK_TAG_RESULTS: MockTag[] = [
  { id: "st1", name: "映画", usageCount: 342 },
  { id: "st2", name: "音楽", usageCount: 278 },
  { id: "st3", name: "旅行", usageCount: 195 },
  { id: "st4", name: "カフェ", usageCount: 167 },
  { id: "st5", name: "化粧品", usageCount: 134 },
  { id: "st6", name: "アニメ", usageCount: 112 },
  { id: "st7", name: "日用品", usageCount: 89 },
  { id: "st8", name: "ゲーム", usageCount: 76 },
  { id: "st9", name: "グルメ", usageCount: 63 },
  { id: "st10", name: "映画音楽", usageCount: 28 },
  { id: "st11", name: "映画レビュー", usageCount: 15 },
  { id: "st12", name: "スポーツ", usageCount: 52 },
];

const THREAD_BORDER_COLORS = [
  "#FFE5E5",
  "#DFECF8",
  "#F8EFD5",
  "#DCEDE2",
  "#E8DFF3",
  "#F8E7D4",
] as const;

const MOCK_THREAD_RESULTS = [
  { id: "1", theme: "最近ハマっているもの", description: "ジャンル問わず、今この瞬間に熱中しているものを教えてほしい。食べ物でも趣味でも何でもOK。自分では気づけない「好き」の傾向が見えてくるかも。\n\n#好きなもの #趣味", author: "taro_y", authorName: "Taro Yamada", authorAvatarUrl: "https://picsum.photos/seed/taro/100/100" as string | null, answerCount: 12, createdAt: "3日前", borderColor: THREAD_BORDER_COLORS[0], tags: ["雑談", "趣味", "おすすめ"] },
  { id: "2", theme: "リラックスできる場所", description: "家の中でも外でも、自分だけの「ほっとする場所」ってある？カフェ、公園、布団の中……場所じゃなくて状況でもいい。\n\n#暮らし #リラックス", author: "hana_m", authorName: "Hana Miyamoto", authorAvatarUrl: "https://picsum.photos/seed/hana_relax/100/100" as string | null, answerCount: 8, createdAt: "1週間前", borderColor: THREAD_BORDER_COLORS[1], tags: ["カフェ", "雑談"] },
  { id: "3", theme: "雨の日にやること", description: "雨だと外出が億劫になるけど、逆に雨だからこそ楽しめることもある。映画を観る、本を読む、料理に凝る……みんなの雨の日ルーティンが知りたい。\n\n#暮らし #雨の日", author: "ryota_k", authorName: "Ryota Kato", authorAvatarUrl: "https://picsum.photos/seed/ryota_rain/100/100" as string | null, answerCount: 15, createdAt: "1ヶ月前", borderColor: THREAD_BORDER_COLORS[2], tags: ["映画", "雑談"] },
  { id: "4", theme: "人生で一番おいしかったもの", description: "高級レストランじゃなくてもいい。旅先の屋台、おばあちゃんの手料理、深夜のコンビニおにぎり。記憶に刻まれた味を教えて。\n\n#グルメ #思い出", author: "yuki_s", authorName: "Yuki Suzuki", authorAvatarUrl: "https://picsum.photos/seed/yuki_food/100/100" as string | null, answerCount: 23, createdAt: "2日前", borderColor: THREAD_BORDER_COLORS[3], tags: ["グルメ", "旅行"] },
  { id: "5", theme: "朝のルーティン教えて", description: "起きてから家を出るまで、みんな何をしてる？コーヒーを淹れる、ストレッチする、ニュースを見る。朝の過ごし方で1日の質が変わる気がする。\n\n#暮らし #ルーティン", author: "mai_t", authorName: "Mai Tanaka", authorAvatarUrl: null as string | null, answerCount: 6, createdAt: "5日前", borderColor: THREAD_BORDER_COLORS[4], tags: ["雑談", "おすすめ"] },
  { id: "6", theme: "推し活の楽しみ方", description: "グッズを集める、ライブに行く、布教する。推し活のスタイルは人それぞれ。お金をかけなくてもできる推し活のアイデアも歓迎。\n\n#推し活 #趣味", author: "ken_w", authorName: "Ken Watanabe", authorAvatarUrl: "https://picsum.photos/seed/ken_oshi/100/100" as string | null, answerCount: 19, createdAt: "2週間前", borderColor: THREAD_BORDER_COLORS[5], tags: ["音楽", "趣味"] },
  { id: "7", theme: "夜ふかしの理由", description: "「もう寝なきゃ」と思いながら止められないもの。ドラマの続き、SNS巡回、深夜ラジオ。夜ふかしの沼を共有しよう。\n\n#暮らし #夜ふかし", author: "saki_n", authorName: "Saki Nishida", authorAvatarUrl: "https://picsum.photos/seed/saki_night/100/100" as string | null, answerCount: 31, createdAt: "1日前", borderColor: THREAD_BORDER_COLORS[0], tags: ["映画", "雑談"] },
  { id: "8", theme: "引っ越したら最初に買うもの", description: "新生活のスタートに欠かせないもの。Wi-Fiルーター、カーテン、ゴミ箱。意外と忘れがちな「最初に必要なもの」を教えて。\n\n#暮らし #引っ越し", author: "daiki_o", authorName: "Daiki Ogawa", authorAvatarUrl: "https://picsum.photos/seed/daiki_sky/100/100" as string | null, answerCount: 14, createdAt: "4日前", borderColor: THREAD_BORDER_COLORS[1], tags: ["日用品", "おすすめ"] },
  { id: "9", theme: "旅先でやらかしたこと", description: "パスポート忘れた、電車を乗り間違えた、言葉が通じなくて迷子になった。旅の失敗談って後から笑えるよね。みんなのエピソード聞きたい。\n\n#旅行 #失敗談", author: "mika_i", authorName: "Mika Inoue", authorAvatarUrl: "https://picsum.photos/seed/mika_cat/100/100" as string | null, answerCount: 27, createdAt: "3日前", borderColor: THREAD_BORDER_COLORS[2], tags: ["旅行", "雑談"] },
  { id: "10", theme: "子どもの頃の夢", description: "小さい頃なりたかったもの、今の自分とどれくらい違う？宇宙飛行士、ケーキ屋さん、サッカー選手。あの頃の夢を振り返ってみよう。\n\n#思い出 #夢", author: "ren_t", authorName: "Ren Takahashi", authorAvatarUrl: "https://picsum.photos/seed/ren_music/100/100" as string | null, answerCount: 42, createdAt: "6日前", borderColor: THREAD_BORDER_COLORS[3], tags: ["雑談", "おすすめ"] },
  { id: "11", theme: "一人暮らしの知恵", description: "自炊のコツ、掃除の裏技、節約術。一人暮らしを快適にするライフハックを共有しよう。些細なことでも誰かの助けになるはず。\n\n#暮らし #一人暮らし", author: "hana_m", authorName: "Hana Miyamoto", authorAvatarUrl: "https://picsum.photos/seed/hana_relax/100/100" as string | null, answerCount: 18, createdAt: "1週間前", borderColor: THREAD_BORDER_COLORS[4], tags: ["雑談", "おすすめ"] },
  { id: "12", theme: "地元の隠れた名店", description: "観光ガイドには載っていない、地元民だけが知っている店。味はもちろん、雰囲気や店主の人柄も含めて教えてほしい。\n\n#グルメ #地元", author: "taro_y", authorName: "Taro Yamada", authorAvatarUrl: "https://picsum.photos/seed/taro/100/100" as string | null, answerCount: 35, createdAt: "2日前", borderColor: THREAD_BORDER_COLORS[5], tags: ["グルメ", "カフェ"] },
  { id: "13", theme: "季節の変わり目にすること", description: "衣替え、模様替え、スキンケアの切り替え。季節が変わるタイミングでやっていることは？春夏秋冬どの変わり目でもOK。\n\n#暮らし #季節", author: "yuki_s", authorName: "Yuki Suzuki", authorAvatarUrl: "https://picsum.photos/seed/yuki_food/100/100" as string | null, answerCount: 9, createdAt: "5日前", borderColor: THREAD_BORDER_COLORS[0], tags: ["化粧品", "雑談"] },
  { id: "14", theme: "読書のお供に欠かせないもの", description: "コーヒー、ブランケット、お気に入りの椅子。読書の時間をもっと豊かにするアイテムやルーティンを教えて。\n\n#読書 #暮らし", author: "mai_t", authorName: "Mai Tanaka", authorAvatarUrl: null as string | null, answerCount: 11, createdAt: "1週間前", borderColor: THREAD_BORDER_COLORS[1], tags: ["雑談", "おすすめ"] },
];

const TABS: { key: SearchTab; label: string }[] = [
  { key: "posts", label: "投稿" },
  { key: "threads", label: "スレッド" },
  { key: "accounts", label: "アカウント" },
  { key: "tags", label: "タグ" },
];

function getUserInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function toPostCardRanking(r: MockRanking): PostCardRanking {
  return {
    id: r.id,
    title: r.title,
    tag: r.linkCardTag,
    items: r.items,
    comment: r.comment,
    borderColor: r.borderColor,
    markerIcon: r.markerIcon,
    author: {
      displayName: r.authorName,
      displayUserId: r.authorId,
    },
    viewCount: r.viewCount,
    bookmarkCount: r.bookmarkCount,
  };
}

function SearchTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
}) {
  return (
    <div
      className="sticky top-14 z-20 flex border-b"
      style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className="relative flex-1 py-3 text-center text-sm font-medium transition bg-transparent border-none cursor-pointer"
          style={{
            color:
              activeTab === tab.key
                ? "var(--primary)"
                : "var(--muted-foreground)",
          }}
        >
          {tab.label}
          {activeTab === tab.key && (
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: "var(--primary)" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

function MockUserCard({
  user,
  showBorder,
  onNavigate,
  onViewProfile,
}: {
  user: MockUser;
  showBorder: boolean;
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (onViewProfile) {
          onViewProfile(user.displayUserId);
        } else {
          onNavigate("user-profile");
        }
      }}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/50 bg-transparent border-none cursor-pointer"
      style={{
        borderBottom: showBorder ? "1px solid var(--border)" : "none",
      }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {getUserInitial(user.displayName)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          {user.displayName}
        </p>
        {user.displayUserId && (
          <p
            className="truncate text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            @{user.displayUserId}
          </p>
        )}
        <p
          className="text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          公開投稿 {user.publicRankingCount}件
        </p>
      </div>
    </button>
  );
}

function InitialView({
  onSearchQuery,
  onTagSelect,
}: {
  onSearchQuery: (query: string) => void;
  onTagSelect: (tagName: string) => void;
}) {
  return (
    <div className="space-y-6 pb-4">
      {/* Search History */}
      <section>
        <div className="flex items-center justify-between px-4">
          <h3
            className="text-lg font-medium"
            style={{ color: "var(--foreground)" }}
          >
            検索履歴
          </h3>
          <button
            type="button"
            className="text-sm bg-transparent border-none cursor-pointer"
            style={{ color: "var(--primary)" }}
          >
            すべて消去
          </button>
        </div>
        <div className="mt-1 flex flex-col gap-0.5 px-4">
          {MOCK_SEARCH_HISTORY.map((query) => (
            <div key={query} className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onSearchQuery(query)}
                className="text-base transition hover:text-foreground bg-transparent border-none cursor-pointer text-left"
                style={{ color: "var(--muted-foreground)" }}
              >
                {query}
              </button>
              <button
                type="button"
                className="flex h-4 w-4 items-center justify-center transition hover:text-muted-foreground bg-transparent border-none cursor-pointer"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
                aria-label={`${query}を削除`}
              >
                <span className="text-xs leading-none">{"\u2715"}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* My Tags */}
      <section>
        <h3
          className="px-4 text-lg font-medium"
          style={{ color: "var(--foreground)" }}
        >
          よく使うタグ
        </h3>
        <div className="mt-2 flex flex-col items-start gap-2 px-4">
          {MOCK_MY_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagSelect(tag)}
              className="text-base transition hover:text-foreground bg-transparent border-none cursor-pointer"
              style={{ color: "var(--muted-foreground)" }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {/* Popular Tags */}
      <section>
        <h3
          className="px-4 text-lg font-medium"
          style={{ color: "var(--foreground)" }}
        >
          人気のタグ
        </h3>
        <div className="mt-2 flex flex-col items-start gap-2 px-4">
          {MOCK_POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagSelect(tag)}
              className="text-base transition hover:text-foreground bg-transparent border-none cursor-pointer"
              style={{ color: "var(--muted-foreground)" }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function PostsTab({
  onNavigate,
  onViewProfile,
  bookmarkedIds,
  onBookmarkToggle,
}: {
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
  bookmarkedIds: ReadonlySet<string>;
  onBookmarkToggle: (id: string) => void;
}) {
  const allCards: PostCardRanking[] = MOCK_POST_RESULTS.map(toPostCardRanking);

  return (
    <div className="flex flex-col space-y-2">
      {allCards.map((card) => (
        <InstagramPostCard
          key={`post-${card.id}`}
          ranking={card}
          onClick={() => onNavigate("ranking-detail")}
          onAuthorClick={
            card.author?.displayUserId && onViewProfile
              ? () => onViewProfile(card.author!.displayUserId!)
              : undefined
          }
          isBookmarked={bookmarkedIds.has(card.id)}
          onBookmarkClick={() => onBookmarkToggle(card.id)}
          onShareClick={() => {}}
          variant="list"
        />
      ))}
    </div>
  );
}


function ThreadsTab({
  onNavigate,
  onViewProfile,
  bookmarkedIds,
  onBookmarkToggle,
}: {
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
  bookmarkedIds: ReadonlySet<string>;
  onBookmarkToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col space-y-3">
      {MOCK_THREAD_RESULTS.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={{
            id: thread.id,
            theme: thread.theme,
            description: thread.description,
            author: {
              displayName: thread.authorName,
              displayUserId: thread.author,
              avatarUrl: thread.authorAvatarUrl,
            },
            answerCount: thread.answerCount,
            createdAt: thread.createdAt,
            borderColor: thread.borderColor,
            tags: thread.tags,
          }}
          onNavigate={onNavigate}
          onAuthorClick={
            onViewProfile
              ? () => onViewProfile(thread.author)
              : undefined
          }
          isBookmarked={bookmarkedIds.has(thread.id)}
          onBookmarkClick={() => onBookmarkToggle(thread.id)}
          onShareClick={() => {}}
        />
      ))}
    </div>
  );
}

function AccountsTab({
  onNavigate,
  onViewProfile,
}: {
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ backgroundColor: "var(--card)" }}
    >
      {MOCK_USER_RESULTS.map((user, idx) => (
        <MockUserCard
          key={user.id}
          user={user}
          showBorder={idx < MOCK_USER_RESULTS.length - 1}
          onNavigate={onNavigate}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
}

function TagsTab({
  onTagSelect,
}: {
  onTagSelect: (tagName: string) => void;
}) {
  return (
    <div className="space-y-4 pb-4">
      <section>
        <h3
          className="px-4 text-sm font-medium"
          style={{ color: "var(--muted-foreground)" }}
        >
          検索結果
        </h3>
        <div className="mt-2 flex flex-col items-start gap-2 px-4">
          {MOCK_TAG_RESULTS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagSelect(tag.name)}
              className="group flex flex-col items-start text-left bg-transparent border-none cursor-pointer"
            >
              <span
                className="text-base transition"
                style={{ color: "var(--muted-foreground)" }}
              >
                #{tag.name}
              </span>
              <span
                className="text-xs transition"
                style={{ color: "var(--muted-foreground)", opacity: 0.7 }}
              >
                投稿 {tag.usageCount}件
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SearchScreen({
  onNavigate,
  searchQuery: externalQuery,
  onSearchQueryChange,
  onSearch,
  onSidebarToggle,
  onViewProfile,
}: SearchScreenProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("posts");
  const [hasSearched, setHasSearched] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<ReadonlySet<string>>(
    () => new Set(["sp2", "sp5", "3", "7"]),
  );

  const handleBookmarkToggle = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleTagSelect = useCallback(
    (tagName: string) => {
      if (onSearchQueryChange) {
        onSearchQueryChange(`#${tagName}`);
      }
      if (onSearch) {
        onSearch(`#${tagName}`);
      }
      setActiveTab("posts");
      setHasSearched(true);
    },
    [onSearch, onSearchQueryChange],
  );

  const handleSearchQuery = useCallback(
    (query: string) => {
      if (onSearchQueryChange) {
        onSearchQueryChange(query);
      }
      if (onSearch) {
        onSearch(query);
      }
      setHasSearched(true);
    },
    [onSearch, onSearchQueryChange],
  );

  const handleSearch = useCallback(
    (query: string) => {
      if (onSearch) {
        onSearch(query);
      }
      setHasSearched(true);
    },
    [onSearch],
  );

  const showResults = hasSearched || (externalQuery ?? "").trim().length > 0;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader
        onNavigate={onNavigate}
        searchQuery={externalQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearchSubmit={handleSearch}
        onSidebarToggle={onSidebarToggle}
      />

      <div className="max-w-[480px] mx-auto">
        {showResults ? (
          <>
            <SearchTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <div className="px-4 pt-4 pb-4">
              {activeTab === "posts" && (
                <PostsTab
                  onNavigate={onNavigate}
                  onViewProfile={onViewProfile}
                  bookmarkedIds={bookmarkedIds}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              )}
              {activeTab === "threads" && (
                <ThreadsTab
                  onNavigate={onNavigate}
                  onViewProfile={onViewProfile}
                  bookmarkedIds={bookmarkedIds}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              )}
              {activeTab === "accounts" && (
                <AccountsTab onNavigate={onNavigate} onViewProfile={onViewProfile} />
              )}
              {activeTab === "tags" && (
                <TagsTab onTagSelect={handleTagSelect} />
              )}
            </div>
          </>
        ) : (
          <InitialView
            onSearchQuery={handleSearchQuery}
            onTagSelect={handleTagSelect}
          />
        )}
      </div>
    </div>
  );
}
