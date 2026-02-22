# Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 5 security vulnerabilities identified in the Rive audit before production deployment.

**Architecture:** Add security headers in vercel.json, create shared auth + rate-limit helpers, harden all API routes, and enable RLS on the remaining unprotected checklist tables.

**Tech Stack:** Supabase RLS/SQL, Next.js API routes, Vercel headers

---

### Task 1: Security Headers (CSP + HSTS)

**Files:**
- Modify: `vercel.json`

**Step 1: Add CSP and HSTS headers to vercel.json**

Replace the current headers array in `vercel.json` with:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.unsplash.com data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.anthropic.com; frame-ancestors 'none'"
        }
      ]
    }
  ]
}
```

**Step 2: Verify the JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('Valid JSON')"`

Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "security: add CSP and HSTS headers"
```

---

### Task 2: Auth Helper

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Create the requireAuth helper**

Create `src/lib/auth.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type AuthResult =
  | { user: { id: string }; restaurantId: string }
  | null;

/**
 * Extract and verify the Supabase auth token from an API request.
 * Returns user + restaurantId, or null if not authenticated.
 */
export async function requireAuth(req: Request): Promise<AuthResult> {
  // 1. Extract token from Authorization header or cookie
  const authHeader = req.headers.get('authorization');
  let accessToken: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.slice(7);
  } else {
    // Fallback: parse from cookie (for browser requests)
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').filter(Boolean).map(c => {
        const [key, ...rest] = c.split('=');
        return [key, rest.join('=')];
      })
    );
    const authCookieKey = Object.keys(cookies).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (authCookieKey) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookies[authCookieKey]));
        accessToken = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch {
        return null;
      }
    }
  }

  if (!accessToken) return null;

  // 2. Verify token with Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // 3. Get restaurant_id for this user
  const { data: profile } = await supabase
    .from('restaurant_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return null;

  return { user: { id: user.id }, restaurantId: profile.id };
}

/**
 * Standard 401 response for unauthenticated requests.
 */
export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Non autorisé' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Step 2: Verify it compiles**

Run: `cd /Users/nassim/Shore && npx tsc --noEmit src/lib/auth.ts 2>&1 || echo "Check errors above"`

**Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "security: add requireAuth helper for API routes"
```

---

### Task 3: Rate Limiting — Migration + Helper

**Files:**
- Create: `supabase/migration_v5_rate_limit.sql`
- Create: `src/lib/rate-limit.ts`

**Step 1: Create the ai_usage_log migration**

Create `supabase/migration_v5_rate_limit.sql`:

```sql
-- Rive — Migration v5: AI Usage Log for Rate Limiting
-- Run in Supabase SQL Editor

-- 1. Create the usage log table
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE NOT NULL,
  route TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Index for fast rate-limit lookups (restaurant + time range)
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_rate_limit
  ON ai_usage_log (restaurant_id, created_at DESC);

-- 3. Index for usage analytics (route breakdown)
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_route
  ON ai_usage_log (restaurant_id, route);

-- 4. Enable RLS
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

-- 5. Users can only insert/read their own restaurant's logs
CREATE POLICY "Users can insert own usage logs"
  ON ai_usage_log FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own usage logs"
  ON ai_usage_log FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- 6. Auto-cleanup: delete logs older than 30 days (run via pg_cron or manual)
-- SELECT cron.schedule('cleanup-ai-usage-log', '0 3 * * 0', $$
--   DELETE FROM ai_usage_log WHERE created_at < now() - interval '30 days';
-- $$);
```

**Step 2: Create the rate-limit helper**

Create `src/lib/rate-limit.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role to bypass RLS for rate-limit checks
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 30;

type RateLimitResult = { allowed: boolean; remaining: number };

/**
 * Check rate limit and log the usage if allowed.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for atomic check+insert.
 */
export async function checkRateLimit(
  restaurantId: string,
  route: string
): Promise<RateLimitResult> {
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000
  ).toISOString();

  // Count recent requests
  const { count, error } = await supabaseAdmin
    .from('ai_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('route', route)
    .gte('created_at', windowStart);

  if (error) {
    // On error, allow the request but don't log (fail open)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
  }

  const currentCount = count || 0;

  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  // Log this usage
  await supabaseAdmin.from('ai_usage_log').insert({
    restaurant_id: restaurantId,
    route,
  });

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - currentCount - 1 };
}

/**
 * Standard 429 response.
 */
