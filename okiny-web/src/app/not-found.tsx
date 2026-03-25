import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <main className="mx-auto max-w-xl rounded-2xl border border-border bg-card px-8 py-10 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground">404 - ページが見つかりません</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          お探しのページは見つかりませんでした。
        </p>
        <div className="mt-6 flex gap-2">
          <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            ログインへ
          </Link>
          <Link href="/rankings" className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
            ランキング一覧へ
          </Link>
        </div>
      </main>
    </div>
  );
}

