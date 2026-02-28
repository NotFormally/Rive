import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// =============================================================================
// Cron: Monthly Learning Report — Runs on the 1st of each month
//
// For each restaurant, compiles a summary of calibration activity, accuracy
// improvements, and new learnings from the past month. Persists the report
// into the monthly_reports table.
//
// Vercel Cron config (vercel.json):
// { "crons": [{ "path": "/api/cron/monthly-report", "schedule": "0 10 1 * *" }] }
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

  // Determine the reporting month (previous month)
  const now = new Date();
  const reportMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStart = reportMonth.toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  const monthLabel = reportMonth.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

  try {
    // Get all restaurants
    const { data: restaurants, error: restError } = await admin
      .from('restaurants')
      .select('id, name') as { data: any[] | null; error: any };

    if (restError || !restaurants || restaurants.length === 0) {
      return NextResponse.json({
        message: 'No restaurants found',
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    let processed = 0;

    for (const restaurant of restaurants) {
      try {
        // 1. Count feedback submissions (items with actual_portions filled in)
        const { count: feedbackCount } = await admin
          .from('prep_list_items')
          .select('id', { count: 'exact', head: true })
          .not('actual_portions', 'is', null)
          .in(
            'prep_list_id',
            (
              await admin
                .from('prep_lists')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .gte('target_date', monthStart)
                .lte('target_date', monthEnd)
            ).data?.map((p: any) => p.id) || []
          );

        // 2. Calculate accuracy improvement (first week vs last week)
        const firstWeekEnd = new Date(reportMonth);
        firstWeekEnd.setDate(firstWeekEnd.getDate() + 6);
        const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), -6);

        const firstWeekAccuracy = await getWeekAccuracy(
          admin,
          restaurant.id,
          monthStart,
          firstWeekEnd.toISOString().split('T')[0]
        );

        const lastWeekAccuracy = await getWeekAccuracy(
          admin,
          restaurant.id,
          lastWeekStart.toISOString().split('T')[0],
          monthEnd
        );

        const accuracyImprovement =
          firstWeekAccuracy !== null && lastWeekAccuracy !== null
            ? Math.round((lastWeekAccuracy - firstWeekAccuracy) * 100) / 100
            : 0;

        // 3. Count new confidence modifiers updated this month
        const { count: modifiersUpdated } = await admin
          .from('prep_confidence_modifiers' as any)
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
          .gte('updated_at', monthStart)
          .lte('updated_at', monthEnd + 'T23:59:59');

        // 4. Generate learnings array
        const learnings: string[] = [];

        if ((feedbackCount ?? 0) > 0) {
          learnings.push(
            `${feedbackCount} calibrations enregistrées ce mois-ci, ce qui affine les prévisions.`
          );
        }

        if (accuracyImprovement > 0) {
          learnings.push(
            `La précision des prévisions a augmenté de ${accuracyImprovement} points entre la première et la dernière semaine.`
          );
        } else if (accuracyImprovement < 0) {
          learnings.push(
            `La précision a légèrement diminué ce mois-ci (${accuracyImprovement} points). Continuez les calibrations pour corriger la tendance.`
          );
        }

        if ((modifiersUpdated ?? 0) > 0) {
          learnings.push(
            `${modifiersUpdated} modificateur${(modifiersUpdated ?? 0) > 1 ? 's' : ''} de confiance mis à jour automatiquement.`
          );
        }

        if (learnings.length === 0) {
          learnings.push(
            'Aucune activité de calibration ce mois-ci. Commencez à donner du feedback pour améliorer vos prévisions.'
          );
        }

        // 5. Upsert into monthly_reports
        const { error: upsertError } = await admin
          .from('monthly_reports' as any)
          .upsert(
            {
              restaurant_id: restaurant.id,
              month: monthStart,
              month_label: monthLabel,
              feedback_count: feedbackCount ?? 0,
              accuracy_improvement: accuracyImprovement,
              modifiers_updated: modifiersUpdated ?? 0,
              learnings,
              created_at: new Date().toISOString(),
            } as any,
            { onConflict: 'restaurant_id,month' }
          );

        if (upsertError) {
          console.error(
            `[Cron/MonthlyReport] Upsert failed for ${restaurant.id}:`,
            upsertError
          );
          continue;
        }

        processed++;
      } catch (err: any) {
        console.error(`[Cron/MonthlyReport] Error for ${restaurant.id}:`, err.message);
      }
    }

    return NextResponse.json({
      message: `Monthly reports generated for ${monthLabel}`,
      processed,
      total: restaurants.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron/MonthlyReport] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    );
  }
}

// --- Helpers -----------------------------------------------------------------

async function getWeekAccuracy(
  admin: ReturnType<typeof supabaseAdmin>,
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<number | null> {
  // Get prep list items for the date range that have both predicted and actual
  const { data: prepLists } = await admin
    .from('prep_lists')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .gte('target_date', startDate)
    .lte('target_date', endDate);

  if (!prepLists || prepLists.length === 0) return null;

  const listIds = prepLists.map((p: any) => p.id);

  const { data: items } = await admin
    .from('prep_list_items')
    .select('predicted_portions, actual_portions')
    .in('prep_list_id', listIds)
    .not('actual_portions', 'is', null)
    .not('predicted_portions', 'is', null) as { data: any[] | null; error: any };

  if (!items || items.length === 0) return null;

  // Accuracy = 1 - average(|predicted - actual| / actual)
  let totalError = 0;
  let count = 0;

  for (const item of items) {
    const predicted = item.predicted_portions as number;
    const actual = item.actual_portions as number;
    if (actual === 0) continue;
    totalError += Math.abs(predicted - actual) / actual;
    count++;
  }

  if (count === 0) return null;

  return Math.round((1 - totalError / count) * 10000) / 100; // percentage with 2 decimals
}
