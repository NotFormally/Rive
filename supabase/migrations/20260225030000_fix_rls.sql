DROP POLICY IF EXISTS "Members can view team" ON restaurant_members;

CREATE POLICY "Members can view team"
  ON restaurant_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    restaurant_id IN (
      SELECT rm.restaurant_id FROM restaurant_members rm
      WHERE rm.user_id = auth.uid() AND rm.accepted_at IS NOT NULL
    )
  );
