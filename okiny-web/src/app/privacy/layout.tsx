import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | OKINY",
  description:
    "OKINYのプライバシーポリシーです。個人情報の取り扱い、Cookieの使用について説明しています。",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
