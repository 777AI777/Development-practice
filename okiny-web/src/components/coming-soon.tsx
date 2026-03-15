interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px] rounded-xl border border-border bg-card p-10 text-center shadow-sm">
        <span className="text-5xl" role="img" aria-label="ロケット">
          {"\uD83D\uDE80"}
        </span>
        <h2 className="mt-4 text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <span className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
