"use client";

import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Card>
      <CardContent className="px-4 py-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          テーマ設定
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">ダークモード</span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={toggleTheme}
            aria-label="ダークモード切り替え"
          />
        </div>
      </CardContent>
    </Card>
  );
}
