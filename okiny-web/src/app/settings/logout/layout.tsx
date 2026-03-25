import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログアウト",
  description: "ログアウト",
};

export default function LogoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
