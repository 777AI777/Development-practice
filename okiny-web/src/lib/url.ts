/**
 * アプリケーションのベースURLを取得する。
 * OGP画像やシェアリンクなど、絶対URLが必要な場面で使用。
 *
 * 優先順位:
 * 1. NEXT_PUBLIC_APP_URL（明示的に設定された場合）
 * 2. VERCEL_PROJECT_PRODUCTION_URL（Vercel本番デプロイ）
 * 3. VERCEL_URL（Vercelプレビューデプロイ）
 * 4. localhost:3000（ローカル開発）
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
