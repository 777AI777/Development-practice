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

const buttonClassName = "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground";

type BackButtonProps =
  | { href: string; label?: string; onClick?: never }
  | { onClick?: () => void; label?: string; href?: never };

function BackButtonWithRouter({ onClick, label }: { onClick?: () => void; label?: string }) {
  const router = useRouter();
  const ariaLabel = label ? undefined : "戻る";

  return (
    <button
      type="button"
      onClick={onClick ?? (() => router.back())}
      className={buttonClassName}
      aria-label={ariaLabel}
    >
      <BackArrowIcon />
      {label && <span>{label}</span>}
    </button>
  );
}

export function BackButton(props: BackButtonProps) {
  if (props.href) {
    const ariaLabel = props.label ? undefined : "戻る";
    return (
      <Link href={props.href} className={buttonClassName} aria-label={ariaLabel}>
        <BackArrowIcon />
        {props.label && <span>{props.label}</span>}
      </Link>
    );
  }

  return <BackButtonWithRouter onClick={props.onClick} label={props.label} />;
}
