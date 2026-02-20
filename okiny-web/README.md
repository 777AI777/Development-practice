# OKINY Web (Phase1)

Phase1変更計画として、下書きをSupabaseではなくブラウザのIndexedDBに保存する実装です。

## 実装済み仕様

- 下書き保存先: IndexedDB（同一ブラウザのみ）
- 下書き分離: `userId` 単位で分離
- 下書き上限: 1ユーザーあたり5件（6件目はwarning）
- 公開保存: APIへ送信し、成功時は該当下書きをローカルから自動削除
- サーバー側: 公開ランキングのみを扱う（`draft` ステータスなし）
- 初回表示: 「下書きはこのブラウザにのみ保存されます」を表示
- トースト: success/error/warning/info の秒数を固定（3/6/5/4秒）

## 開発コマンド

```bash
npm install
npm run dev
```

`http://localhost:3000` を開いて確認します。

## 品質確認コマンド

```bash
npm run lint
npx tsc --noEmit
```

## テスト

Vitestテストを追加済みです。

- `src/lib/drafts/indexeddb-draft-repository.test.ts`
- `src/lib/drafts/save-draft-with-feedback.test.ts`
- `src/lib/publish/publish-ranking.test.ts`

この環境では `vitest run` 実行時に `spawn EPERM` が発生する場合があります。

