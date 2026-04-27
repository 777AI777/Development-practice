# Figma UIモック大規模更新 — 実装計画

## Context

OKINYは「テーマ+好きなもの3つ」を投稿する静かなギャラリー型SNS。UXワークショップ（Day 6.75〜7）で設計を大幅に変更した。UIモック（figma-make/）への反映が必要。

変更の規模: 既存画面7改修 + 新規画面11作成 + 用語統一35箇所。

## 設計判断（確定済み）

| 項目 | 判断 |
|------|------|
| SearchScreenタブ | 3タブに統合（投稿 / アカウント / タグ） |
| UserProfileScreenタブ | 1タブに統合（全投稿を時系列表示） |
| LoginScreenキャッチコピー | 「あなたの「好き」を醸成する」 |
| ファイル名・Screen ID | そのまま維持（UI表示のみ変更） |
| 法的文書の「ランキング」 | 「投稿」に変更（UIモックなので問題なし） |
| モックデータのタイトル | ユーザーが付けたテーマ名なので「ランキング」含むものは自然なテーマ名に差し替え |

## 設計原則（全画面で厳守）

1. 騒音つくらない — 通知バッジ・カウント表示は最小限
2. 余白は意味を持つ — 詰め込まない
3. 比較の軸を持ち込まない — いいね数・スコア表示なし
4. 選んだこと自体が表現 — 選定理由欄なし
5. 時間が文脈 — 蓄積が価値になる設計
6. 主語をシステムに渡さない

## アイコン・ビジュアルルール

- **絵文字は使用しない**（全画面共通）
- アイコンはOKINYのトーンに合ったSVGインラインアイコン or CSS描画で統一
- OKINYのアイコンの雰囲気（ニュートラル・静か・ミニマル）を踏襲
- 必要に応じてアイコンコンポーネントを作成（例: BellIcon, ThreadIcon, AnalysisIcon等）
- 色はtheme.cssの変数を使用し、ハードコードしない

---

## Phase 0: 基盤変更（types.ts + theme.css）

### 0-1. types.ts — Screen型追加

**ファイル**: `okiny-web/docs/design/figma-make/src/app/components/types.ts`

追加するScreen ID:
```
| "thread-list"
| "thread-detail"
| "thread-create"
| "thread-answer"
| "self-analysis"
| "self-analysis-result"
| "point-purchase"
| "point-history"
| "notifications"
| "premium-plan"
```

### 0-2. theme.css — 新規CSS変数追加

**ファイル**: `okiny-web/docs/design/figma-make/src/styles/theme.css`

追加変数（:root + @theme inline両方）:
```css
/* スレッド・通知関連 */
--warning: #d97706;          /* 時間差表示のカウントダウン用 */
--warning-foreground: #ffffff;
--success: #16a34a;          /* ポイント獲得表示用 */
--success-foreground: #ffffff;
--premium: #7c3aed;          /* プレミアムプランアクセント */
--premium-foreground: #ffffff;

/* @theme inline に追加 */
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-premium: var(--premium);
--color-premium-foreground: var(--premium-foreground);
```

---

## Phase 1: 用語統一（全ファイル横断）

### 1-A. UIテキスト変更（22箇所）

