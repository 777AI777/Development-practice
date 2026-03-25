import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "下書き一覧",
  description: "保存した下書きを管理しよう",
};

export default function DraftsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
