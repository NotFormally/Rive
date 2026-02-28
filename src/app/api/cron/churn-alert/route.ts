import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';

// =============================================================================
// Cron: Churn Alert — Detect inactive restaurants and send alerts
//
// Identifies restaurants where the last feedback was more than 14 days ago,
// then sends a re-engagement email to the owner.
//
// Vercel Cron config (vercel.json):
// { "crons": [{ "path": "/api/cron/churn-alert", "schedule": "0 14 * * 1" }] }
// (Every Monday at 14:00 UTC)
// =============================================================================

const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60;

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends it as Bearer token)
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];

  try {
    // Find restaurants with stale feedback (last_feedback_date older than 14 days)
    const { data: staleStreaks, error: streakError } = await admin
      .from('chef_streaks')
      .select('restaurant_id, last_feedback_date, current_streak, feedback_days')
      .lt('last_feedback_date', fourteenDaysAgo) as { data: any[] | null; error: any };

    if (streakError) {
      console.error('[Cron/ChurnAlert] Failed to query chef_streaks:', streakError);
      return NextResponse.json(
        { error: 'Failed to query streaks', detail: streakError.message },
        { status: 500 }
      );
    }

    if (!staleStreaks || staleStreaks.length === 0) {
      return NextResponse.json({
        message: 'No inactive restaurants detected',
        alertsSent: 0,
        timestamp: new Date().toISOString(),
      });
    }

    let alertsSent = 0;

    for (const streak of staleStreaks) {
      try {
        // Count total calibrations for this restaurant
        const { count: calibrationCount } = await admin
          .from('prep_confidence_modifiers' as any)
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', streak.restaurant_id);

        // Get restaurant name and owner email
        const { data: restaurant } = await admin
          .from('restaurants')
          .select('name')
          .eq('id', streak.restaurant_id)
          .single() as { data: any; error: any };

        const { data: owner } = await admin
          .from('restaurant_members')
          .select('user_id')
          .eq('restaurant_id', streak.restaurant_id)
          .eq('role', 'owner')
          .limit(1)
          .single() as { data: any; error: any };

        if (!owner || !restaurant) continue;

        // Get owner's email from auth
        const { data: userData } = await admin.auth.admin.getUserById(owner.user_id);
        const ownerEmail = userData?.user?.email;

        if (!ownerEmail) continue;

        // Calculate days since last feedback
        const daysSinceLastFeedback = Math.floor(
          (Date.now() - new Date(streak.last_feedback_date).getTime()) / 86400000
        );

        // Send churn alert email
        await sendEmail({
          type: 'churn_alert',
          to: ownerEmail,
          restaurantName: restaurant.name,
          daysSinceLastFeedback,
          calibrationCount: calibrationCount ?? 0,
          feedbackDays: streak.feedback_days ?? 0,
        });

        alertsSent++;
      } catch (err: any) {
        console.error(
          `[Cron/ChurnAlert] Error processing ${streak.restaurant_id}:`,
          err.message
        );
      }
    }

    return NextResponse.json({
      message: `Churn alerts sent`,
      alertsSent,
      totalInactive: staleStreaks.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron/ChurnAlert] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    );
  }
}
