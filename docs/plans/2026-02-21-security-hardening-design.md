# Security Hardening Design

**Date:** 2026-02-21
**Status:** Approved

## Context

Audit of the Rive codebase revealed 5 security issues to fix before production deployment:

1. RLS disabled on all Supabase tables (Critical)
2. API routes have no authentication checks (High)
3. No rate limiting on AI-powered routes (High)
4. No Content-Security-Policy header (Medium)
5. No Strict-Transport-Security header (Low)

## Design

### 1. Row Level Security (RLS) — Critical

**Problem:** All tables have `DISABLE ROW LEVEL SECURITY` in `supabase-setup.sql`. Anyone with the anon key can read/write all data.

**Solution:** Enable RLS on all tables and create policies scoped to the authenticated user's restaurant.

- Auth chain: `auth.uid()` → `restaurant_profiles.user_id` → `restaurant_id`
- Every table with a `restaurant_id` column gets a policy: `SELECT/INSERT/UPDATE/DELETE WHERE restaurant_id = (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())`
- Legacy tables (`users`, `templates`, `tasks`, `sessions`, `log_entries`) from `supabase-setup.sql` need `restaurant_id` added or need policies based on the `admin`/`staff` role system

**Files:** New SQL migration file

### 2. API Route Authentication — High

**Problem:** Routes `/api/analyze-note`, `/api/generate-instagram`, `/api/menu-engineering`, `/api/translate-note`, `/api/corrective-actions`, `/api/scan-receipt` accept requests without verifying the caller is authenticated.

**Solution:** Create a shared `requireAuth()` helper that:
- Extracts the Supabase access token from the request `Authorization` header or cookies
- Verifies the token via `supabase.auth.getUser()`
- Returns the user object or a 401 response

Every API route calls this as its first operation.

**Files:** New `src/lib/auth.ts`, modifications to all 5+ API route files

### 3. Rate Limiting via Supabase — High

**Problem:** AI routes call the Anthropic API without any usage limits. Abuse could cause runaway costs.

**Solution:** Supabase-backed rate limiting with a new `ai_usage_log` table:
- Columns: `id`, `restaurant_id`, `route`, `created_at`
- Each AI API call inserts a row
- Before processing, count rows for this restaurant in the last 60 seconds
- If count > 30 → return 429 Too Many Requests
- This table also serves as foundation for future usage-based trial limits

**Files:** New SQL migration, new `src/lib/rate-limit.ts`, modifications to AI route files

### 4. Content-Security-Policy Header — Medium

**Problem:** No CSP header configured. XSS attacks could inject malicious scripts.

**Solution:** Add CSP header in `vercel.json` allowing only:
- `'self'` for scripts and styles
- Supabase domain for API connections
- `images.unsplash.com` for images
- `'unsafe-inline'` for styles (required by Tailwind/inline styles)

**Files:** `vercel.json`

### 5. Strict-Transport-Security Header — Low

**Problem:** No HSTS header. While Vercel forces HTTPS, HSTS adds browser-level enforcement.

**Solution:** Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` in `vercel.json`.

**Files:** `vercel.json`

## Files Summary

| Change | Files |
|---|---|
| RLS migration | `supabase/migration_v4_rls.sql` |
| Auth helper | `src/lib/auth.ts` (new) |
| Rate limit helper + migration | `src/lib/rate-limit.ts` (new), `supabase/migration_v5_usage_log.sql` |
| API route hardening | `src/app/api/analyze-note/route.ts`, `src/app/api/generate-instagram/route.ts`, `src/app/api/menu-engineering/route.ts`, `src/app/api/translate-note/route.ts`, `src/app/api/corrective-actions/route.ts`, `src/app/api/scan-receipt/route.ts` |
| Security headers | `vercel.json` |
