import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "タグ検索",
  description: "タグでランキングを探そう",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
