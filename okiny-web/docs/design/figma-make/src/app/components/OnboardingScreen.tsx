import { useState, useCallback } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { Screen } from "./types";

type WizardStep = 1 | 2 | 3 | 4;

interface OnboardingScreenProps {
  onNavigate: (screen: Screen) => void;
}

const STEP_LABELS = [
  "プロフィール",
  "タグ選択",
  "タイトル",
  "好きなもの入力",
] as const;

const RECOMMENDED_TAGS = [
  { id: "t1", name: "映画" },
  { id: "t2", name: "音楽" },
  { id: "t3", name: "旅行" },
  { id: "t4", name: "カフェ" },
  { id: "t5", name: "化粧品" },
  { id: "t6", name: "日用品" },
];

const PLACEHOLDERS = [
  "好きなもの（1つめ）",
  "好きなもの（2つめ）",
  "好きなもの（3つめ）",
] as const;

function StepIndicator({
  currentStep,
  totalSteps = 4,
}: {
  currentStep: WizardStep;
  totalSteps?: number;
}) {
  const labels = STEP_LABELS.slice(0, totalSteps);

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-start gap-0">
        {labels.map((label, index) => {
          const step = (index + 1) as WizardStep;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isActive = isCompleted || isCurrent;

          return (
            <div key={step} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-border text-muted-foreground"
                  }`}
                >
                  {step}
                </div>
                <span className="mt-1.5 text-xs text-muted-foreground">
                  {label}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`mt-4 h-0.5 w-10 shrink-0 ${
                    isCompleted ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileStepMock({ onNext }: { onNext: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [displayUserId, setDisplayUserId] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--foreground)" }}
        >
          プロフィールを設定しよう
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          他のユーザーに表示される名前とIDを設定してください
        </p>
      </div>

      {/* ユーザーネーム */}
      <div className="space-y-1">
        <Label htmlFor="onb-display-name">ユーザーネーム</Label>
        <Input
          id="onb-display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例: おきにー太郎"
        />
        <div className="flex items-center justify-end">
          <span
            className="text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            {displayName.trim().length}/30
          </span>
        </div>
      </div>

      {/* ユーザーID */}
      <div className="space-y-1">
        <Label htmlFor="onb-display-user-id">ユーザーID</Label>
        <div
          className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="select-none pl-3 text-base"
            style={{ color: "var(--muted-foreground)" }}
          >
            @
          </span>
          <input
            id="onb-display-user-id"
            type="text"
            value={displayUserId}
            onChange={(e) => setDisplayUserId(e.target.value.toLowerCase())}
            placeholder="例: okiny_taro"
            className="w-full bg-transparent px-2 py-2 text-base placeholder:text-muted-foreground focus:outline-none"
            style={{ color: "var(--foreground)" }}
          />
        </div>
        <div className="flex items-center justify-between">
          {displayUserId.length >= 3 && (
            <span className="text-xs text-green-600">
              &#10003; 利用可能
            </span>
          )}
          <span
            className="text-xs ml-auto"
            style={{ color: "var(--muted-foreground)" }}
          >
            {displayUserId.length}/20
          </span>
        </div>
      </div>

      {/* 次へボタン */}
      <Button
        onClick={onNext}
        disabled={displayName.trim().length === 0 || displayUserId.length < 3}
        className="w-full"
      >
        次へ
      </Button>
    </div>
  );
}

function TagStepMock({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [selectedTagId, setSelectedTagId] = useState("");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--foreground)" }}
        >
          タグを選ぼう
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          投稿のジャンルを選んでね
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {RECOMMENDED_TAGS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setSelectedTagId(tag.id)}
              className={`rounded-full border px-3 py-1 text-sm transition cursor-pointer ${
                selectedTagId === tag.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>

        <Input placeholder="タグを検索..." />
      </div>

      <div className="space-y-4">
        <Button
          onClick={onNext}
          disabled={selectedTagId === ""}
          className="w-full"
        >
          次へ
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm underline cursor-pointer bg-transparent border-none"
            style={{ color: "var(--muted-foreground)" }}
          >
            スキップ
          </button>
        </div>
      </div>
    </div>
  );
}

function TitleStepMock({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--foreground)" }}
        >
          テーマを決めよう
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          「映画」について
        </p>
      </div>

      <div className="space-y-1">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 好きな映画TOP5"
          aria-label="テーマ"
        />
        <div className="flex items-center justify-end">
          <span
            className="text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            {title.length}/50
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={onNext} disabled={title.length === 0}>
          次へ
        </Button>
      </div>
    </div>
  );
}

function ItemsStepMock({
  onBack,
  onPublish,
}: {
  onBack: () => void;
  onPublish: () => void;
}) {
  const [items, setItems] = useState(["", "", ""]);

  const handleItemChange = useCallback((index: number, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
  }, []);

  const hasAtLeastOne = items.some((item) => item.trim() !== "");

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--foreground)" }}
        >
          好きなものを入力しよう
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          好きな映画TOP5
        </p>
      </div>

      <div className="space-y-3">
        {PLACEHOLDERS.map((placeholder, index) => (
          <div key={index} className="flex items-center gap-3">
            <Input
              type="text"
              value={items[index]}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={onPublish} disabled={!hasAtLeastOne}>
          公開する
        </Button>
      </div>
    </div>
  );
}

export function OnboardingScreen({ onNavigate }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < 4) return (prev + 1) as WizardStep;
      return prev;
    });
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 1) return (prev - 1) as WizardStep;
      return prev;
    });
  }, []);

  const handlePublish = useCallback(() => {
    onNavigate("ranking-detail");
  }, [onNavigate]);

  const handleSkip = useCallback(() => {
    onNavigate("rankings");
  }, [onNavigate]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-[480px] mx-auto px-4 py-8">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--primary)" }}
          >
            OKINY
          </span>
        </div>

        <div className="mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>

        <Card className="p-6">
          {currentStep === 1 && (
            <ProfileStepMock onNext={handleNext} />
          )}

          {currentStep === 2 && (
            <TagStepMock onNext={handleNext} onSkip={handleSkip} />
          )}

          {currentStep === 3 && (
            <TitleStepMock onNext={handleNext} onBack={handleBack} />
          )}

          {currentStep === 4 && (
            <ItemsStepMock onBack={handleBack} onPublish={handlePublish} />
          )}
        </Card>
      </div>
    </div>
  );
}
