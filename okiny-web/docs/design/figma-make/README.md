# Figma Make ワークフロー

Figma Make のコードをローカルで管理・分析・修正するためのワークフロー。

## セットアップ

### 必要なもの

- Claude Code CLI
- Figma MCP（`mcp__figma`）が接続済み
- プロジェクトルートに `figma-make.config.json` がある

### ファイル構成

```
プロジェクトルート/
├── figma-make.config.json      ← パス設定（PJ毎に書き換え）
├── figma-make/
│   ├── README.md               ← このファイル
│   ├── guidelines/
│   │   └── Guidelines.md       ← デザイン仕様書
│   └── src/
│       ├── app/
│       │   ├── App.tsx         ← ルートコンポーネント
│       │   └── components/     ← 各画面コンポーネント
│       └── styles/
│           └── theme.css       ← CSS変数 + @theme inline
├── .claude/
│   ├── commands/
│   │   ├── figma-sync.md       ← /figma-sync
│   │   ├── figma-analyze.md    ← /figma-analyze
│   │   ├── figma-fix.md        ← /figma-fix
│   │   └── figma-pipeline.md   ← /figma-pipeline
│   └── rules/
│       └── figma-make.md       ← 自動ガードレール
```

---

## コマンド一覧

### `/figma-pipeline <figma-url>` （普段はこれだけでOK）

取得 → 分析 → 修正 → 手動更新手順 を一括実行。

```
/figma-pipeline https://figma.com/design/xxxxx/MyProject?node-id=1-2
```

### `/figma-sync <figma-url>`

Figma Makeから最新コードを取得してローカルに反映する。

```
/figma-sync https://figma.com/design/xxxxx/MyProject?node-id=1-2
```

### `/figma-analyze`

ローカルの figma-make/ を分析して問題を検出する。引数不要。

```
/figma-analyze
```

**検出する問題:**
- `@theme inline` ブロックの欠落や不整合
- Tailwindクラス（`text-foreground` 等）の色が解決できない
- shadcn UIコンポーネントの内部クラスの対応漏れ

### `/figma-fix`

分析結果に基づいて theme.css を自動修正し、Figma Makeへの手動更新手順を出力する。

```
/figma-fix
```

---

## よくある作業フロー

### Figma Makeでデザインを更新した後

```
1. /figma-pipeline <figma-url>   ← これだけ
2. 出力された手順に従い、theme.css を Figma Make に手動アップロード
3. Figma Make プレビューで色が正しく表示されることを確認
```

### ローカルで theme.css を直接編集した場合

```
1. :root に変数を追加
2. @theme inline にも対応マッピングを追加（忘れるとTailwindクラスが壊れる）
3. /figma-analyze で問題がないか確認
4. Figma Make に theme.css をアップロード
```

### 新しいPJに導入する場合

```
1. figma-make/ ディレクトリをコピー
2. .claude/commands/figma-*.md をコピー
3. .claude/rules/figma-make.md をコピー
4. figma-make.config.json をコピーしてパスを書き換え
```

---

## theme.css の仕組み

Figma Make + Tailwind v4 + shadcn UI を連携させるために、theme.css は2つのブロックを持つ。

### `:root` ブロック（CSS変数の定義）

Figma Makeが生成する色の値。

```css
:root {
  --primary: #005fcc;
  --foreground: #1a1a1a;
  --background: #f3f5f7;
  /* ... */
}
```

### `@theme inline` ブロック（Tailwind v4 へのマッピング）

Tailwind v4 は `--color-*` 変数を参照するため、`:root` の変数をマッピングする必要がある。

```css
@theme inline {
  --color-primary: var(--primary);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  /* ... */
}
```

**これがないと:**
- `text-foreground` → `color: var(--color-foreground)` → **未定義** → テキストが見えない
- `bg-primary` → `background-color: var(--color-primary)` → **未定義** → ボタンに色がつかない
- shadcn UI の Card, Button, Tabs 等のテキストが全て白くなる

### マッピングルール

| :root の変数 | @theme inline に必要な定義 |
|-------------|--------------------------|
| `--foreground` | `--color-foreground: var(--foreground)` |
| `--background` | `--color-background: var(--background)` |
| `--primary` | `--color-primary: var(--primary)` |
| `--xxx-foreground` | `--color-xxx-foreground: var(--xxx-foreground)` |
| `--input-background` | `--color-input: var(--input-background)` |
| `--primary` | `--color-ring: var(--primary)` |
| `--radius` | `--radius-sm/md/lg/xl` を calc() で生成 |

---

## shadcn UI が暗黙に使うクラス

shadcn UI コンポーネントは内部で以下のTailwindクラスを使う。
`@theme inline` でこれら全てがカバーされていないと、色が壊れる。

| コンポーネント | 内部クラス |
|--------------|-----------|
| Card | `bg-card` `text-card-foreground` |
| Button (default) | `bg-primary` `text-primary-foreground` |
| Button (destructive) | `bg-destructive` `text-destructive-foreground` |
| Button (outline) | `border-input` `bg-background` |
| Button (ghost) | `hover:bg-accent` |
| TabsList | `bg-muted` `text-muted-foreground` |
| TabsTrigger (active) | `bg-background` `text-foreground` |
| Badge (secondary) | `bg-secondary` `text-secondary-foreground` |
| Input | `border-input` `bg-background` |
| Label | `text-foreground` |
| Select/Popover | `bg-popover` `text-popover-foreground` |

---

## figma-make.config.json

PJ固有の設定。他PJではこのファイルだけ書き換える。

```json
{
  "figmaMakeDir": "figma-make",
  "srcDir": "figma-make/src",
  "stylesDir": "figma-make/src/styles",
  "componentsDir": "figma-make/src/app/components",
  "appEntry": "figma-make/src/app/App.tsx",
  "themeFile": "figma-make/src/styles/theme.css",
  "guidelinesFile": "figma-make/guidelines/Guidelines.md",
  "cssFramework": "tailwind-v4",
  "uiLibrary": "shadcn"
}
```

| キー | 説明 |
|------|------|
| `figmaMakeDir` | Figma Makeコードのルートディレクトリ |
| `themeFile` | CSS変数 + @theme inline を定義するファイル |
| `componentsDir` | スクリーンコンポーネントのディレクトリ |
| `cssFramework` | `tailwind-v4` の場合 @theme inline を使用 |
| `uiLibrary` | `shadcn` の場合、暗黙クラスのチェックを実行 |
