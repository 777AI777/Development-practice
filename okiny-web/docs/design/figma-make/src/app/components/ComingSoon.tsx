import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center px-4 py-16">
      <Card
        className="w-full max-w-[400px] text-center shadow-sm rounded-xl"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <span className="text-5xl" role="img" aria-label="ロケット">
            🚀
          </span>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h2>
          <p
            className="text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            {description}
          </p>
          <Badge
            variant="secondary"
            className="text-xs"
            style={{
              backgroundColor: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            Coming Soon
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