| ファイル | 行 | 旧 | 新 |
|---------|-----|-----|-----|
| SearchScreen.tsx | 147 | `label: "ランキング"` | タブ自体を削除（3タブ統合） |
| SearchScreen.tsx | 417 | `公開ランキング {count}件` | `公開投稿 {count}件` |
| ShareScreen.tsx | 123 | `OKINYでランキングを見る` | `OKINYで投稿を見る` |
| BookmarksScreen.tsx | 247 | `ランキング一覧を見る` | `投稿一覧を見る` |
| DraftsScreen.tsx | 90 | `ランキング作成` | `投稿を作成` |
| OnboardingScreen.tsx | 19 | `ランキング入力` | `好きなもの入力` |
| OnboardingScreen.tsx | 202 | `ランキングのジャンルを選んでね` | `投稿のジャンルを選んでね` |
| OnboardingScreen.tsx | 267 | `ランキング名をつけよう` | `テーマを決めよう` |
| OnboardingScreen.tsx | 273 | `「映画」のランキング` | `「映画」の投稿` |
| OnboardingScreen.tsx | 283 | `aria-label="ランキング名"` | `aria-label="テーマ"` |
| OnboardingScreen.tsx | 329 | `ランキングを入力しよう` | `好きなものを入力しよう` |
| DeleteConfirmScreen.tsx | 21 | `ランキングを削除しますか？` | `投稿を削除しますか？` |
| RankingFormScreen.tsx | 119 | `placeholder="ランキングタイトル"` | `placeholder="テーマを入力"` |
| RankingFormScreen.tsx | 256 | `このランキングを参照` | `この投稿を参照` |
| RankingFormScreen.tsx | 272 | `このランキングについてひとこと` | `このテーマについてひとこと` |
| UserProfileScreen.tsx | 933 | `公開ランキング` | `公開投稿` |
| UserProfileScreen.tsx | 1010 | タブ「ランキング」 | タブ自体を削除（1タブ統合） |
| UserProfileScreen.tsx | 1027 | `公開ランキングはまだありません` | `公開投稿はまだありません` |
| UserProfileScreen.tsx | 1061 | `ランキングはまだありません` | `投稿はまだありません` |
| Sidebar.tsx | 94 | `ランキング` | `投稿` |
| LoginScreen.tsx | 26 | `ランキング共有SNS` | `あなたの「好き」を醸成する` |
| RankingListScreen.tsx | 629 | `aria-label="新規ランキング作成"` | `aria-label="新規投稿"` |

### 1-B. コメント変更（6箇所）

| ファイル | 行 | 変更内容 |
|---------|-----|---------|
| ShareScreen.tsx | 65 | `{/* ランキングタイトル */}` → `{/* 投稿タイトル */}` |
| ShareScreen.tsx | 81 | `{/* ランキングアイテム (TOP 5) */}` → `{/* 好きなもの3つ */}` |
| RankingDetailScreen.tsx | 279 | `{/* 共有ボタン（公開ランキング） */}` → `{/* 共有ボタン（公開投稿） */}` |
| RankingListScreen.tsx | 624 | `{/* FAB: 新規ランキング作成 */}` → `{/* FAB: 新規投稿 */}` |
| UserProfileScreen.tsx | 601,606 | `ランキング引用/著者` → `投稿引用/著者` |

### 1-C. 法的文書変更（4箇所）

| ファイル | 行 | 変更内容 |
|---------|-----|---------|
| PrivacyScreen.tsx | 60 | `ランキングデータ（タイトル、タグ、ランキング項目）` → `投稿データ（テーマ、タグ、好きなもの）` |
| PrivacyScreen.tsx | 80 | `ランキングデータの保存・表示` → `投稿データの保存・表示` |
| PrivacyScreen.tsx | 90 | `ランキングデータは` → `投稿データは` |
| TermsScreen.tsx | 33,68 | `ランキング形式` → `投稿形式`、`ランキング、タイトル` → `投稿、テーマ` |

### 1-D. モックデータ差し替え（3箇所）

| ファイル | 行 | 旧 | 新 |
|---------|-----|-----|-----|
| SearchScreen.tsx | 78 | `感動する映画ランキング` | `感動する映画` |
| ShareScreen.tsx | 9 | `おすすめ映画ランキング` | `おすすめの映画` |
| ShareScreen.tsx | — | アイテム5個 | アイテム3個に削減 |

---

## Phase 2: 既存画面改修

### 2-1. 投稿フォーム（RankingFormScreen.tsx）— 最優先

**変更内容:**
1. items初期値を `["","","","",""]` → `["","",""]` に変更
2. EDIT_INITIALのitemsも5→3に
3. ドラッグハンドル `⠿` と順位番号 `{rank}` を削除
4. プレースホルダー: `順位 ${rank}` → `好きなもの ${index + 1}`
5. isFirst判定による太字サイズ分けを削除（全アイテム同じスタイル）
6. Coming Soon追加枠を削除
7. タイトル入力のラベルを「テーマ」に変更
8. **投稿時レコメンド追加**: タグ選択の下に「こんなテーマはどう？」セクション
   - モックデータ: `["好きな映画", "週末に行きたい場所", "最近ハマっているもの", "おすすめの本", "元気が出る音楽"]`
   - 横スクロールのチップ/カード
   - タップでtitle入力欄にセット

