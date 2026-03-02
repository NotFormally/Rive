# Audit — Pre-Deploy Quality Check

Comprehensive audit of the RIVE codebase to catch issues before they hit production.

## Steps

### 1. Route integrity
- Scan all directories under `src/app/[locale]/` for route segments
- Verify each route has a `page.tsx` that exports a default React component
- Check all `<a href>` and `<Link>` tags in navigation components (Sidebar, tab navs) point to existing routes
- Flag any routes with placeholder/mock content that should be real implementations

### 2. TypeScript health
- Run `npx next build` and capture any TypeScript errors
- For each error: identify the file, show the error, and suggest a fix
- Check for `any` types in API routes and critical business logic

### 3. i18n coverage
- Compare key counts across `messages/en.json` and `messages/fr.json` — they must match exactly
- Scan `src/` for hardcoded French or English strings that should use `useTranslations()`
- Verify all `t('key')` calls reference keys that exist in the locale files

### 4. Security scan
- Grep `src/` for hardcoded API keys, tokens, passwords, or secrets
- Verify all API routes use `requireAuth()` — flag any unprotected endpoints
- Check that `.env.local` is in `.gitignore`
- Verify Supabase RLS is enabled on all tables referenced in the codebase

### 5. Mobile responsiveness
- Scan dashboard components for missing responsive classes (`sm:`, `md:`, `lg:`)
- Flag any `overflow` issues: elements with fixed widths inside flex containers
- Check all buttons and interactive elements have adequate touch targets (min 44px)

### 6. Report
Output a markdown summary:
- **Critical** — must fix before deploy (broken routes, security issues, build errors)
- **Warning** — should fix soon (i18n gaps, missing responsive classes)
- **Info** — nice to have (placeholder buttons, TODO comments)
