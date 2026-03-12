# Figma Make ガードレール

figma-make/ ディレクトリのファイルを編集する際のルールと知識ベース。

## 設定ファイル

`figma-make.config.json` でPJ固有のパスを管理。編集時はconfigのパスを参照すること。

## ディレクトリ構造

```
figma-make/
├── guidelines/Guidelines.md    # デザイン仕様書（手動編集のみ）
└── src/
    ├── app/
    │   ├── App.tsx             # ルートコンポーネント（スクリーン管理）
    │   └── components/
    │       ├── *Screen.tsx     # 各スクリーンコンポーネント
    │       ├── AppHeader.tsx   # 共通ヘッダー
    │       ├── ComingSoon.tsx  # Coming Soon表示
    │       └── ui/             # shadcn UIコンポーネント（Figma Make管理）
    └── styles/
        └── theme.css           # CSS変数 + @theme inline 定義
```

## Tailwind CSS v4 の @theme inline ルール

### 根本原則

Tailwind v4 では、CSSユーティリティクラスは `--color-*` CSS変数に解決される:
- `text-foreground` → `color: var(--color-foreground)`
- `bg-primary` → `background-color: var(--color-primary)`
- `border-border` → `border-color: var(--color-border)`

`:root` で定義した `--foreground: #1a1a1a` は Tailwind に**直接認識されない**。
`@theme inline` ブロックで `--color-foreground: var(--foreground)` のマッピングが必須。

### マッピングルール

```
:root の変数名         →  @theme inline の変数名
--foreground           →  --color-foreground
--background           →  --color-background
--card                 →  --color-card
--card-foreground      →  --color-card-foreground
--primary              →  --color-primary
--primary-foreground   →  --color-primary-foreground
--destructive          →  --color-destructive
--destructive-foreground → --color-destructive-foreground
--muted                →  --color-muted
--muted-foreground     →  --color-muted-foreground
--accent               →  --color-accent
--accent-foreground    →  --color-accent-foreground
--secondary            →  --color-secondary
--secondary-foreground →  --color-secondary-foreground
--popover              →  --color-popover
--popover-foreground   →  --color-popover-foreground
--border               →  --color-border
--input-background     →  --color-input
--primary              →  --color-ring（フォーカスリング用）
--radius               →  --radius-sm/md/lg/xl（calc()で生成）
```

## shadcn UI 暗黙クラス一覧

shadcn UIコンポーネントは内部で以下のTailwindクラスを使用する。
これらが機能するには `@theme inline` でのマッピングが必須。

| コンポーネント | 使用クラス |
|--------------|-----------|
| Card | `bg-card`, `text-card-foreground`, `border-border` |
| Button (default) | `bg-primary`, `text-primary-foreground` |
| Button (destructive) | `bg-destructive`, `text-destructive-foreground` |
| Button (outline) | `border-input`, `bg-background`, `text-foreground` |
| Button (ghost) | `text-foreground`, `hover:bg-accent` |
| TabsList | `bg-muted`, `text-muted-foreground` |
| TabsTrigger (active) | `bg-background`, `text-foreground` |
| Badge (secondary) | `bg-secondary`, `text-secondary-foreground` |
| Input | `border-input`, `bg-background`, `text-foreground` |
| Label | `text-foreground` |
| Select | `border-input`, `bg-popover`, `text-popover-foreground` |
| Popover | `bg-popover`, `text-popover-foreground` |

## 編集ルール

1. **theme.css 編集時**: `:root` に変数を追加したら、`@theme inline` にも対応マッピングを追加すること
2. **コンポーネント編集時**: インラインstyle (`style={{ color: "var(--foreground)" }}`) は応急処置。`@theme inline` が正しく設定されていればTailwindクラスで十分
3. **ui/ ディレクトリ**: Figma Make が管理するため、ローカルで編集しない
4. **Guidelines.md**: デザイン仕様書。コード修正では変更しない
