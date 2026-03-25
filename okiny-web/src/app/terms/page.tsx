"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { useSessionUser } from "@/hooks/use-session-user";

function TermsContent() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground">利用規約</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        最終更新日: 2026年3月25日
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第1条（適用）
          </h2>
          <p className="mt-2 text-foreground/80">
            本規約は、OKINY（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本サービスを利用することにより、本規約に同意したものとみなされます。
          </p>
          <p className="mt-2 text-foreground/80">
            本サービスは、CVX Partner株式会社（以下「運営者」）が運営します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第2条（サービス内容）
          </h2>
          <p className="mt-2 text-foreground/80">
            本サービスは、ユーザーが自身の「好き」をランキング形式で整理・共有できるプラットフォームです。映画、音楽、カフェなど、あらゆるジャンルのマイランキングを作成・管理できます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第3条（対象年齢）
          </h2>
          <p className="mt-2 text-foreground/80">
            本サービスは13歳以上を対象としています。13歳未満の方はご利用いただけません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第4条（アカウント）
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>
              ユーザーはGoogleアカウントを使用してログインします。
            </li>
            <li>
              アカウントの管理はユーザー自身の責任で行ってください。
            </li>
            <li>
              第三者によるアカウントの不正利用が判明した場合は、速やかにご連絡ください。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第5条（投稿コンテンツのライセンス）
          </h2>
          <p className="mt-2 text-foreground/80">
            ユーザーが本サービスに投稿したコンテンツ（ランキング、タイトル、タグ等）について、ユーザーは運営者に対し、本サービスの運営・改善・宣伝に必要な範囲で、無償・非独占的に使用（複製、表示、配信を含む）する権利を許諾するものとします。
          </p>
          <p className="mt-2 text-foreground/80">
            著作権その他の権利は、投稿者に帰属します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第6条（禁止事項）
          </h2>
          <p className="mt-2 text-foreground/80">
            ユーザーは、以下の行為を行ってはなりません。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>法令または公序良俗に反する行為</li>
            <li>他のユーザーまたは第三者の権利を侵害する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>不正アクセスやシステムへの攻撃</li>
            <li>虚偽の情報を登録する行為</li>
            <li>
              本サービスを通じて取得した情報を商業目的で無断利用する行為
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第7条（サービスの変更・停止）
          </h2>
          <p className="mt-2 text-foreground/80">
            運営者は、やむを得ない事情がある場合、事前の通知なく本サービスの内容を変更または一時的に停止することがあります。可能な限り事前にX（Twitter）アカウントにてお知らせします。
          </p>
          <p className="mt-2 text-foreground/80">
            サービスを永続的に終了する場合は、合理的な期間前に通知するよう努めます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第8条（免責事項）
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>
              本サービスは現状有姿で提供されます。運営者は、本サービスに関して明示または黙示の保証をしません。
            </li>
            <li>
              運営者の故意または重大な過失による場合を除き、本サービスの利用により生じた損害について、運営者は責任を負いません。
            </li>
            <li>
              ユーザーが投稿したコンテンツに関する責任は、投稿者自身に帰属します。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第9条（規約の変更）
          </h2>
          <p className="mt-2 text-foreground/80">
            運営者は、必要に応じて本規約を変更できるものとします。重要な変更を行う場合は、本ページへの掲載に加えて、サービス内またはX（Twitter）アカウントにてお知らせします。変更後の規約は本ページに掲載した時点で効力を生じます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第10条（準拠法および管轄裁判所）
          </h2>
          <p className="mt-2 text-foreground/80">
            本規約の解釈および適用は、日本法に準拠するものとします。本サービスに関して紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            第11条（お問い合わせ）
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/80">
            <li>
              X（Twitter）：@OkinyApp
            </li>
            <li>
              メール：CVX_AI_Development@cvx.co.jp
            </li>
          </ul>
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

export default function TermsPage() {
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
              利用規約
            </h2>
          </div>
          <article>
            <TermsContent />
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
        <TermsContent />
      </article>
    </div>
  );
}
