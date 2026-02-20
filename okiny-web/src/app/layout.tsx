import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OKINY Phase1",
  description: "Local draft storage with IndexedDB and publish-only API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
