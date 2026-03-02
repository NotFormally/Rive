-- Fix FOR ALL RLS policies that were missing WITH CHECK clauses
-- Without WITH CHECK, INSERT and UPDATE operations are silently blocked

-- smartlogbook_entries (CRITICAL — logbook entries couldn't be saved)
DROP POLICY IF EXISTS "Users can manage their restaurant logbook entries" ON smartlogbook_entries;
CREATE POLICY "Users can manage their restaurant logbook entries"
  ON smartlogbook_entries FOR ALL
  USING (restaurant_id IN (
    SELECT rm.restaurant_id FROM restaurant_members rm
    WHERE rm.user_id = auth.uid() AND rm.accepted_at IS NOT NULL
  ))
  WITH CHECK (restaurant_id IN (
    SELECT rm.restaurant_id FROM restaurant_members rm
    WHERE rm.user_id = auth.uid() AND rm.accepted_at IS NOT NULL
  ));
