---
description: Figma Makeから最新コードを取得してローカルのfigma-make/に同期する
---

# Figma Make Sync

引数として受け取ったFigma URLから最新のコードを取得し、ローカルの figma-make/ ディレクトリに同期する。

## 引数

- `$ARGUMENTS` = Figma URL（例: `https://figma.com/design/xxxxx/ProjectName?node-id=1-2`）

## 必須ルール: URL要求

**Figma URLが未提供の場合、必ずユーザーにURLの提供を促すこと。**

- ローカルファイルが存在していても、Figma Makeからの同期をスキップしてはならない
- 「ローカルにファイルがあるから同期不要」と判断して勝手にスキップしない
- URLが無い場合のメッセージ例: 「Figma MakeのURLを提供してください。最新のコードを取得して同期します。」
- ユーザーがURLを提供した場合、必ずMCPリソース経由で最新コードを取得すること
- Figma Makeファイルの場合は `get_design_context` → リソースリンク → `ReadMcpResourceTool` の流れで取得

## 手順

### Step 1: 設定読み込み

1. プロジェクトルートの `figma-make.config.json` を読み込む
2. 各パス（themeFile, componentsDir, appEntry等）を取得
3. configが見つからない場合はエラー: 「figma-make.config.json が見つかりません。先に作成してください。」

### Step 2: Figma URL解析

1. `$ARGUMENTS` からfileKeyとnodeIdを抽出
   - URL形式: `figma.com/design/:fileKey/:fileName?node-id=:nodeId`
   - nodeIdの `-` を `:` に変換
2. 引数が空の場合はユーザーに要求: 「Figma MakeのURLを提供してください。例: https://figma.com/make/xxx/... または https://figma.com/design/xxx/...」
   - **絶対にこのステップを省略しない。ローカルファイルの有無に関わらずURLは必須**

### Step 3: ページ構造取得

1. Figma MCP の `get_design_context` を使い、fileKeyとnodeIdでリソースリンク一覧を取得
   - Figma MakeファイルはMakeファイルに対応した取得方式になる
   - `get_metadata` はMakeファイルに非対応のため、`get_design_context` を使用
2. 返されたリソースリンク一覧から、対象コンポーネントファイルを特定

### Step 4: コード取得（並列実行）

1. リソースリンクに対して `ReadMcpResourceTool` を実行（server: "figma"）
   - 対象: App.tsx, 各Screen.tsx, theme.css 等のソースファイル
   - ui/ 配下はshadcn管理のため取得対象外
2. 可能な限り並列で取得（6ファイル程度を1バッチで）

### Step 5: ローカル反映

1. 取得したコードをconfigのパスに従って書き込み:
   - コンポーネント → `config.componentsDir/[ComponentName].tsx`
   - App.tsx → `config.appEntry`
   - theme.css → `config.themeFile`
   - Guidelines → `config.guidelinesFile`
2. 書き込み前に既存ファイルとの差分を確認
3. 変更がないファイルはスキップ

### Step 6: サマリ出力

以下の形式で差分サマリを出力:

```
## Figma Make Sync 完了

### 更新されたファイル
- [ファイルパス]: [変更概要]

### 変更なし
- [ファイルパス]

### 新規追加
- [ファイルパス]
```

## 注意事項

- get_design_context の返すコードは参照用。既存のローカルファイルとマージが必要な場合がある
- theme.css は `:root` 変数のみ上書き。`@theme inline` ブロックがあれば保持する
- UIコンポーネント（ui/button.tsx等）はFigma Makeから取得しない（shadcn側で管理）
