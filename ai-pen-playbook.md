# AI向け .pen 生成手順（Pencil互換）

## 目的
- `.pen` ファイルを **最短で壊さず生成** する
- 失敗しやすいポイント（形式違い、BOM、重複ID）を事前に防ぐ

## 先に結論（最速運用）
1. AIに最初に渡すのは以下の3つ
- `UI_mock.pen`（今動いている実ファイル）
- 要件定義（画面要件）
- 追加したい画面一覧（例: 09〜12）

2. AIへの指示で必ず固定する条件
- `version` は既存と同じ（現在は `2.6`）
- 出力は **純粋なJSONのみ**（コメント禁止、末尾カンマ禁止）
- 文字コードは **UTF-8 BOMなし**
- すべての `id` はユニーク
- 既存画面を消さずに「追記」する

3. 生成後に機械チェック（30秒）
- JSONとして読めるか
- 画面数が期待通りか
- 重複IDがないか
- BOMがないか

---

## AIへ渡すプロンプト雛形（コピペ用）

```text
あなたは Pencil .pen(JSON) を編集する担当です。
以下を厳守してください。

[入力ファイル]
- UI_mock.pen（既存で開けるファイル）
- 要件定義.md

[今回の作業]
- 既存画面は保持
- 以下の画面を追加: {ここに画面名}

[厳守ルール]
1) .pen の version は既存値を維持（変更しない）
2) 出力は JSON のみ（コメント・説明文を混ぜない）
3) id は全ノードでユニーク
4) UTF-8 BOMなしで保存
5) レイアウトプロパティは既存パターンを踏襲（frame/rectangle/textの構造を合わせる）
6) 既存画面を削除しない

[出力形式]
- 完成した UI_mock.pen の全文のみ出力
```

---

## 生成ルール（AIに明示する具体値）
- 形式: JSON
- 推奨ノード: `frame`, `rectangle`, `text`
- 互換優先: 既存ファイルのキー名をそのまま使う
- 色は16進（例: `#FFFFFF`）
- `fontWeight` は文字列（例: `"700"`）
- 画面配置は衝突しない座標（例: `x=0/1320/2640`, `y=0/940/1880...`）

---

## よくある失敗と回避
1. `Unsupported file format`
- 原因: `version` 不一致
- 回避: 既存ファイルの `version` を固定で使う

2. `Unexpected token`（先頭で失敗）
- 原因: UTF-8 BOM付き
- 回避: BOMなしUTF-8で保存

3. `duplicate identifiers`
- 原因: `id` の使い回し
- 回避: 画面prefixを付ける（例: `empty-list-*`, `error-*`）

4. 開けるが真っ白
- 原因: 構造/属性が互換外、またはオブジェクト破損
- 回避: 既存の表示実績ファイルをベースに最小差分で編集

---

## ローカル検証コマンド（PowerShell）

### 1) JSON妥当性
```powershell
Get-Content -Raw -Encoding UTF8 UI_mock.pen | ConvertFrom-Json | Out-Null
```

### 2) BOM確認（先頭が `EF BB BF` ならNG）
```powershell
$bytes=[System.IO.File]::ReadAllBytes('UI_mock.pen')
($bytes[0..2] | ForEach-Object { $_.ToString('X2') }) -join ' '
```

### 3) 重複ID確認
```powershell
$j=Get-Content -Raw -Encoding UTF8 UI_mock.pen | ConvertFrom-Json
$ids=@()
function Walk($n){ if($n.id){$script:ids += [string]$n.id}; if($n.children){ foreach($c in $n.children){Walk $c}} }
foreach($c in $j.children){Walk $c}
$ids | Group-Object | Where-Object { $_.Count -gt 1 }
```

### 4) 画面数確認
```powershell
$j=Get-Content -Raw -Encoding UTF8 UI_mock.pen | ConvertFrom-Json
$j.children.Count
```

---

## 実運用のコツ
- AIには「新規作成」より「既存 `UI_mock.pen` の差分編集」をさせる
- 一気に大量画面を追加するより、2〜4画面単位で追加して毎回検証
- 失敗時はまず `version` / BOM / 重複ID の3点を確認する