### 2-2. 投稿一覧（RankingListScreen.tsx）

**変更内容:**
1. **おすすめテーマカルーセル追加**（マイランクタブの上部）
   - 5-7枚のカード型横スクロール
   - モックデータ: `["好きな映画", "おすすめカフェ", "旅行先ベスト", "最近の推し", "週末の過ごし方", "好きな音楽"]`
   - ラベル・カウント・出自ラベル非表示（設計原則①③⑥）
   - タップで `ranking-new` へ遷移（テーマ自動入力は状態管理が必要だがモックなので遷移のみ）
2. カード表示を5→3アイテムに変更
3. 順位番号 `{index + 1}. {item}` → `{item}` のみ
4. 統計表示（viewCount, impressionCount）を削除（設計原則③）。ブックマークアイコンのみ残す
5. スレッド一覧への導線: ボトムタブナビの横 or カルーセルの下にリンク

### 2-3. 投稿詳細（RankingDetailScreen.tsx）

**変更内容:**
1. 閲覧数・インプレッション数を削除（設計原則③）。ブックマーク表示のみ残す
2. MOCK_RANKING.items を5→3に変更
3. 順位番号を削除。3アイテムを等幅で並列表示（`grid grid-cols-1 gap-3` or カード形式）
4. ShareIconボタンを削除 → 三点リーダーメニュー内に「共有」を統合
5. **コメント表示追加**（アイテムリストの下）
   - モックデータ: 2-3件のコメント（アバター、ユーザー名、日時、本文）
   - コメント入力欄（テキストエリア + 送信ボタン）

### 2-4. ヘッダー（AppHeader.tsx）

**変更内容:**
1. アバターボタンの左にSVGベルアイコン追加
2. バッジ（未読数）は**表示しない**（設計原則①）
3. タップで `notifications` 画面へ遷移
4. モバイルのみ表示（`min-[1040px]:hidden`、デスクトップはサイドパネルで対応）

### 2-5. サイドバー（Sidebar.tsx）

**変更内容:**
1. ブックマークの上に「スレッド」ボタン追加（SVGスレッドアイコン + 「スレッド」）→ `thread-list` へ遷移
2. ブックマークの下に「自己分析」ボタン追加（SVG分析アイコン + 「自己分析」）→ `self-analysis` へ遷移
3. 「ランキング」→「投稿」の用語変更（Phase 1と統合）

### 2-6. 設定（SettingsScreen.tsx）

**変更内容:**
1. SETTINGS_ITEMSにプレミアムプラン導線追加
   - `{ label: "プレミアムプラン", icon: SVGクラウンアイコン, screen: "premium-plan" }`
   - ログアウトの上に配置

### 2-7. ユーザープロフィール（UserProfileScreen.tsx）

**変更内容:**
1. 2タブ → 1タブ（タブUI自体を削除、全投稿を時系列表示）
2. 自己分析ツール導線追加（プロフィールセクション内、統計行の下）
   - 小さなカード or ボタン: SVG分析アイコン + 「自己分析」→ `self-analysis` へ遷移
3. ポイント残高表示（統計行に追加: `0 pt`）
4. 統計の「公開ランキング」→「公開投稿」
5. モックデータのアイテムを5→3に変更

### 2-8. その他の既存画面微修正

- **OnboardingScreen.tsx**: ウィザードStep4を5→3アイテムに。RANK_LABELS/PLACEHOLDERSを変更
- **BookmarksScreen.tsx**: モックデータのアイテム数を5→3に
- **ShareScreen.tsx**: アイテム表示を5→3に。モノクロームカードデザインに改修
- **SearchScreen.tsx**: 4タブ→3タブに統合（「ランキング」タブ削除）

---

## Phase 3: 新規画面 — スレッド機能（4画面 + UI部品）

### 3-1. ThreadListScreen.tsx — スレッド一覧

```typescript
interface Props { onNavigate: (screen: Screen) => void; onSidebarToggle?: () => void; }
```

