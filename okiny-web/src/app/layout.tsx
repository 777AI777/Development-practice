import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { headers } from "next/headers";
import { PageTransitionProvider } from "@/components/page-transition-provider";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: {
    default: "OKINY",
    template: "%s | OKINY",
  },
  description:
    "あなたの「好き」をランキングで整理・共有しよう。映画、音楽、カフェなど、あらゆるジャンルのマイランキングを作成できるアプリです。",
  verification: {
    google: "9eBgHYg5kK0Y0sutgJBZ5THGFn9Np7xi7dxkiJBFsvQ",
  },
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
    <html lang="ja" className={notoSansJP.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ToastProvider>
          <PageTransitionProvider>{children}</PageTransitionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
