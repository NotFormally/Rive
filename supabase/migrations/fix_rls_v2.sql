DROP POLICY IF EXISTS "Members can view team" ON restaurant_members;

CREATE POLICY "Members can view team"
  ON restaurant_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    restaurant_id IN (
      SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
    )
  );
