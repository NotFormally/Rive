import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date();

  // Fetch all trial restaurants with their profile info
  const { data: trialRestaurants, error } = await supabase
    .from('restaurant_settings')
    .select(`
      restaurant_id,
      trial_ends_at,
      email_trial_7_sent,
      email_trial_3_sent,
      email_trial_expired_sent,
      restaurant_profiles!inner(user_id, restaurant_name)
    `)
    .eq('subscription_tier', 'trial');

  if (error) {
    console.error('[cron/trial-check] Query failed:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!trialRestaurants || trialRestaurants.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  for (const restaurant of trialRestaurants) {
    const profile = Array.isArray(restaurant.restaurant_profiles)
      ? restaurant.restaurant_profiles[0]
      : restaurant.restaurant_profiles;

    if (!profile) continue;

    // Get user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.user_id);
    if (!user?.email) continue;

    const trialEndsAt = restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
    if (!trialEndsAt) continue;

    const msLeft = trialEndsAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    const updates: Record<string, boolean> = {};

    // 7-day warning
    if (daysLeft <= 7 && daysLeft > 3 && !restaurant.email_trial_7_sent) {
      await sendEmail({
        type: 'trial_warning',
        to: user.email,
        restaurantName: profile.restaurant_name,
        daysLeft: 7,
      }).catch((err) => console.error('[cron] 7-day warning failed:', err));
      updates.email_trial_7_sent = true;
    }

    // 3-day warning
    if (daysLeft <= 3 && daysLeft > 0 && !restaurant.email_trial_3_sent) {
      await sendEmail({
        type: 'trial_warning',
        to: user.email,
        restaurantName: profile.restaurant_name,
        daysLeft: 3,
      }).catch((err) => console.error('[cron] 3-day warning failed:', err));
      updates.email_trial_3_sent = true;
    }

    // Expired
    if (daysLeft <= 0 && !restaurant.email_trial_expired_sent) {
      await sendEmail({
        type: 'trial_expired',
        to: user.email,
        restaurantName: profile.restaurant_name,
      }).catch((err) => console.error('[cron] expired email failed:', err));
      updates.email_trial_expired_sent = true;
    }

    // Persist flags
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('restaurant_settings')
        .update(updates)
        .eq('restaurant_id', restaurant.restaurant_id);
      processed++;
    }
  }

  console.log(`[cron/trial-check] Processed ${processed}/${trialRestaurants.length} restaurants`);
  return NextResponse.json({ processed, total: trialRestaurants.length });
}
