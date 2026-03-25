import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ランキング作成",
  description: "新しいランキングを作成しよう",
};

export default function NewRankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
