---
description: figma-make/のTailwind/CSS問題を自動修正し、Figma Makeへの手動更新手順を出力する
---

# Figma Make Fix

figma-make/ の分析結果に基づいて問題を自動修正する。

## 手順

### Step 1: 設定読み込み

1. `figma-make.config.json` を読み込む
2. themeFile, componentsDir, cssFramework, uiLibrary を取得

### Step 2: 分析実行

figma-analyze と同等の分析を内部で実行し、問題リストを作成する。

### Step 3: theme.css の @theme inline 自動修正

cssFramework が "tailwind-v4" の場合:

1. `:root` ブロックの全CSS変数を抽出
2. `@theme inline` ブロックを生成/更新:

**カラー変数の自動マッピングルール:**
- `--[name]` が色値（#hex, rgb, hsl）→ `--color-[name]: var(--[name])` を生成
- `--[name]-foreground` → `--color-[name]-foreground: var(--[name]-foreground)` を生成
- 特殊ケース: `--input-background` → `--color-input: var(--input-background)`
- 特殊ケース: `--primary` → `--color-ring: var(--primary)` も追加

**Radius変数の自動生成:**
- `--radius` が存在する場合:
  ```
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  ```

3. 既存の `@theme inline` ブロックがある場合は内容をマージ（既存定義を保持、不足分を追加）
4. ブロックがない場合は `:root` の後に挿入

### Step 4: 修正適用

1. theme.css に修正を書き込む
2. 変更前後の差分を表示

### Step 5: Figma Make 手動更新手順を出力

```
## Figma Make 手動更新手順

### 更新が必要なファイル
1. **theme.css** - @theme inline ブロック追加/更新

### 手順
1. Figma Make のエディタを開く
2. `src/styles/theme.css` を選択
3. 以下の内容で上書き:

[修正後のtheme.css全文をコードブロックで表示]

4. プレビューで以下を確認:
   - カードのテキストが表示されること（text-card-foreground が有効）
   - ボタンのテキストが表示されること（text-primary-foreground が有効）
   - タブのテキストが表示されること（text-muted-foreground が有効）
   - 入力欄のラベルが表示されること（text-foreground が有効）
```

## 修正しない項目

- コンポーネントのインラインstyle（応急処置として有効なので維持）
- shadcn UIコンポーネントの内部実装（Figma Make側で管理）
- Guidelines.md（設計ドキュメントなので変更不要）
