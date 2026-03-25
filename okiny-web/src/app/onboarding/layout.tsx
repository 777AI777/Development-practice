import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "はじめの設定",
  description: "表示名とお気に入りタグを設定しよう",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
