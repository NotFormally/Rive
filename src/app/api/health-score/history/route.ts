import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';

// =============================================================================
// Health Score History — Trend Data
//
// GET: Returns last 12 weeks of health score snapshots for trend charts.
// =============================================================================

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const { data, error } = await auth.supabase
      .from('health_score_history')
      .select('total_score, food_cost_score, menu_completeness_score, prep_accuracy_score, variance_score, team_engagement_score, reservation_score, visibility_score, recorded_at')
      .eq('restaurant_id', auth.restaurantId)
      .order('recorded_at', { ascending: true })
      .limit(52);

    if (error) throw error;

    // Also fetch forecast from current score
    const { data: current } = await auth.supabase
      .from('restaurant_health_scores')
      .select('trend_forecast, confidence')
      .eq('restaurant_id', auth.restaurantId)
      .maybeSingle();

    return NextResponse.json({
      history: data || [],
      forecast: current?.trend_forecast || [],
      confidence: current?.confidence || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('[HealthScoreHistory] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
