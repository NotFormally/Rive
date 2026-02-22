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

-- 8. Note: Existing seed data with NULL restaurant_id will become inaccessible
-- after enabling RLS. This is intentional — seed data was for dev only.
-- Re-create through the app after signing up.
