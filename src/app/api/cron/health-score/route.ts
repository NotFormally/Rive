import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calculateHealthScore, persistHealthScore } from '@/lib/health-score';

// =============================================================================
// Cron: Health Score — Weekly Recalculation
//
// Iterates all restaurants with module_health_score enabled,
// recalculates their health score, and appends history snapshots.
//
// Vercel Cron config (vercel.json):
// { "crons": [{ "path": "/api/cron/health-score", "schedule": "0 6 * * 1" }] }
// (Every Monday at 06:00 UTC)
// =============================================================================

const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();

  try {
    // Get all restaurants with health score module enabled
    const { data: restaurants, error } = await admin
      .from('restaurant_settings')
      .select('restaurant_id')
      .eq('module_health_score', true);

    if (error) throw error;
    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No restaurants with health score enabled' });
    }

    let processed = 0;
    let failed = 0;
    const errors: Array<{ restaurantId: string; error: string }> = [];

    // Process in batches of 5 to avoid overwhelming APIs
    const batchSize = 5;
    for (let i = 0; i < restaurants.length; i += batchSize) {
      const batch = restaurants.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (r: { restaurant_id: string }) => {
          const result = await calculateHealthScore(r.restaurant_id);
          await persistHealthScore(r.restaurant_id, result);
          return r.restaurant_id;
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          processed++;
        } else {
          failed++;
          errors.push({
            restaurantId: 'unknown',
            error: result.reason?.message || 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      processed,
      failed,
      total: restaurants.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('[Cron:HealthScore] Error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
