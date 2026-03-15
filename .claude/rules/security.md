# Security Guidelines

## Mandatory Security Checks

Before ANY commit:

### 実装済み — 毎回確認
- [ ] No hardcoded secrets — `.env.local` に集約、コード内にURL/キー直書きなし
- [ ] User inputs validated — Zod schema でバリデーション（API routes）
- [ ] Authentication/authorization — Supabase Auth + RLS policies + auth-guard.ts
- [ ] Error messages safe — エラーレスポンスに内部情報（stack trace, DB構造）を含めない
- [ ] XSS prevention — React のデフォルトエスケープ + dangerouslySetInnerHTML 禁止

### 自動保護（フレームワーク依存）
- CSRF — Next.js App Router の SameSite cookie で自動保護
- SQL injection — Supabase REST API のパラメータ化クエリ（直接SQL記述なし）

## Secret Management

```typescript
// NEVER: Hardcoded secrets
const supabaseUrl = "https://xxxxx.supabase.co"

// ALWAYS: Environment variables（定義一覧は CLAUDE.md Environment Variables参照）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured')
}
```

## Security Response Protocol

If security issue found:
1. STOP immediately
2. CRITICAL issues を先に修正
3. Rotate any exposed secrets
4. Review entire codebase for similar issues

> エージェント運用（security-reviewer のトリガー・タイミング等）は `.claude/rules/orchestration.md` を参照。
