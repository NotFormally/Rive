-- Fix all recursive RLS policies on restaurant_members
-- The INSERT, UPDATE, DELETE policies were querying restaurant_members itself,
-- causing infinite recursion. Fix: reference restaurant_profiles instead.

-- Fix INSERT policy
DROP POLICY IF EXISTS "Owners can invite members" ON restaurant_members;

CREATE POLICY "Owners can invite members"
  ON restaurant_members FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  );

-- Fix UPDATE policy
DROP POLICY IF EXISTS "Owners can update members" ON restaurant_members;

CREATE POLICY "Owners can update members"
  ON restaurant_members FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  );

-- Fix DELETE policy
DROP POLICY IF EXISTS "Owners can delete members" ON restaurant_members;

CREATE POLICY "Owners can delete members"
  ON restaurant_members FOR DELETE
  USING (
    restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  );
