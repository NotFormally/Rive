# Migrate — Supabase Database Migration Workflow

Manage Supabase migrations: create, validate, push, and repair.

## Context
- Project: RIVE (rivehub.com)
- Supabase project ref: vjvvoabwtwnfwwqxhtfj
- Migrations dir: `supabase/migrations/`
- Migration files MUST follow naming pattern: `<YYYYMMDDHHmmss>_name.sql`

## Steps

### 1. Check current state
- Run `npx supabase migration list` to see Local vs Remote status
- Identify: pending local migrations, remote-only migrations (drift), and synced ones
- Report the current state before making any changes

### 2. Fix naming issues
- If any migration files don't match `<timestamp>_name.sql` pattern, they'll be skipped
- Rename them using a timestamp based on their creation date
- Verify they appear in `migration list` after rename

### 3. Handle drift
- If there are remote-only migrations not in local, run:
  `npx supabase migration repair --status reverted <ids...>`
- This marks them as "already handled" so local migrations can proceed

### 4. Validate SQL before pushing
- Read each pending migration file
- Check for common issues:
  - References to functions that may not exist (e.g., `handle_updated_at()`)
  - Missing `CREATE OR REPLACE FUNCTION` before triggers that use custom functions
  - Missing `IF NOT EXISTS` on CREATE TABLE/INDEX statements
  - RLS policies referencing tables that may not exist yet
- Fix any issues found

### 5. Push migrations
- Run `npx supabase db push`
- If a migration fails:
  1. Note which migration failed and why
  2. Fix the SQL in the migration file
  3. Run `npx supabase migration repair --status reverted <failed_id>`
  4. Retry `npx supabase db push`

### 6. Verify
- Run `npx supabase migration list` and confirm all show Local = Remote
- Report success or any remaining issues

## Creating new migrations
When the user asks to create a new table or modify the schema:
```bash
npx supabase migration new <descriptive_name>
```
This creates a properly timestamped file. Then write the SQL into it.
