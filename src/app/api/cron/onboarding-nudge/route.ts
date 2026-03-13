import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';

// =============================================================================
// Cron: Onboarding Nudge — Send engagement emails at 7, 14, and 30 days
//
// For free-tier restaurants, sends timed nudge emails to encourage feature
// adoption and eventual upgrade. Only sends each nudge once per restaurant.
//
// Vercel Cron config (vercel.json):
// { "crons": [{ "path": "/api/cron/onboarding-nudge", "schedule": "0 10 * * *" }] }
// (Every day at 10:00 UTC)
// =============================================================================

const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60;

interface RestaurantRow {
  restaurant_id: string;
  subscription_tier: string;
  email_nudge_7d_sent: boolean;
  email_nudge_14d_sent: boolean;
  email_nudge_30d_sent: boolean;
}

interface ProfileRow {
  user_id: string;
  restaurant_name: string;
  created_at: string;
}

interface UsageRow {
  logbook_notes: number;
  menu_engineering: number;
  instagram_posts: number;
  receipt_scans: number;
  food_cost_reports: number;
}

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends it as Bearer token)
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = Date.now();
  let nudgesSent = 0;
  const errors: string[] = [];

  try {
    // Get all free-tier restaurants that still have unsent nudges
    const { data: settings, error: settingsError } = await admin
      .from('restaurant_settings')
      .select('restaurant_id, subscription_tier, email_nudge_7d_sent, email_nudge_14d_sent, email_nudge_30d_sent')
      .eq('subscription_tier', 'free')
      .or('email_nudge_7d_sent.eq.false,email_nudge_14d_sent.eq.false,email_nudge_30d_sent.eq.false');

    if (settingsError) {
      console.error('[Cron/OnboardingNudge] Failed to query settings:', settingsError);
      return NextResponse.json({ error: 'DB query failed', detail: settingsError.message }, { status: 500 });
    }

    if (!settings || settings.length === 0) {
      return NextResponse.json({
        message: 'No eligible restaurants for nudge emails',
        nudgesSent: 0,
        timestamp: new Date().toISOString(),
      });
    }

    for (const row of settings as RestaurantRow[]) {
      try {
        // Get profile (for created_at, user_id, name)
        const { data: profile } = await admin
          .from('restaurant_profiles')
          .select('user_id, restaurant_name, created_at')
          .eq('id', row.restaurant_id)
          .single();

        const p = profile as ProfileRow | null;
        if (!p || !p.user_id) continue; // Skip seeded/demo restaurants with no user

        const daysSinceSignup = Math.floor((now - new Date(p.created_at).getTime()) / 86400000);

        // Determine which nudge to send (only one per run, prioritize earliest unsent)
        let variant: '7d' | '14d' | '30d' | null = null;
        let flagColumn: string | null = null;

        if (!row.email_nudge_7d_sent && daysSinceSignup >= 7) {
          variant = '7d';
          flagColumn = 'email_nudge_7d_sent';
        } else if (!row.email_nudge_14d_sent && daysSinceSignup >= 14) {
          variant = '14d';
          flagColumn = 'email_nudge_14d_sent';
        } else if (!row.email_nudge_30d_sent && daysSinceSignup >= 30) {
          variant = '30d';
          flagColumn = 'email_nudge_30d_sent';
        }

        if (!variant || !flagColumn) continue;

        // Get owner email from auth
        const { data: userData } = await admin.auth.admin.getUserById(p.user_id);
        const ownerEmail = userData?.user?.email;
        if (!ownerEmail) continue;

        // For the 14-day variant, fetch usage stats
        let quotaUsage: { metric: string; used: number; limit: number }[] | undefined;

        if (variant === '14d') {
          const { data: usageData } = await admin
            .from('restaurant_settings')
            .select('usage_metrics')
            .eq('restaurant_id', row.restaurant_id)
            .single();

          // usage_metrics may not exist yet on all rows
          const usage = (usageData as { usage_metrics?: UsageRow } | null)?.usage_metrics;
          if (usage) {
            quotaUsage = [
              { metric: 'Notes du carnet', used: usage.logbook_notes || 0, limit: 50 },
              { metric: 'Analyses de menu', used: usage.menu_engineering || 0, limit: 3 },
              { metric: 'Posts Instagram', used: usage.instagram_posts || 0, limit: 10 },
              { metric: 'Scans de factures', used: usage.receipt_scans || 0, limit: 10 },
            ].filter(q => q.used > 0); // Only show metrics they've actually used
          }
        }

        // Send the nudge email
        await sendEmail({
          type: 'onboarding_nudge',
          to: ownerEmail,
          restaurantName: p.restaurant_name,
          daysSinceSignup,
          variant,
          quotaUsage,
        });

        // Mark as sent
        await admin
          .from('restaurant_settings')
          .update({ [flagColumn]: true })
          .eq('restaurant_id', row.restaurant_id);

        nudgesSent++;
        console.log(`[Cron/OnboardingNudge] Sent ${variant} nudge to ${ownerEmail} (${p.restaurant_name})`);
      } catch (err) {
        const msg = `Error processing ${row.restaurant_id}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`[Cron/OnboardingNudge] ${msg}`);
        errors.push(msg);
      }
    }

    return NextResponse.json({
      message: `Onboarding nudge emails sent`,
      nudgesSent,
      totalEligible: settings.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron/OnboardingNudge] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
