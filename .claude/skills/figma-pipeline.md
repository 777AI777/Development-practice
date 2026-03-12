---
description: Figma Make同期→分析→修正→更新手順出力を一括実行する
---

# Figma Make Pipeline

Figma Make のコード同期・分析・修正を一括で実行するパイプライン。

## 引数

- `$ARGUMENTS` = Figma URL（例: `https://figma.com/design/xxxxx/ProjectName?node-id=1-2`）

## 必須ルール: URL要求

**Figma URLが未提供の場合、必ずユーザーにURLの提供を促すこと。**

- ローカルファイルが存在していても、Syncフェーズをスキップしてはならない
- 「ローカルにファイルがあるから同期不要」と判断して勝手にスキップしない
- URLが無い場合のメッセージ例: 「Figma MakeのURLを提供してください。最新のコードを取得してから修正を適用します。」
- Figma Makeファイルの場合は `get_design_context` → リソースリンク → `ReadMcpResourceTool` の流れで取得

## 手順

### Phase 1: Sync（Figma Make → ローカル同期）

figma-sync と同等の処理を実行:

1. `figma-make.config.json` を読み込み
2. Figma URLからfileKeyを抽出
3. `get_design_context`(fileKey, nodeId="0:1") でリソースリンク一覧を取得
4. `ReadMcpResourceTool`(server="figma") で各ソースファイルを並列取得
   - 対象: App.tsx, 各Screen.tsx, theme.css 等（ui/配下は除外）
5. ローカルファイルと差分比較し、変更があるファイルのみ反映
6. 同期結果をメモ

### Phase 2: Analyze（問題分析）

figma-analyze と同等の処理を実行:

1. theme.css の `:root` 変数と `@theme inline` マッピングを突き合わせ
2. コンポーネントのTailwindクラス使用状況をスキャン
3. shadcn UIの暗黙クラスの対応状況を確認
4. CRITICAL / WARNING / INFO で問題を分類

### Phase 3: Fix（問題があれば自動修正）

CRITICAL問題が検出された場合のみ実行:

1. theme.css の `@theme inline` ブロックを生成/更新
2. `:root` の全変数に対応するマッピングを自動生成
3. 修正適用

CRITICALが0件の場合はスキップ:「問題なし。修正は不要。」

### Phase 4: Report（最終サマリ）

以下の形式で最終レポートを出力:

```
## Figma Make Pipeline 完了

### 1. 同期結果
- 更新: X ファイル
- 新規: Y ファイル
- 変更なし: Z ファイル

### 2. 分析結果
- CRITICAL: N 件
- WARNING: M 件
- INFO: L 件

### 3. 修正結果
- 修正済み: K 件
- [修正内容の概要]

### 4. Figma Make 手動更新が必要なファイル
| ファイル | 変更内容 | 優先度 |
|---------|---------|--------|
| theme.css | @theme inline追加 | 必須 |
| ... | ... | ... |

### 手動更新手順
[figma-fixの手順を出力]
```

## エラーハンドリング

- Figma MCP接続失敗 → 「Figma MCPに接続できません。MCPサーバーの設定を確認してください。」
- config.json不在 → 「figma-make.config.json が見つかりません。」
- Figma URL解析失敗 → 「URLの形式が正しくありません。figma.com/design/... の形式で指定してください。」
- Phase 1で失敗した場合 → Phase 2以降をスキップし、ローカルの現在のファイルで分析を続行するか確認
