import type { ReactNode } from "react";

interface EmptyStateMessageProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyStateMessage({
  title,
  description,
  children,
}: EmptyStateMessageProps) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
