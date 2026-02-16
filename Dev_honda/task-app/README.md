# Task App (SQLite)

最小構成のタスク管理アプリです。SQLiteでローカル保存します。

## 起動

```powershell
npm install
npm run dev
```

`http://localhost:3000` にアクセス。

## 環境変数

`DATABASE_URL` を指定するとDBファイルのパスを変更できます。
指定先のディレクトリは事前に作成してください。

例:

```powershell
$env:DATABASE_URL="C:\\path\\to\\tasks.db"
```
