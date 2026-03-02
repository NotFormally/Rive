-- ============================================================================
-- Migration v17: Remove "viewer" role
--
-- 1. Convert any existing viewer members to editor
-- 2. Drop old CHECK constraint and add new one without viewer
-- ============================================================================

-- Step 1: Migrate existing viewers to editors
UPDATE restaurant_members SET role = 'editor' WHERE role = 'viewer';

-- Step 2: Replace the CHECK constraint
ALTER TABLE restaurant_members DROP CONSTRAINT IF EXISTS restaurant_members_role_check;
ALTER TABLE restaurant_members ADD CONSTRAINT restaurant_members_role_check CHECK (role IN ('owner','admin','editor'));
