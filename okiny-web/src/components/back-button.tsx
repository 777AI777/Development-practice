"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

const buttonClassName = "inline-flex items-center rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground";

type BackButtonProps =
  | { href: string; onClick?: never }
  | { onClick?: () => void; href?: never };

function BackButtonWithRouter({ onClick }: { onClick?: () => void }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={onClick ?? (() => router.back())}
      className={buttonClassName}
      aria-label="戻る"
    >
      <BackArrowIcon />
    </button>
  );
}

export function BackButton(props: BackButtonProps) {
  if (props.href) {
    return (
      <Link href={props.href} className={buttonClassName} aria-label="戻る">
        <BackArrowIcon />
      </Link>
    );
  }

  return <BackButtonWithRouter onClick={props.onClick} />;
}
