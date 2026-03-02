# Deploy Workflow

Full pre-deployment pipeline for the RIVE SaaS application.

## Steps

### 1. Pre-flight checks
- Run `npx next build` and fix any TypeScript or build errors
- Scan for hardcoded secrets: grep for API keys, tokens, passwords in `src/` (ignore `.env*`)
- Verify all client initializations (Supabase, Stripe) use lazy initialization — no top-level `new Stripe()` or `createClient()` calls that fail when env vars are missing at build time

### 2. Database migrations
- Run `npx supabase migration list` to check for pending migrations
- If there are local-only migrations, run `npx supabase db push` and verify they succeed
- If a migration fails (e.g., missing function), fix the migration SQL, run `npx supabase migration repair --status reverted <id>`, and retry
- After success, confirm all migrations show Local = Remote

### 3. Route & page validation
- Use a Task agent to scan all routes in `src/app/[locale]/` and verify each has a valid `page.tsx` that exports a default component
- Flag any broken imports, missing pages, or placeholder "Coming Soon" components that should be real pages
- Verify tab navigation links point to existing routes

### 4. Git commit & push
- Stage only relevant files (never stage `.env*`, credentials, or `node_modules/`)
- Write a descriptive commit message summarizing changes
- Push to `main` with `git push origin main`

### 5. Post-deploy verification
- Run `npx vercel ls` or check the Vercel dashboard for deployment status
- If deployment fails, check Vercel build logs via `npx vercel logs`
- Report final status: success or failure with details

## Rollback
If anything fails after push:
- `git revert HEAD` to undo the last commit
- `npx supabase migration repair --status reverted <id>` to undo failed migrations
- Push the revert commit
