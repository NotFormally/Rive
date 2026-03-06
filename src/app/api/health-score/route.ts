import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { calculateHealthScore, persistHealthScore } from '@/lib/health-score';

// =============================================================================
// Health Score — Recalculate
//
// PATCH: Authenticated. Recalculates full health score for the user's restaurant.
// GET: Authenticated. Returns the current stored health score.
// =============================================================================

export const maxDuration = 30;

export async function PATCH(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const result = await calculateHealthScore(auth.restaurantId);
    await persistHealthScore(auth.restaurantId, result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[HealthScore] Calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate health score' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const { data, error } = await auth.supabase
      .from('restaurant_health_scores')
      .select('*')
      .eq('restaurant_id', auth.restaurantId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ score: null, message: 'No health score calculated yet' }, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[HealthScore] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch health score' }, { status: 500 });
  }
}