- **ヘッダー**: AppHeader
- **ボディ**: スレッドカードリスト（お題タイトル、作成者アバター+名前、回答数は控えめ表示）
- **FAB**: スレッド作成ボタン → `thread-create`
- **遷移先**: `thread-detail`, `thread-create`, `user-profile`
- **モックデータ**: 5-6件のスレッド

### 3-2. ThreadDetailScreen.tsx — スレッド詳細

```typescript
interface Props { onNavigate: (screen: Screen) => void; onSidebarToggle?: () => void; onViewProfile?: (userId: string | null) => void; }
```

- **ヘッダー**: AppHeader + 戻るボタン + お題タイトル
- **お題セクション**: 上部固定。テーマ表示 + 作成者情報
- **ピン止め回答セクション**: ピンアイコン付き、上部固定
- **回答一覧**: 
  - 各回答: アバター + ユーザー名 + 3つの好き(並列カード) + ひとこと(あれば) + リアクション表示
  - リアクション3種（SVGアイコン）: 電球アイコン「参考になった」 / 星アイコン「新しい発見」 / 握手アイコン「共感した」
  - Awardアイコン（SVG、詳細UI未定、アイコンのみ配置）
  - 時間差表示中の回答: ぼかし + カウントダウンUI
- **並び順切替**: 新着順 / リアクション数順
- **回答ボタン**: 下部固定 → `thread-answer`
- **遷移先**: `thread-list`(戻る), `thread-answer`, `user-profile`
- **モックデータ**: 8-10件の回答（うち2件ピン止め、1件時間差表示中）

### 3-3. ThreadCreateScreen.tsx — スレッド作成

```typescript
interface Props { onNavigate: (screen: Screen) => void; }
```

- **ヘッダー**: 戻るボタン + 「スレッドを作成」+ 投稿ボタン
- **ボディ**: お題（テーマ）入力欄のみ。シンプル
- **遷移先**: `thread-list`(戻る/投稿後)

### 3-4. ThreadAnswerScreen.tsx — スレッド回答

```typescript
interface Props { onNavigate: (screen: Screen) => void; }
```

- **ヘッダー**: 戻るボタン + 「回答する」+ 送信ボタン
- **お題表示**: 上部にスレッドのお題を表示
- **ボディ**: 
  - 3つの好き入力欄（並列、順位なし）
  - ひとこと入力（任意、140字上限、文字カウント表示）
- **遷移先**: `thread-detail`(戻る/送信後)

### 3-5. 時間差表示UI（ThreadDetailScreen内の部品）

- 別ファイルにはしない。ThreadDetailScreen内にインライン定義
- ぼかし表示（`blur-sm`）+ オーバーレイ
- カウントダウンテキスト: 「他の回答は○分後に表示されます」
- warning色を使用

---

## Phase 4: 新規画面 — 自己分析 + ポイント（4画面）

### 4-1. SelfAnalysisMenuScreen.tsx — 自己分析メニュー

```typescript
interface Props { onNavigate: (screen: Screen) => void; }
```

- **ヘッダー**: 戻るボタン + 「自己分析」
- **ポイント残高**: 上部に控えめ表示（`42 pt`）
- **メニューカード**: 6枚のカード (2列グリッド)
  - タグTOP3 (5pt) / カテゴリ分布 (10pt) / 時間帯ヒートマップ (15pt)
  - タグ変遷タイムライン (25pt) / 好みDNAレポート (40pt) / 年間振り返り (50pt)
  - 各カード: タイトル + 消費ポイント + 簡単な説明アイコン
  - ポイント不足時: グレーアウト + 「ポイント不足」テキスト
- **ポイント購入導線**: 「ポイントを購入」ボタン → `point-purchase`
- **ポイント履歴導線**: 「履歴を見る」テキストリンク → `point-history`
- **遷移先**: `user-profile`(戻る), `self-analysis-result`, `point-purchase`, `point-history`
- バッジ/トロフィー/進捗バー**禁止**

### 4-2. SelfAnalysisResultScreen.tsx — 分析結果

```typescript
interface Props { onNavigate: (screen: Screen) => void; }
```

