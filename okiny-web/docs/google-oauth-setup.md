# Google OAuth セットアップガイド

OKINYでGoogle認証を動作させるために必要な外部サービスの設定手順。
コードベース側の実装とは独立して実施できる。

## 前提

- Googleアカウントを持っていること
- Supabaseプロジェクトが作成済みであること
- `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` が設定済みであること

## 1. Google Cloud Console — OAuth同意画面の設定

OAuth 2.0クライアントIDを作成するには、先にOAuth同意画面の設定が必要。

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（なければ「新しいプロジェクト」で作成）
3. 左メニュー「**APIとサービス**」>「**OAuth同意画面**」を開く
4. 「**使ってみる**」または「**同意画面を設定**」をクリック
5. 以下を入力:
   - アプリ名: `OKINY`
   - ユーザーサポートメール: 共有mailを選択
   - デベロッパーの連絡先メール: 共有mailを入力
6. 対象: 「**外部**」を選択
7. 「**作成**」をクリック

> **補足**: 「外部」を選択するとテストモードになる。テストモードではステップ2で追加したユーザーのみログイン可能。本番公開時はGoogleの審査が必要になるが、開発段階ではテストモードで十分。

## 2. テストユーザーの追加

テストモードでは、明示的に追加したGoogleアカウントのみログインできる。

1. OAuth同意画面の「**対象**」タブを開く
2. 「**テストユーザーを追加**」をクリック
3. ログインに使うGmailアドレスを入力して追加
4. 保存

## 3. Google Cloud Console — OAuth 2.0クライアントIDの作成

1. 左メニュー「**APIとサービス**」>「**認証情報**」
2. 上部の「**+ 認証情報を作成**」>「**OAuthクライアントID**」を選択
3. アプリケーションの種類: 「**ウェブ アプリケーション**」
4. 名前: `OKINY Web`（任意）
5. 「**承認済みのリダイレクトURI**」に以下を追加:
   ```
   https://<project-id>.supabase.co/auth/v1/callback
   ```
   ※ Supabase側がOAuthプロバイダーとの認可コード交換に使うURL。localhost / 本番の区別なくこの1つでよい。
   - `<project-id>` の確認方法: Supabaseダッシュボード > **Project Settings**（左メニュー下の歯車アイコン）> **General** > 「**Project ID**」に表示されている英数字の文字列
   - `.env.local` の `NEXT_PUBLIC_SUPABASE_URL` が `https://xxxxxxxx.supabase.co` なら、`xxxxxxxx` がProject ID
6. 「**作成**」をクリック
7. 表示される **クライアントID** と **クライアントシークレット** をメモ

> **注意**: クライアントシークレットはこの画面でしか表示されない。必ずメモすること。紛失した場合は「認証情報」ページから再度確認できる。

## 4. Supabase — Google Providerの有効化

1. [Supabaseダッシュボード](https://supabase.com/dashboard) でプロジェクトを開く
2. **Authentication** > **Sign In / Providers** を開く
3. **Google** をクリックして展開
4. 「**Enable Sign in with Google**」をONにする
5. ステップ3でメモした **Client ID** と **Client Secret** を入力
6. 保存

## 5. Supabase — URL設定

1. **Authentication** > **URL Configuration** を開く
2. **Site URL**: `https://okiny.vercel.app`（本番URL）
3. **Redirect URLs** に以下の **2つ** を追加:
   ```
   https://okiny.vercel.app/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```
4. 保存

> Site URLは本番URLを設定する。Redirect URLsにはlocalhostと本番の両方を追加しておくことで、開発環境・本番環境どちらでもOAuthが動作する。

## 6. anon keyの取得と環境変数の設定

1. Supabaseダッシュボード > **Project Settings** > **API** を開く
2. 「**Publishable and secret API keys**」または「**Legacy anon, service_role API keys**」セクションから `anon`（publishable）キーをコピー
3. `okiny-web/.env.local` に追加:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=コピーしたキー
   ```

### 最終的な `.env.local` の構成

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### Vercel環境変数の追加（本番デプロイ済みの場合）

ローカルの `.env.local` とは別に、Vercel側にも同じ環境変数を設定する必要がある。

1. [Vercel Dashboard](https://vercel.com/dashboard) でプロジェクトを開く
2. **Settings** > **Environment Variables** を開く
3. 以下を追加（既存の `NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` は設定済みのはず）:
   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | コピーしたanon key | Production, Preview, Development すべて |
4. 保存後、**再デプロイ** が必要（Settings > Environment Variables の変更は次回デプロイから反映される）

## 7. 既存データの対応

Google認証導入後、ユーザーIDがMock値（`user-google-001` 等）からSupabase Auth UUID に変わる。
既存のランキングデータは新しいユーザーIDと紐づかなくなるため、開発段階ではDBクリアで対応する。

### Supabase（サーバー側）

1. Supabaseダッシュボード > **Table Editor** を開く
2. `ranking_items` テーブルを選択 > 全行削除（先に子テーブルを削除）
3. `rankings` テーブルを選択 > 全行削除

### IndexedDB（ブラウザ側）

旧Mock IDで保存された下書きデータ（`okiny-local` DB, `drafts` store）は新UUIDでは検索できず孤立するため、合わせてクリアする。

- **GUI**: DevTools > **Application** > **IndexedDB** > `okiny-local` を右クリック > 削除
- **Console**: `indexedDB.deleteDatabase("okiny-local")` を実行

## 確認チェックリスト

設定完了後、以下を確認:

- [ ] Google Cloud Console: OAuth同意画面が設定済み
- [ ] Google Cloud Console: テストユーザーに自分のGmailが追加済み
- [ ] Google Cloud Console: OAuth 2.0クライアントID（ウェブアプリケーション）が作成済み
- [ ] Google Cloud Console: リダイレクトURIにSupabaseのcallback URLが登録済み
- [ ] Supabase: Sign In / ProvidersでGoogle が有効化済み、Client ID/Secretが入力済み
- [ ] Supabase: Site URLが `http://localhost:3000` に設定済み
- [ ] Supabase: Redirect URLsに `http://localhost:3000/api/auth/callback` が追加済み
- [ ] `.env.local`: `NEXT_PUBLIC_SUPABASE_ANON_KEY` が設定済み

## トラブルシューティング

### 「OAuthクライアントID」が選択できない
- OAuth同意画面の設定が未完了。ステップ1を先に完了すること。

### ログイン時に「403: access_denied」
- テストユーザーにログインしようとしているGmailが追加されていない。ステップ2を確認。

### ログイン後に画面が真っ白 / callbackでエラー
- Supabase側のRedirect URLsに `http://localhost:3000/api/auth/callback` が登録されているか確認。
- Google Cloud Console側のリダイレクトURIに `https://<project-ref>.supabase.co/auth/v1/callback` が登録されているか確認。

### 「invalid_client」エラー
- Client IDまたはClient Secretが間違っている。Google Cloud Consoleの認証情報ページで再確認。
