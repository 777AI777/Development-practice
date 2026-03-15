# Security Guidelines

## Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

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
