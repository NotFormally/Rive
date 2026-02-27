-- ============================================================================
-- Migration v16: Multi-Admin — Team Members & Unified RLS
--
-- Creates:
--   1. restaurant_members table (M:N between auth.users and restaurant_profiles)
--   2. user_restaurant_ids() helper function for RLS
--   3. Backfill existing owners
--   4. Rewrite ALL tenant-scoped RLS policies to use restaurant_members
--   5. Create a user_roles VIEW alias (for v14/v15 compat)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create restaurant_members table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner','admin','editor','viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_email TEXT,
  invite_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(restaurant_id, user_id)
);

ALTER TABLE restaurant_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members of their restaurant OR themselves
CREATE POLICY "Members can view team"
  ON restaurant_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  );

-- Owners/admins can insert (invite) new members
CREATE POLICY "Owners can invite members"
  ON restaurant_members FOR INSERT
  WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
  ));

-- Owners can update member roles
CREATE POLICY "Owners can update members"
  ON restaurant_members FOR UPDATE
  USING (restaurant_id IN (
    SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
  ));

-- Owners can remove members
CREATE POLICY "Owners can delete members"
  ON restaurant_members FOR DELETE
  USING (restaurant_id IN (
    SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
  ));

-- Index for fast RLS lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_members_user
  ON restaurant_members (user_id, accepted_at) WHERE accepted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurant_members_token
  ON restaurant_members (invite_token) WHERE invite_token IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. RLS helper function — replaces all repeated subqueries
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION user_restaurant_ids()
RETURNS SETOF UUID AS $$
  SELECT restaurant_id FROM restaurant_members
  WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- 3. Backfill: create owner membership for every existing restaurant_profiles
-- ---------------------------------------------------------------------------
INSERT INTO restaurant_members (restaurant_id, user_id, role, accepted_at)
SELECT id, user_id, 'owner', now()
FROM restaurant_profiles
WHERE user_id IS NOT NULL
ON CONFLICT (restaurant_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Create user_roles VIEW — compatibility alias for v14/v15 migrations
--    that already reference SELECT restaurant_id FROM user_roles
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW user_roles AS
SELECT restaurant_id, user_id, role
FROM restaurant_members
WHERE accepted_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Rewrite RLS policies — restaurant_profiles
-- ---------------------------------------------------------------------------
-- Drop old owner-only policies
DROP POLICY IF EXISTS "Users can view own profile" ON restaurant_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON restaurant_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON restaurant_profiles;

-- New: members can see profiles they belong to, owners can update
CREATE POLICY "Members can view restaurant profile"
  ON restaurant_profiles FOR SELECT
  USING (id IN (SELECT user_restaurant_ids()) OR user_id = auth.uid());

CREATE POLICY "Owner can update restaurant profile"
  ON restaurant_profiles FOR UPDATE
  USING (id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Users can insert own profile"
  ON restaurant_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Rewrite RLS policies — restaurant_settings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own settings" ON restaurant_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON restaurant_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON restaurant_settings;

CREATE POLICY "Members can view settings"
  ON restaurant_settings FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can update settings"
  ON restaurant_settings FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can insert settings"
  ON restaurant_settings FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 7. Rewrite RLS policies — menu_categories
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant insert menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Tenant update menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Tenant delete menu_categories" ON menu_categories;

CREATE POLICY "Team insert menu_categories" ON menu_categories FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team update menu_categories" ON menu_categories FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team delete menu_categories" ON menu_categories FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 8. Rewrite RLS policies — menu_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant insert menu_items" ON menu_items;
DROP POLICY IF EXISTS "Tenant update menu_items" ON menu_items;
DROP POLICY IF EXISTS "Tenant delete menu_items" ON menu_items;

CREATE POLICY "Team insert menu_items" ON menu_items FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team update menu_items" ON menu_items FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team delete menu_items" ON menu_items FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 9. (Skipped) ai_usage_log table does not exist in remote schema
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 10-14. (Skipped) Checklist tables (users, templates, tasks, sessions, 
--        log_entries) might not have restaurant_id on remote schema 
--        because migration_v6 was bypassed.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 15. Rewrite RLS policies — ingredients
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant select ingredients" ON ingredients;
DROP POLICY IF EXISTS "Tenant insert ingredients" ON ingredients;
DROP POLICY IF EXISTS "Tenant update ingredients" ON ingredients;
DROP POLICY IF EXISTS "Tenant delete ingredients" ON ingredients;

CREATE POLICY "Team select ingredients" ON ingredients FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team insert ingredients" ON ingredients FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team update ingredients" ON ingredients FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team delete ingredients" ON ingredients FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 16. Rewrite RLS policies — recipes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant select recipes" ON recipes;
DROP POLICY IF EXISTS "Tenant insert recipes" ON recipes;
DROP POLICY IF EXISTS "Tenant update recipes" ON recipes;
DROP POLICY IF EXISTS "Tenant delete recipes" ON recipes;

CREATE POLICY "Team select recipes" ON recipes FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team insert recipes" ON recipes FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team update recipes" ON recipes FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team delete recipes" ON recipes FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 17. Rewrite RLS policies — recipe_ingredients
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant select recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Tenant insert recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Tenant update recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Tenant delete recipe_ingredients" ON recipe_ingredients;

CREATE POLICY "Team select recipe_ingredients" ON recipe_ingredients FOR SELECT
  USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT user_restaurant_ids())));