- **ヘッダー**: 戻るボタン + 分析メニュー名
- **ボディ**: `analysisType` state で6種を切り替え。全てCSSベースのビジュアルモック付き
- **遷移先**: `self-analysis`(戻る)
- 全てモックデータ。実際のデータ取得は不要

#### 6種のビジュアルモック仕様

**1. タグTOP3 (5pt)**
- 3つのタグカードを縦並び（1位〜3位ではなく、よく使う順）
- 各カード: タグ名 + 使用回数のバー（CSSで幅を%表示）
- モックデータ: 映画(18回), カフェ(12回), 音楽(8回)
- 穏やかなグラデーションバー（primary色の濃淡）

**2. カテゴリ分布 (10pt)**
- 横棒グラフ（CSS flexbox + width%）
- カテゴリ: エンタメ 40% / グルメ 25% / ライフスタイル 20% / カルチャー 15%
- 各棒はprimary色の透明度違い（0.8, 0.6, 0.4, 0.2）
- 棒の右にカテゴリ名とパーセント

**3. 時間帯ヒートマップ (15pt)**
- 7行(曜日) x 6列(時間帯: 朝/昼/午後/夕方/夜/深夜) のグリッド
- CSS Gridで描画。各セルは正方形
- 色の濃淡で投稿頻度を表現（background-colorのopacity 0.1〜1.0）
- 凡例: 薄い→濃い = 少ない→多い
- モックデータ: 日曜22時、土曜15時あたりが濃い

**4. タグ変遷タイムライン (25pt)**
- 横軸: 月（6ヶ月分）、縦にタグバブル
- 各月に1-3個のタグバブル（borderで囲んだ丸角チップ）
- 月ごとの主要タグが変化していく様子を可視化
- CSSで横スクロール可能なタイムライン
- モックデータ: 1月「映画,本」→ 2月「映画,カフェ」→ 3月「カフェ,旅行」→ ...

**5. 好みDNAレポート (40pt)**
- 5角形のレーダーチャート風（CSS clip-path + SVGで描画）
- 5軸: ビジュアル / ストーリー / 体験 / 味覚 / 音楽
- 各軸にスコア（モック値）
- 中央にOKINYトーンのアクセント色
- 下部にテキスト解説: 「あなたは体験重視タイプ。実際に行って感じることに価値を置く傾向があります。」

**6. 年間振り返り (50pt)**
- 12ヶ月の縦タイムライン
- 各月: 月名 + 投稿数 + その月の代表テーマ1つ
- 投稿がない月は「—」表示
- 最下部に年間サマリー: 「2025年は42件の投稿。最もよく使ったテーマは「映画」でした。」
- 区切り線とアイコンで視覚的に月を区別（CSSのborder-left + ドットマーカー）

### 4-3. PointPurchaseScreen.tsx — ポイント購入

```typescript
interface Props { onNavigate: (screen: Screen) => void; }
```

- **ヘッダー**: 戻るボタン + 「ポイント購入」
- **ボディ**: 3ステップ表示（モック）
  - Step1: パッケージ選択（10pt/100円, 50pt/450円, 100pt/800円）— ダミー値
  - Step2: 確認画面
  - Step3: 完了画面
- **遷移先**: `self-analysis`(戻る)

### 4-4. PointHistoryScreen.tsx — ポイント履歴

```typescript
interface Props { onNavigate: (screen: Screen) => void; }
```

- **ヘッダー**: 戻るボタン + 「ポイント履歴」
- **ボディ**: 履歴リスト
  - 各行: 日時 + 種別アイコン + 説明 + ポイント増減（+1pt, -5pt等）
  - 種別: 投稿(+1), スレッド回答(+1), ピン止め(+3), 分析消費(-N)
- **遷移先**: `self-analysis`(戻る)
- モックデータ: 10件程度

---

## Phase 5: 新規画面 — 通知 + プレミアム（2画面）

### 5-1. NotificationListScreen.tsx — 通知一覧

```typescript
interface Props { onNavigate: (screen: Screen) => void; }
```

