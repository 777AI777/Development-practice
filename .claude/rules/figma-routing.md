# Figma タスク自動ルーティング

Figma関連のリクエストを受けたら、対応するスキルの手順に従って実行する。

## ルーティング表

| トリガー | スキル | 条件 |
|---------|--------|------|
| Figma URLが渡された | `/figma-sync` | URLからコード取得・ローカル同期 |
| figma-make/の問題分析を依頼された | `/figma-analyze` | Tailwind/shadcn UIの問題検出 |
| figma-make/の修正を依頼された | `/figma-fix` | 問題の自動修正+手動更新手順 |
| Figma URLが渡され、分析・修正も含む | `/figma-pipeline` | sync→analyze→fix 一括実行 |

## 判定ルール

- Figma URLだけ渡された → `/figma-sync`
- Figma URL + 「分析」「修正」「全部やって」等 → `/figma-pipeline`
- URL無し + figma-make/の話題 → `/figma-analyze` or `/figma-fix`（文脈で判断）
- 判断できない場合はユーザーに確認

## 実行方法

該当スキルの `.claude/skills/<skill-name>.md` を読み、記載された手順に従う。