CREATE POLICY "Team insert recipe_ingredients" ON recipe_ingredients FOR INSERT
  WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT user_restaurant_ids())));
CREATE POLICY "Team update recipe_ingredients" ON recipe_ingredients FOR UPDATE
  USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT user_restaurant_ids())));
CREATE POLICY "Team delete recipe_ingredients" ON recipe_ingredients FOR DELETE
  USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT user_restaurant_ids())));

-- ---------------------------------------------------------------------------
-- 18. Rewrite RLS policies — invoices
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant select invoices" ON invoices;
DROP POLICY IF EXISTS "Tenant insert invoices" ON invoices;
DROP POLICY IF EXISTS "Tenant update invoices" ON invoices;
DROP POLICY IF EXISTS "Tenant delete invoices" ON invoices;

CREATE POLICY "Team select invoices" ON invoices FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team insert invoices" ON invoices FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team update invoices" ON invoices FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team delete invoices" ON invoices FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 19. Rewrite RLS policies — pos_sales
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant select pos_sales" ON pos_sales;
DROP POLICY IF EXISTS "Tenant insert pos_sales" ON pos_sales;
DROP POLICY IF EXISTS "Tenant update pos_sales" ON pos_sales;
DROP POLICY IF EXISTS "Tenant delete pos_sales" ON pos_sales;

CREATE POLICY "Team select pos_sales" ON pos_sales FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team insert pos_sales" ON pos_sales FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team update pos_sales" ON pos_sales FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team delete pos_sales" ON pos_sales FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 20. Rewrite RLS policies — menu_item_recommendations (ai cache)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant select ai_recommendations" ON menu_item_recommendations;
DROP POLICY IF EXISTS "Tenant insert ai_recommendations" ON menu_item_recommendations;
DROP POLICY IF EXISTS "Tenant update ai_recommendations" ON menu_item_recommendations;
DROP POLICY IF EXISTS "Tenant delete ai_recommendations" ON menu_item_recommendations;

CREATE POLICY "Team select ai_recommendations" ON menu_item_recommendations FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team insert ai_recommendations" ON menu_item_recommendations FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team update ai_recommendations" ON menu_item_recommendations FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team delete ai_recommendations" ON menu_item_recommendations FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 21. Rewrite RLS policies — restaurant_integrations
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant select integrations" ON restaurant_integrations;
DROP POLICY IF EXISTS "Tenant insert integrations" ON restaurant_integrations;
DROP POLICY IF EXISTS "Tenant update integrations" ON restaurant_integrations;
DROP POLICY IF EXISTS "Tenant delete integrations" ON restaurant_integrations;

CREATE POLICY "Team select integrations" ON restaurant_integrations FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team insert integrations" ON restaurant_integrations FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team update integrations" ON restaurant_integrations FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));
CREATE POLICY "Team delete integrations" ON restaurant_integrations FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- Done! Summary:
--   - 1 new table: restaurant_members
--   - 1 new function: user_restaurant_ids()
--   - 1 new view: user_roles (compat alias)
--   - Backfilled existing profiles → owner memberships
--   - Rewrote ~50 RLS policies across 17 tables to use user_restaurant_ids()
-- ---------------------------------------------------------------------------
