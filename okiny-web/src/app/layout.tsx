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
  const nonce = headerList.get("x-nonce") ?? "";

  return (
    <html lang="ja">
      <body className="antialiased">
        <ToastProvider>
          <PageTransitionProvider>{children}</PageTransitionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
