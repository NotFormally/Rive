import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';

// =============================================================================
// Prep List History Route — Past prep lists with accuracy metrics
//
// GET /api/prep-list/history?limit=20&offset=0
//
// Returns:
//   - Past prep lists with their items and feedback data
//   - Accuracy metrics: avg delta, confidence modifier evolution
//   - Waste estimation based on surplus portions
//
// This allows the chef to see if the system is improving over time.
// =============================================================================

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const itemId = searchParams.get('item_id'); // Optional: filter by menu item

  try {
    // ---- 1. Fetch completed prep lists with items ----
    let query = auth.supabase
      .from('prep_lists')
      .select(`
        id, target_date, service_period,
        reserved_covers, estimated_covers, walk_in_ratio, safety_buffer,
        estimated_food_cost, generation_level, status,
        created_at, completed_at,
        prep_list_items (
          menu_item_id, menu_item_name,
          predicted_portions, actual_portions, feedback_delta,
          confidence_score, confidence_modifier,
          priority, priority_score, bcg_category,
          estimated_cost
        )
      `)
      .eq('restaurant_id', auth.restaurantId)
      .eq('status', 'completed')
      .order('target_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: prepLists, error, count } = await query;

    if (error) {
      console.error('[PrepList/History] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    if (!prepLists || prepLists.length === 0) {
      return NextResponse.json({
        prepLists: [],
        metrics: null,
        message: 'Aucun historique de prep list complété trouvé.',
      });
    }

    // ---- 2. Compute accuracy metrics across all completed lists ----
    let totalPredicted = 0;
    let totalActual = 0;
    let totalAbsDelta = 0;
    let totalSurplus = 0;
    let totalShortage = 0;
    let itemCount = 0;

    // Per-item tracking for trend analysis
    const itemAccuracy: Record<string, {
      name: string;
      totalPredicted: number;
      totalActual: number;
      totalAbsDelta: number;
      dataPoints: number;
    }> = {};

    for (const pl of prepLists) {
      const items = (pl as any).prep_list_items || [];
      for (const item of items) {
        if (item.actual_portions == null) continue; // Skip items without feedback

        // Optionally filter by item_id
        if (itemId && item.menu_item_id !== itemId) continue;

        const predicted = item.predicted_portions || 0;
        const actual = item.actual_portions || 0;
        const delta = item.feedback_delta || (actual - predicted);
        const absDelta = Math.abs(delta);

        totalPredicted += predicted;
        totalActual += actual;
        totalAbsDelta += absDelta;
        if (delta < 0) totalShortage += Math.abs(delta);
        if (delta > 0) totalSurplus += delta;
        itemCount++;

        // Track per-item accuracy
        if (!itemAccuracy[item.menu_item_id]) {
          itemAccuracy[item.menu_item_id] = {
            name: item.menu_item_name,
            totalPredicted: 0,
            totalActual: 0,
            totalAbsDelta: 0,
            dataPoints: 0,
          };
        }
        const ia = itemAccuracy[item.menu_item_id];
        ia.totalPredicted += predicted;
        ia.totalActual += actual;
        ia.totalAbsDelta += absDelta;
        ia.dataPoints++;
      }
    }

    // Overall accuracy: 1 - (total absolute error / total predicted)
    const overallAccuracy = totalPredicted > 0
      ? Math.round((1 - totalAbsDelta / totalPredicted) * 1000) / 10
      : 0;

    // Waste rate: surplus / total predicted
    const wasteRate = totalPredicted > 0
      ? Math.round((totalSurplus / totalPredicted) * 1000) / 10
      : 0;

    // Shortage rate: shortage / total predicted
    const shortageRate = totalPredicted > 0
      ? Math.round((totalShortage / totalPredicted) * 1000) / 10
      : 0;

    // Per-item accuracy ranking (best → worst)
    const itemRankings = Object.entries(itemAccuracy)
      .map(([id, data]) => ({
        menuItemId: id,
        menuItemName: data.name,
        accuracy: data.totalPredicted > 0
          ? Math.round((1 - data.totalAbsDelta / data.totalPredicted) * 1000) / 10
          : 0,
        avgDelta: data.dataPoints > 0
          ? Math.round(((data.totalActual - data.totalPredicted) / data.dataPoints) * 10) / 10
          : 0,
        dataPoints: data.dataPoints,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    // ---- 3. Accuracy trend (last N prep lists, chronological) ----
    const accuracyTrend = prepLists
      .slice()
      .reverse() // oldest first for the chart
      .map(pl => {
        const items = (pl as any).prep_list_items || [];
        let plPredicted = 0;
        let plAbsDelta = 0;
        let plItems = 0;

        for (const item of items) {
          if (item.actual_portions == null) continue;
          plPredicted += item.predicted_portions || 0;
          plAbsDelta += Math.abs(item.feedback_delta || (item.actual_portions - item.predicted_portions));
          plItems++;
        }

        return {
          date: pl.target_date,
          service: pl.service_period,
          covers: pl.estimated_covers,
          level: pl.generation_level,
          itemsTracked: plItems,
          accuracy: plPredicted > 0
            ? Math.round((1 - plAbsDelta / plPredicted) * 1000) / 10
            : null,
        };
      });

    // ---- 4. Fetch current confidence modifiers ----
    const { data: modifiers } = await auth.supabase
      .from('prep_confidence_modifiers')
      .select('menu_item_id, modifier, feedback_count, last_feedback_at')
      .eq('restaurant_id', auth.restaurantId)
      .order('feedback_count', { ascending: false });

    return NextResponse.json({
      prepLists: prepLists.map(pl => ({
        ...pl,
        items: (pl as any).prep_list_items || [],
      })),
      metrics: {
        overallAccuracy,
        wasteRate,
        shortageRate,
        totalPrepLists: prepLists.length,
        totalItemsTracked: itemCount,
        totalPortionsPredicted: totalPredicted,
        totalPortionsActual: totalActual,
      },
      itemRankings,
      accuracyTrend,
      confidenceModifiers: modifiers || [],
      pagination: {
        limit,
        offset,
        returned: prepLists.length,
      },
    });

  } catch (error: any) {
    console.error('[PrepList/History] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
