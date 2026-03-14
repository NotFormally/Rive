-- Migration: Modernize Legacy RLS Policies + Fix Missing SELECT Policies
--
-- This migration does two things:
-- 1. Rewrites 6 legacy tables from `restaurant_profiles.user_id` pattern
--    to the modern `user_restaurant_ids()` function (supports multi-admin teams)
-- 2. Adds missing SELECT policies for menu_categories and menu_items
--
-- Background: The `user_restaurant_ids()` function (created in v16/team_members)
-- returns all restaurant_ids where the user is a confirmed member. The old pattern
-- `restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())`
-- only works for the restaurant OWNER, not for invited editors/admins.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. unit_conversions — Modernize to user_restaurant_ids()
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Tenant select unit_conversions" ON unit_conversions;
DROP POLICY IF EXISTS "Tenant insert unit_conversions" ON unit_conversions;
DROP POLICY IF EXISTS "Tenant update unit_conversions" ON unit_conversions;
DROP POLICY IF EXISTS "Tenant delete unit_conversions" ON unit_conversions;

CREATE POLICY "Team select unit_conversions" ON unit_conversions
  FOR SELECT USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team insert unit_conversions" ON unit_conversions
  FOR INSERT WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team update unit_conversions" ON unit_conversions
  FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team delete unit_conversions" ON unit_conversions
  FOR DELETE USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. deposits_ledger — Modernize to user_restaurant_ids()
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Tenant select deposits_ledger" ON deposits_ledger;
DROP POLICY IF EXISTS "Tenant insert deposits_ledger" ON deposits_ledger;
DROP POLICY IF EXISTS "Tenant update deposits_ledger" ON deposits_ledger;
DROP POLICY IF EXISTS "Tenant delete deposits_ledger" ON deposits_ledger;

CREATE POLICY "Team select deposits_ledger" ON deposits_ledger
  FOR SELECT USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team insert deposits_ledger" ON deposits_ledger
  FOR INSERT WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team update deposits_ledger" ON deposits_ledger
  FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team delete deposits_ledger" ON deposits_ledger
  FOR DELETE USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. variance_logs — Modernize to user_restaurant_ids()
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Tenant select variance" ON variance_logs;
DROP POLICY IF EXISTS "Tenant insert variance" ON variance_logs;
DROP POLICY IF EXISTS "Tenant update variance" ON variance_logs;
DROP POLICY IF EXISTS "Tenant delete variance" ON variance_logs;

CREATE POLICY "Team select variance_logs" ON variance_logs
  FOR SELECT USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team insert variance_logs" ON variance_logs
  FOR INSERT WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team update variance_logs" ON variance_logs
  FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team delete variance_logs" ON variance_logs
  FOR DELETE USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. spoilage_reports — Modernize to user_restaurant_ids()
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Tenant select spoilage" ON spoilage_reports;
DROP POLICY IF EXISTS "Tenant insert spoilage" ON spoilage_reports;
DROP POLICY IF EXISTS "Tenant update spoilage" ON spoilage_reports;
DROP POLICY IF EXISTS "Tenant delete spoilage" ON spoilage_reports;

CREATE POLICY "Team select spoilage_reports" ON spoilage_reports
  FOR SELECT USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team insert spoilage_reports" ON spoilage_reports
  FOR INSERT WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team update spoilage_reports" ON spoilage_reports
  FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team delete spoilage_reports" ON spoilage_reports
  FOR DELETE USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. production_batches — Modernize to user_restaurant_ids()
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Tenant select prod_batches" ON production_batches;
DROP POLICY IF EXISTS "Tenant insert prod_batches" ON production_batches;
DROP POLICY IF EXISTS "Tenant update prod_batches" ON production_batches;
DROP POLICY IF EXISTS "Tenant delete prod_batches" ON production_batches;

CREATE POLICY "Team select production_batches" ON production_batches
  FOR SELECT USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team insert production_batches" ON production_batches
  FOR INSERT WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team update production_batches" ON production_batches
  FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team delete production_batches" ON production_batches
  FOR DELETE USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. invoice_items — Modernize nested query to use user_restaurant_ids()
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Tenant select invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "Tenant insert invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "Tenant update invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "Tenant delete invoice_items" ON invoice_items;

CREATE POLICY "Team select invoice_items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE restaurant_id IN (SELECT user_restaurant_ids())
    )
  );

CREATE POLICY "Team insert invoice_items" ON invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE restaurant_id IN (SELECT user_restaurant_ids())
    )
  );

CREATE POLICY "Team update invoice_items" ON invoice_items
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE restaurant_id IN (SELECT user_restaurant_ids())
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE restaurant_id IN (SELECT user_restaurant_ids())
    )
  );

CREATE POLICY "Team delete invoice_items" ON invoice_items
  FOR DELETE USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE restaurant_id IN (SELECT user_restaurant_ids())
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. menu_categories — Add missing SELECT policy
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Team select menu_categories" ON menu_categories;
CREATE POLICY "Team select menu_categories" ON menu_categories
  FOR SELECT USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. menu_items — Add missing SELECT policy
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Team select menu_items" ON menu_items;
CREATE POLICY "Team select menu_items" ON menu_items
  FOR SELECT USING (restaurant_id IN (SELECT user_restaurant_ids()));
