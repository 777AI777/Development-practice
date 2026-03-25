import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
  description: "Googleアカウントでログインして始めよう",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
