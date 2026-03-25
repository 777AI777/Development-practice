"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { useSessionUser } from "@/hooks/use-session-user";

function PrivacyContent() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground">
        プライバシーポリシー
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        最終更新日: 2026年3月25日
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
            2. 収集する情報
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
            <li>作成したランキングデータ（タイトル、タグ、ランキング項目）</li>
            <li>下書きデータ（ブラウザのIndexedDBにローカル保存）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. 情報の利用目的
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>ユーザー認証およびアカウント管理</li>
            <li>ランキングデータの保存・表示</li>
            <li>サービスの改善・運用</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. データの保存
          </h2>
          <p className="mt-2 text-foreground/80">
            ユーザーの認証情報およびランキングデータは、Supabase（クラウドデータベースサービス）に保存されます。Supabaseは業界標準のセキュリティ対策を講じています。
          </p>
          <p className="mt-2 text-foreground/80">
            下書きデータはお使いのブラウザのIndexedDBにローカル保存され、サーバーには送信されません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. Cookieの使用
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
            6. 第三者への提供
          </h2>
          <p className="mt-2 text-foreground/80">
            ユーザーの個人情報を、本人の同意なく第三者に提供することはありません。ただし、法令に基づく場合はこの限りではありません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            7. データの削除
          </h2>
          <p className="mt-2 text-foreground/80">
            アカウントの削除を希望される場合は、運営者までお問い合わせください。アカウント削除時には、関連するすべてのデータを削除します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            8. ポリシーの変更
          </h2>
          <p className="mt-2 text-foreground/80">
            本ポリシーは、必要に応じて変更されることがあります。変更後のポリシーは本ページに掲載した時点で効力を生じます。
          </p>
        </section>
      </div>
    </>
  );
}

function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex h-8 w-8 shrink-0 items-center justify-center text-lg font-bold text-foreground"
      aria-label="戻る"
    >
      {"\u2190"}
    </button>
  );
}

export default function PrivacyPage() {
  const { isReady, user } = useSessionUser();
  const { signalReady } = usePageTransition();

  useEffect(() => {
    if (isReady) {
      signalReady();
    }
  }, [isReady, signalReady]);

  if (!isReady) {
    return null;
  }

  if (user) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BackButton />
            <h2 className="text-base font-semibold text-foreground">
              プライバシーポリシー
            </h2>
          </div>
          <article>
            <PrivacyContent />
          </article>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <article className="mx-auto max-w-2xl">
        <div className="mb-6">
          <BackButton />
        </div>
        <PrivacyContent />
      </article>
    </div>
  );
}
