import type { Screen } from "./types";

interface PrivacyScreenProps {
  onNavigate: (screen: Screen) => void;
}

function PrivacyContent() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground">
        プライバシーポリシー
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        最終更新日: 2026年3月26日
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            1. はじめに
          </h2>
          <p className="mt-2 text-foreground/80">
            OKINY（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本ポリシーでは、収集する情報の種類、利用目的、管理方法について説明します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            2. 運営者
          </h2>
          <p className="mt-2 text-foreground/80">
            本サービスは、CVX Partner株式会社が運営しています。
          </p>
          <p className="mt-2 text-foreground/80">
            お問い合わせ先：
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>X（Twitter）：@OkinyApp</li>
            <li>メール：CVX_AI_Development@cvx.co.jp（個人情報に関するお問い合わせ専用）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. 収集する情報
          </h2>
          <p className="mt-2 text-foreground/80">
            本サービスでは、Google
            OAuthを利用したログイン時に、以下の情報を取得します。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>Googleアカウントに登録されたメールアドレス</li>
            <li>Googleアカウントに登録された表示名</li>
            <li>Googleアカウントのプロフィール画像URL</li>
          </ul>
          <p className="mt-2 text-foreground/80">
            また、サービスの利用に伴い、以下の情報が生成・保存されます。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>作成した投稿データ（テーマ、タグ、好きなもの）</li>
            <li>下書きデータ（ブラウザのIndexedDBにローカル保存）</li>
          </ul>
          <p className="mt-2 text-foreground/80">
            さらに、サービスの安定運用および不正アクセスの検出・防止を目的として、以下のアクセスログを自動的に記録します。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>IPアドレス</li>
            <li>User-Agent（ブラウザ・OS情報）</li>
            <li>アクセス日時</li>
            <li>リクエスト内容</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. 情報の利用目的
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>ユーザー認証およびアカウント管理</li>
            <li>投稿データの保存・表示</li>
            <li>サービスの改善・運用</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. データの保存
          </h2>
          <p className="mt-2 text-foreground/80">
            ユーザーの認証情報および投稿データは、Supabase（クラウドデータベースサービス）に保存されます。Supabaseのプライバシーポリシーについては<a className="underline text-primary hover:text-primary/80" href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">こちら</a>をご確認ください。
          </p>
          <p className="mt-2 text-foreground/80">
            下書きデータはお使いのブラウザのIndexedDBにローカル保存され、サーバーには送信されません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            6. 第三者サービスの利用
          </h2>
          <p className="mt-2 text-foreground/80">
            本サービスでは、以下の第三者サービスを利用しています。各サービスのプライバシーポリシーもあわせてご確認ください。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li><a className="underline text-primary hover:text-primary/80" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google プライバシーポリシー</a>（認証）</li>
            <li><a className="underline text-primary hover:text-primary/80" href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase プライバシーポリシー</a>（データ保存）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            7. Cookieの使用
          </h2>
          <p className="mt-2 text-foreground/80">
            本サービスでは、以下の目的でCookieを使用します。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>
              認証セッションの維持（ログイン状態を保持するため）
            </li>
            <li>セキュリティの確保（CSRF対策等）</li>
          </ul>
          <p className="mt-2 text-foreground/80">
            広告目的やトラッキング目的のCookieは使用していません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            8. 第三者への提供
          </h2>
          <p className="mt-2 text-foreground/80">
            ユーザーの個人情報を、本人の同意なく第三者に提供することはありません。ただし、法令に基づく場合はこの限りではありません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            9. データの保存期間および削除
          </h2>
          <p className="mt-2 text-foreground/80">
            アカウントの削除を希望する場合は、上記お問い合わせ先までご連絡ください。ご連絡から30日以内に、関連するすべてのデータを削除します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            10. 対象年齢
          </h2>
          <p className="mt-2 text-foreground/80">
            本サービスは13歳以上を対象としています。13歳未満の方はご利用いただけません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            11. ポリシーの変更
          </h2>
          <p className="mt-2 text-foreground/80">
            本ポリシーは、必要に応じて変更されることがあります。重要な変更を行う場合は、本ページへの掲載に加えて、サービス内またはX（Twitter）アカウントにてお知らせします。変更後のポリシーは本ページに掲載した時点で効力を生じます。
          </p>
        </section>
      </div>
    </>
  );
}

export function PrivacyScreen({ onNavigate }: PrivacyScreenProps) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-[480px] mx-auto p-4 space-y-4">
        {/* ヘッダー: 戻るボタン + タイトル */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="w-8 h-8 flex items-center justify-center text-lg font-bold bg-transparent border-none cursor-pointer"
            style={{ color: "var(--foreground)" }}
          >
            ←
          </button>
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            プライバシーポリシー
          </h2>
        </div>

        {/* 本文 */}
        <article>
          <PrivacyContent />
        </article>
      </div>
    </div>
  );
}
