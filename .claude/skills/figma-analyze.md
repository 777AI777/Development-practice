---
description: figma-make/のTailwind CSS/shadcn UIの問題を分析してレポートを出力する
---

# Figma Make Analyze

ローカルの figma-make/ ディレクトリを分析し、Tailwind CSS v4 / shadcn UI の色・スタイル問題を検出する。

## 手順

### Step 1: 設定読み込み

1. プロジェクトルートの `figma-make.config.json` を読み込む
2. themeFile, componentsDir, cssFramework, uiLibrary を取得

### Step 2: theme.css 分析

1. `config.themeFile` を読み込む
2. `:root` ブロックからCSS変数を全て抽出（変数名 → 値のマップ作成）
3. `@theme inline` ブロックの有無を確認
4. `@theme inline` 内の `--color-*` マッピングを全て抽出

### Step 3: マッピング整合性チェック

cssFramework が "tailwind-v4" の場合:

1. `:root` の各CSS変数に対して、`@theme inline` に対応する `--color-*` 定義があるか確認
   - `--foreground` → `--color-foreground: var(--foreground)` が必要
   - `--background` → `--color-background: var(--background)` が必要
   - 以下同様
2. `--radius` → `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` の定義確認

### Step 4: コンポーネントスキャン

1. `config.componentsDir` と `config.appEntry` の全 `.tsx` ファイルを読み込み
2. 以下のパターンを検出:

**Tailwindカラーユーティリティ:**
- `text-[name]` パターン（例: `text-foreground`, `text-muted-foreground`）
- `bg-[name]` パターン（例: `bg-primary`, `bg-muted`）
- `border-[name]` パターン（例: `border-destructive`）
- hover等の修飾子も含む（`hover:bg-primary`, `hover:text-white`）

**インラインstyle CSS変数参照:**
- `var(--[name])` パターン
- 対応する `:root` 変数が存在するか確認

### Step 5: shadcn UI 暗黙クラスチェック

uiLibrary が "shadcn" の場合、以下のクラスが `@theme inline` で対応しているか確認:

| コンポーネント | 暗黙のTailwindクラス |
|--------------|---------------------|
| Card | `text-card-foreground`, `bg-card` |
| Button default | `bg-primary`, `text-primary-foreground` |
| Button destructive | `bg-destructive`, `text-destructive-foreground` |
| Button outline | `border-input`, `bg-background` |
| TabsList | `bg-muted`, `text-muted-foreground` |
| TabsTrigger active | `bg-background`, `text-foreground` |
| Badge secondary | `bg-secondary`, `text-secondary-foreground` |
| Input | `border-input`, `bg-background` |
| Select | `border-input`, `bg-popover`, `text-popover-foreground` |
| Label | `text-foreground` |
| Popover | `bg-popover`, `text-popover-foreground` |

### Step 6: レポート出力

以下の形式で出力:

```
## Figma Make 分析レポート

### CRITICAL (Tailwindクラスが機能しない)
- [ ] `@theme inline` ブロックが欠落
- [ ] `--color-foreground` が未定義 → `text-foreground` が機能しない
- [ ] ...

### WARNING (動作するが非推奨パターン)
- [ ] `text-muted-foreground` クラス使用箇所で inline style も併用
- [ ] ...

### INFO (参考情報)
- `:root` に定義された CSS変数: X個
- `@theme inline` にマッピングされた変数: Y個
- カバレッジ: Y/X (Z%)
- インラインstyle使用箇所: N個
- Tailwindクラス使用箇所: M個
```
