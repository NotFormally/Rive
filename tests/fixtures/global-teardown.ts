/**
 * Global teardown: cleans up provisioned test users after CI runs.
 * Only activates when SUPABASE_SERVICE_ROLE_KEY is set and a user was provisioned.
 */
async function globalTeardown() {
  const userId = process.env.TEST_USER_ID;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!userId || !serviceKey || !supabaseUrl) return;

  try {
    // Delete the provisioned test user
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
    });

    if (res.ok) {
      console.log(`[teardown] Cleaned up test user: ${userId}`);
    } else {
      console.warn(`[teardown] Failed to cleanup user ${userId}: ${res.status}`);
    }
  } catch (err) {
    console.warn(`[teardown] Cleanup error:`, err);
  }
}

export default globalTeardown;
