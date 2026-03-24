"use client";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEP_LABELS = ["タグ選択", "タイトル", "ランキング入力"] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-start gap-0">
        {STEP_LABELS.map((label, index) => {
          const step = (index + 1) as 1 | 2 | 3;
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
              {step < 3 && (
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
