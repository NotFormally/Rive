import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calculateIntelligenceScore, IntelligenceScoreData } from '@/lib/intelligence-score';

// =============================================================================
// API: Intelligence Score — Recalculate & Persist
//
// PATCH /api/intelligence-score
// Recalculates the intelligence score for the authenticated restaurant based on
// connected integrations, recipes entered, and chef feedback activity.
// =============================================================================

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  const { restaurantId } = auth;
  const admin = supabaseAdmin();

  try {
    // 1. Check integration connections (Libro / POS)
    const { data: integrations } = await admin
      .from('integration_configs' as any)
      .select('provider, status')
      .eq('restaurant_id', restaurantId) as { data: any[] | null; error: any };

    const libroConnected = integrations?.some(
      (i: any) => i.provider === 'libro' && i.status === 'connected'
    ) ?? false;

    const posConnected = integrations?.some(
      (i: any) => i.provider === 'pos' && i.status === 'connected'
    ) ?? false;

    // 2. Count recipes
    const { count: recipesEntered } = await admin
      .from('recipes')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    // 3. Get chef streaks for feedback activity
    const { data: streakData } = await admin
      .from('chef_streaks')
      .select('feedback_days, current_streak')
      .eq('restaurant_id', restaurantId)
      .maybeSingle() as { data: any; error: any };

    const feedbackDays = streakData?.feedback_days ?? 0;
    const feedbackStreak = streakData?.current_streak ?? 0;

    // 4. Calculate score
    const scoreData: IntelligenceScoreData = {
      libroConnected,
      posConnected,
      recipesEntered: recipesEntered ?? 0,
      feedbackDays,
      feedbackStreak,
    };

    const result = calculateIntelligenceScore(scoreData);

    // 5. Upsert into restaurant_intelligence_score
    const { error: upsertError } = await admin
      .from('restaurant_intelligence_score' as any)
      .upsert(
        {
          restaurant_id: restaurantId,
          score: result.score,
          level: result.level,
          next_milestone: result.nextMilestone,
          next_milestone_score: result.nextMilestoneScore,
          libro_connected: libroConnected,
          pos_connected: posConnected,
          recipes_entered: recipesEntered ?? 0,
          feedback_days: feedbackDays,
          feedback_streak: feedbackStreak,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'restaurant_id' }
      );

    if (upsertError) {
      console.error('[IntelligenceScore] Upsert failed:', upsertError);
      return NextResponse.json(
        { error: 'Failed to persist score', detail: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      score: result.score,
      level: result.level,
      nextMilestone: result.nextMilestone,
      nextMilestoneScore: result.nextMilestoneScore,
    });
  } catch (error: any) {
    console.error('[IntelligenceScore] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    );
  }
}