export function tooManyRequests() {
  return new Response(
    JSON.stringify({ error: 'Trop de requêtes. Réessayez dans une minute.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );
}
```

**Step 3: Commit**

```bash
git add supabase/migration_v5_rate_limit.sql src/lib/rate-limit.ts
git commit -m "security: add rate limiting via Supabase ai_usage_log"
```

---

### Task 4: Harden All API Routes

**Files:**
- Modify: `src/app/api/analyze-note/route.ts`
- Modify: `src/app/api/translate-note/route.ts`
- Modify: `src/app/api/corrective-actions/route.ts`
- Modify: `src/app/api/scan-receipt/route.ts`
- Modify: `src/app/api/generate-instagram/route.ts`
- Modify: `src/app/api/menu-engineering/route.ts`

**Step 1: Add auth + rate limiting to analyze-note**

At the top of `src/app/api/analyze-note/route.ts`, add imports:

```ts
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';
```

At the beginning of the POST handler, before any processing:

```ts
    // Auth check
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Rate limit check
    const rateLimit = await checkRateLimit(auth.restaurantId, 'analyze-note');
    if (!rateLimit.allowed) return tooManyRequests();
```

**Step 2: Repeat the same pattern for translate-note**

Same imports and same auth + rate-limit block at the top of the POST handler.
Route name for rate limit: `'translate-note'`

**Step 3: Repeat for corrective-actions**

Route name: `'corrective-actions'`

**Step 4: Repeat for scan-receipt**

Route name: `'scan-receipt'`

**Step 5: Repeat for generate-instagram**

Route name: `'generate-instagram'`

**Step 6: Repeat for menu-engineering**

This route uses GET instead of POST. Same pattern applies:

```ts
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';
```

At the beginning of the GET handler:

```ts
    // Auth check — pass the request object
    const auth = await requireAuth(new Request(request.url, { headers: request.headers }));
    if (!auth) return unauthorized();

    const rateLimit = await checkRateLimit(auth.restaurantId, 'menu-engineering');
    if (!rateLimit.allowed) return tooManyRequests();
```

Note: `menu-engineering/route.ts` exports `GET()` with no `req` parameter currently. Change the signature to `GET(request: Request)` to access headers.

**Step 7: Verify the project compiles**

Run: `cd /Users/nassim/Shore && npx next build 2>&1 | tail -20`

Expected: Build succeeds with no errors.

**Step 8: Commit**

```bash
git add src/app/api/
git commit -m "security: add auth + rate limiting to all API routes"
```

---

### Task 5: RLS for Checklist Tables

**Files:**
- Create: `supabase/migration_v6_checklist_rls.sql`

**Step 1: Create the migration**

Create `supabase/migration_v6_checklist_rls.sql`:

```sql
-- Rive — Migration v6: Enable RLS on Checklist Tables
-- Run in Supabase SQL Editor
-- These tables were created in supabase-setup.sql with RLS disabled.

-- 1. Add restaurant_id to checklist tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurant_profiles(id);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurant_profiles(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurant_profiles(id);
-- tasks and log_entries inherit scope via their FK to templates/sessions

-- 2. Enable RLS on all checklist tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;

-- 3. Policies for "users" table (restaurant staff)
CREATE POLICY "Tenant select users"
  ON users FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant insert users"
  ON users FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant update users"
  ON users FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant delete users"
  ON users FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- 4. Policies for "templates" table
CREATE POLICY "Tenant select templates"
  ON templates FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant insert templates"
  ON templates FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant update templates"
  ON templates FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant delete templates"
  ON templates FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- 5. Policies for "tasks" — scoped via template's restaurant_id
CREATE POLICY "Tenant select tasks"
  ON tasks FOR SELECT
  USING (template_id IN (
    SELECT id FROM templates WHERE restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Tenant insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (template_id IN (
    SELECT id FROM templates WHERE restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Tenant update tasks"
  ON tasks FOR UPDATE
  USING (template_id IN (
    SELECT id FROM templates WHERE restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Tenant delete tasks"
  ON tasks FOR DELETE
  USING (template_id IN (
    SELECT id FROM templates WHERE restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  ));

-- 6. Policies for "sessions" — scoped via restaurant_id
CREATE POLICY "Tenant select sessions"
  ON sessions FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant insert sessions"
  ON sessions FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant update sessions"
  ON sessions FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant delete sessions"
  ON sessions FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- 7. Policies for "log_entries" — scoped via session's restaurant_id
CREATE POLICY "Tenant select log_entries"
  ON log_entries FOR SELECT
  USING (session_id IN (
    SELECT id FROM sessions WHERE restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Tenant insert log_entries"
  ON log_entries FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Tenant update log_entries"
  ON log_entries FOR UPDATE
  USING (session_id IN (
    SELECT id FROM sessions WHERE restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Tenant delete log_entries"
  ON log_entries FOR DELETE
  USING (session_id IN (
    SELECT id FROM sessions WHERE restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  ));

-- 8. Update existing seed data to link to a restaurant (if needed)
-- NOTE: Existing seed data with NULL restaurant_id will become inaccessible
-- after enabling RLS. This is intentional — seed data was for dev only.
-- Re-create through the app after signing up.
```

**Step 2: Commit**

```bash
git add supabase/migration_v6_checklist_rls.sql
git commit -m "security: enable RLS on all checklist tables with tenant isolation"
```

---

### Task 6: Run Migrations on Supabase

**This is a manual step.** Run each migration in the Supabase SQL Editor in order:

1. `supabase/migration_v5_rate_limit.sql`
2. `supabase/migration_v6_checklist_rls.sql`

**Verify:** In Supabase dashboard → Table Editor → check that all tables show a lock icon (RLS enabled).

---

### Task 7: Add SUPABASE_SERVICE_ROLE_KEY to Environment

**This is a manual step.** The rate-limit helper uses `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to the client).

1. Find the key in Supabase dashboard → Settings → API → `service_role` key
2. Add to `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=your-key-here`
3. Add to Vercel environment variables when deploying

**Important:** This key bypasses RLS. It must NEVER be prefixed with `NEXT_PUBLIC_`.

---

### Task 8: Final Verification

**Step 1: Build the project**

Run: `cd /Users/nassim/Shore && npm run build`

Expected: Build succeeds.

**Step 2: Test locally**

Run: `npm run dev`

1. Open the app, sign up / log in
2. Try using the logbook (analyze a note) — should work when authenticated
3. Open an incognito window, try calling `/api/analyze-note` directly via curl without a token — should get 401
4. Verify the dashboard still loads correctly

**Step 3: Final commit**

```bash
git add -A
git commit -m "security: complete security hardening — RLS, auth, rate limiting, CSP, HSTS"
```
