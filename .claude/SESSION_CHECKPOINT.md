# Session Checkpoint — 2026-02-27

## Completed

- [x] **UI Audit & Fixes** — Audited all pages affected by recent commits and fixed 6 files:
  - `settings/page.tsx` — Added missing `module_reservations` + `module_smart_prep` toggles, fixed `useRouter` import to `@/i18n/routing`, restyled to match Rive brand
  - `success/page.tsx` — Wrapped `useSearchParams` in `Suspense` boundary (Next.js 16 requirement)
  - `invite/page.tsx` — Fixed `useRouter` import to `@/i18n/routing`, applied brand colors
  - `login/page.tsx` — Replaced `bg-slate-50` / `bg-blue-600` with brand palette
  - `signup/page.tsx` — Same brand alignment as login
  - `SmartLogbook.tsx` — Removed all `dark:` classes, replaced `indigo-600` with brand `primary`/`accent`
- [x] **Build verified** — `next build` passes cleanly, no errors
- [x] **Deployed** — Committed (`db612a6`) and pushed to `origin/main`, Vercel deploy triggered
- [x] **CLAUDE.md created** — Added 5 workflow rules (General Principles, Tech Stack, Communication Style, Debugging, Environment & Config) plus structured brief template
- [x] **Deploy skill** — Created `.claude/skills/deploy/SKILL.md` for `/deploy` command
- [x] **Post-edit hook** — Added `.claude/settings.json` with `tsc --noEmit` type-check after edits
- [x] **MCP servers** — Added GitHub and Obsidian (with API key) MCP servers

## Still Pending

- [ ] **Verify Vercel deployment** — Check that `db612a6` deployed successfully on Vercel dashboard
- [ ] **Translations for settings page** — Settings page text is still hardcoded in French (no `settings` namespace in `messages/fr.json`). Low priority but needed for i18n completeness
- [ ] **Success page translations** — Hardcoded French strings, no translation keys yet
- [ ] **Invite page translations** — Same as above
- [ ] **Test MCP servers** — GitHub and Obsidian servers were added but not yet tested in a session (requires restart)
- [ ] **Post-edit hook validation** — `tsc --noEmit` hook hasn't been tested live yet

## Notes for Next Time

- The app does NOT use dark mode — avoid `dark:` Tailwind classes anywhere
- Brand colors: `bg-primary` (#2E4036), `bg-accent` (#CC5833), `bg-background` (#F2F0E9), `bg-foreground` (#1A1A1A)
- Always use `useRouter` from `@/i18n/routing`, never from `next/navigation` (breaks locale prefixing)
- `useSearchParams` requires a `Suspense` boundary in Next.js 16 client components
- The `module_reservations` and `module_smart_prep` columns may not exist in older database rows — the code uses `?? true` fallback in `computeEffectiveModules`
