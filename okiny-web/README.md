# OKINY Web (Phase1)

This app now follows the mock structure with multiple screens and transitions.

## Key behavior

- Drafts are saved in browser `IndexedDB`.
- Draft scope is per `userId` in the current browser only.
- Draft limit is `5` per user; 6th save is rejected with warning toast.
- Publishing writes to Supabase (via internal API routes) and removes the local draft.
- Server side handles only published rankings.

## Environment variables

Set these in `.env.local` and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ENABLE_SNS_EXPANSION=false
```

- `NEXT_PUBLIC_ENABLE_SNS_EXPANSION`: Feed/Profile/Notifications などSNS拡張導線の有効化。

## Supabase table assumptions

- `rankings` table:
  - `id`, `user_id`, `title`, `tag_id`, `created_at`, `updated_at`
- `ranking_items` table:
  - `id`, `ranking_id`, `rank`, `item_text`
- `ranking_items.ranking_id` references `rankings.id`

## Implemented mock screen routes

- `/login` (01)
- `/rankings` (02)
- `/rankings/new` (03 create)
- `/rankings/:id/edit` (03 edit)
- `/rankings/:id` (04)
- `/search` (05)
- `/drafts` (06)
- `/settings` (07)
- `/settings/logout` (07a)
- `/rankings/:id/delete` (08)

## Commands

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npx tsc --noEmit
```

## Note about tests in this environment

`npm run test` can fail with `spawn EPERM` in this sandbox due process spawn restrictions.

## UX / 遷移ドキュメント

- `docs/screen-transition.md`: As-Is / To-Be のMermaid遷移図
- `docs/ux-improvement-backlog.md`: P0/P1/P2 改善バックログ
- `docs/metrics-and-events.md`: 継続率改善の計測定義
