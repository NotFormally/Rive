-- Support reports table: stores chat logs sent by users reporting issues
CREATE TABLE IF NOT EXISTS support_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  chat_log JSONB NOT NULL,
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE support_reports ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated users for their own restaurant
DROP POLICY IF EXISTS "Users can insert own support reports" ON support_reports;
CREATE POLICY "Users can insert own support reports" ON support_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow reads for admin
DROP POLICY IF EXISTS "Authenticated can read support reports" ON support_reports;
CREATE POLICY "Authenticated can read support reports" ON support_reports
  FOR SELECT TO authenticated USING (true);
