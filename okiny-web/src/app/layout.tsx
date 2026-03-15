import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageTransitionProvider } from "@/components/page-transition-provider";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OKINY",
  description: "IndexedDB を使ったローカル下書き保存と公開専用APIの検証アプリ。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  // カスタム<Script>追加時に nonce prop として渡す。
  // Next.js内部スクリプトへのnonce付与はCSPヘッダー経由で自動適用される。
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nonce = headerList.get("x-nonce") ?? "";

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased">
        <ToastProvider>
          <PageTransitionProvider>{children}</PageTransitionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
