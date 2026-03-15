import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <main className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">404 - ページが見つかりません</h1>
        <p className="mt-2 text-sm text-slate-600">
          お探しのページは見つかりませんでした。
        </p>
        <div className="mt-6 flex gap-2">
          <Link href="/login" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            ログインへ
          </Link>
          <Link href="/rankings" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            ランキング一覧へ
          </Link>
        </div>
      </main>
    </div>
  );
}

