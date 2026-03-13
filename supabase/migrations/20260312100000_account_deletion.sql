-- Account Deletion: audit log for GDPR/Law 25 compliance
-- Tracks who deleted what and when, without storing PII

CREATE TABLE IF NOT EXISTS public.account_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_at timestamptz NOT NULL DEFAULT now(),
  restaurant_id uuid NOT NULL,
  restaurant_name_hash text NOT NULL, -- SHA256 hash, not plaintext
  owner_email_hash text NOT NULL,     -- SHA256 hash, not plaintext
  team_members_dissociated int NOT NULL DEFAULT 0,
  stripe_subscription_cancelled boolean NOT NULL DEFAULT false,
  cascade_completed boolean NOT NULL DEFAULT false,
  deletion_reason text
);

-- No RLS needed — this table is admin-only (service role)
ALTER TABLE public.account_deletion_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read
CREATE POLICY "Service role only" ON public.account_deletion_log
  FOR ALL USING (false);

COMMENT ON TABLE public.account_deletion_log IS
  'GDPR/Law 25 audit trail for account deletions. Stores only hashed identifiers.';
