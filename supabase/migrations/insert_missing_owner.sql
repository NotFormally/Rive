INSERT INTO restaurant_members (restaurant_id, user_id, role, accepted_at)
SELECT id, user_id, 'owner', now()
FROM restaurant_profiles
WHERE user_id IS NOT NULL
ON CONFLICT (restaurant_id, user_id) DO NOTHING;
