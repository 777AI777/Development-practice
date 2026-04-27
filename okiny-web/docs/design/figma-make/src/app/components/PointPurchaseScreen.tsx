import { useState } from "react";
import type { Screen } from "./types";

interface PointPurchaseScreenProps {
  onNavigate: (screen: Screen) => void;
}

const PACKAGES = [
  { pt: 10, price: 100 },
  { pt: 50, price: 450 },
  { pt: 100, price: 800 },
];

function BackArrow() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}

export function PointPurchaseScreen({ onNavigate }: PointPurchaseScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<{ pt: number; price: number } | null>(null);

  const handleSelect = (pkg: { pt: number; price: number }) => {
    setSelected(pkg);
    setStep(2);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* ヘッダー */}
      <header
        className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-4 border-b"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (step === 1) {
              onNavigate("self-analysis");
            } else if (step === 2) {
              setStep(1);
            } else {
              onNavigate("self-analysis");
            }
          }}
          className="mr-3 flex items-center justify-center rounded-md p-1 transition hover:bg-muted cursor-pointer bg-transparent border-none"
          style={{ color: "var(--foreground)" }}
          aria-label="戻る"
        >
          <BackArrow />
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          ポイントを購入
        </h1>
      </header>

      <main className="pt-14 pb-6">
        {/* Step 1: パッケージ選択 */}
        {step === 1 && (
          <div className="px-4 pt-6">
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              購入するポイントを選んでください。
            </p>
            <div className="flex flex-col gap-3">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.pt}
                  type="button"
                  onClick={() => handleSelect(pkg)}
                  className="w-full p-4 border rounded-xl text-left transition hover:bg-muted cursor-pointer bg-transparent"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p
                        className="text-base font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {pkg.pt} pt
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        1ptあたり約{Math.round(pkg.price / pkg.pt)}円
                      </p>
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      ¥{pkg.price.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs mt-6 text-center" style={{ color: "var(--muted-foreground)" }}>
              ※ これはUIモックです。実際の購入は行われません。
            </p>
          </div>
        )}

        {/* Step 2: 確認 */}
        {step === 2 && selected && (
          <div className="px-4 pt-6">
            <div
              className="p-5 rounded-xl border mb-6"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
            >
              <p
                className="text-sm font-medium mb-3"
                style={{ color: "var(--muted-foreground)" }}
              >
                購入内容の確認
              </p>
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="text-sm" style={{ color: "var(--foreground)" }}>ポイント数</span>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {selected.pt} pt
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm" style={{ color: "var(--foreground)" }}>金額</span>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  ¥{selected.price.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-sm mb-6 text-center" style={{ color: "var(--foreground)" }}>
              {selected.pt}ptを¥{selected.price.toLocaleString()}で購入しますか？
            </p>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition cursor-pointer border-none"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              購入する
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-xl text-sm font-medium transition cursor-pointer bg-transparent border-none mt-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              キャンセル
            </button>
          </div>
        )}

        {/* Step 3: 完了 */}
        {step === 3 && selected && (
          <div className="px-4 pt-12 flex flex-col items-center">
            <div className="mb-4" style={{ color: "var(--primary)" }}>
              <CheckIcon />
            </div>
            <h2
              className="text-base font-semibold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              購入が完了しました
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
              {selected.pt}ptが追加されました。
            </p>
            <button
              type="button"
              onClick={() => onNavigate("self-analysis")}
              className="w-full py-3 rounded-xl text-sm font-semibold transition cursor-pointer border-none"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              自己分析に戻る
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
