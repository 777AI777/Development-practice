import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Screen =
  | "login"
  | "rankings"
  | "ranking-detail"
  | "ranking-new"
  | "ranking-edit"
  | "delete-confirm"
  | "drafts"
  | "search"
  | "settings"
  | "logout-confirm";

interface LoginScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate("rankings");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-[480px] flex flex-col items-center gap-8">
        <div className="text-center flex flex-col gap-2">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--primary)" }}
          >
            OKINY
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            ランキング共有SNS
          </p>
        </div>

        <Card
          className="w-full shadow-sm rounded-xl"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="email"
                  style={{ color: "var(--foreground)" }}
                >
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@okiny.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ backgroundColor: "var(--input-background)" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="password"
                  style={{ color: "var(--foreground)" }}
                >
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ backgroundColor: "var(--input-background)" }}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                ログイン
              </Button>
            </form>

            <p
              className="text-center text-xs mt-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              アカウントをお持ちでない方
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