- **ヘッダー**: 戻るボタン + 「お知らせ」
- **ボディ**: 通知リスト
  - 各行: アイコン + テキスト + 日時
  - 種別: おすすめテーマ更新、スレッドリアクション、ピン止め、Award受賞
  - 未読: 左側にドットマーク（設計原則①: 数字ではなくドット）
  - 既読: ドットなし、テキスト色がmuted-foreground
- **遷移先**: `rankings`(戻る), `thread-detail`, `ranking-detail`
- モックデータ: 8件（うち3件未読）

### 5-2. PremiumPlanScreen.tsx — プレミアムプラン

```typescript
interface Props { onNavigate: (screen: Screen) => void; }
```

- **ヘッダー**: 戻るボタン + 「プレミアムプラン」
- **ボディ**:
  - 月額表示: ¥550/月
  - 特典リスト（チェックマーク付き）:
    - 広告非表示
    - 自己分析全メニュー解放
    - ポイント獲得2倍速
    - 年間振り返りレポート無料
    - 投稿カードデザイン5種
    - プロフィールテーマカスタマイズ
    - 下書き上限15件
  - 「登録する」ボタン（モック、タップでトースト表示）
  - premium色のアクセント
- **遷移先**: `settings`(戻る)

---

## Phase 6: App.tsx統合

### 6-1. import追加

```typescript
import { ThreadListScreen } from "./components/ThreadListScreen";
import { ThreadDetailScreen } from "./components/ThreadDetailScreen";
import { ThreadCreateScreen } from "./components/ThreadCreateScreen";
import { ThreadAnswerScreen } from "./components/ThreadAnswerScreen";
import { SelfAnalysisMenuScreen } from "./components/SelfAnalysisMenuScreen";
import { SelfAnalysisResultScreen } from "./components/SelfAnalysisResultScreen";
import { PointPurchaseScreen } from "./components/PointPurchaseScreen";
import { PointHistoryScreen } from "./components/PointHistoryScreen";
import { NotificationListScreen } from "./components/NotificationListScreen";
import { PremiumPlanScreen } from "./components/PremiumPlanScreen";
```

### 6-2. switch case追加（10画面分）

各新規画面のcase文をrenderScreen()に追加。
propsはonNavigate必須、スレッド系はonSidebarToggle + onViewProfileも渡す。

### 6-3. showSidePanelScreens追加

スレッド系画面をサイドパネル表示対象に追加:
```typescript
"thread-list", "thread-detail", "thread-create", "thread-answer",
"self-analysis", "self-analysis-result"
```

### 6-4. デスクトップサイドパネルの更新

サイドパネルにも「スレッド」「自己分析」への導線を追加（Sidebar.tsxの変更と同期）。

---

## Phase 7: 検証

### ビルド確認
```bash
cd okiny-web/docs/design/figma-make && npm run build
```

### ブラウザ確認（dev server）
```bash
cd okiny-web/docs/design/figma-make && npm run dev
```

確認項目:
- [ ] 全画面への遷移が動作する
- [ ] 「ランキング」の文字列が残っていない（コメント除く、ファイル名除く）
- [ ] 新規画面が全て表示される
- [ ] 3アイテム並列表示が正しく動作する
- [ ] おすすめテーマカルーセルが表示される
- [ ] スレッド画面の時間差表示UIが表示される
- [ ] 自己分析メニューのカードが表示される
- [ ] 通知アイコンが表示される
- [ ] デスクトップサイドパネルに新導線が表示される
- [ ] TypeScriptエラーなし

---

## 実装順序サマリー

| Phase | 内容 | ファイル数 | 依存 |
|-------|------|-----------|------|
| 0 | 基盤（types.ts + theme.css） | 2 | なし |
| 1 | 用語統一 | 14 | Phase 0 |
| 2 | 既存画面改修 | 9 | Phase 0, 1 |
| 3 | 新規: スレッド | 4 | Phase 0 |
| 4 | 新規: 自己分析+ポイント | 4 | Phase 0 |
| 5 | 新規: 通知+プレミアム | 2 | Phase 0 |
| 6 | App.tsx統合 | 1 | Phase 3,4,5 |
| 7 | 検証 | 0 | 全Phase |

Phase 3/4/5 は相互依存なし → 並列実行可能。
