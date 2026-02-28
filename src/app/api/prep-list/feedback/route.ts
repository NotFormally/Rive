import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { processChefFeedback } from '@/lib/prep-engine';
import { calculateIntelligenceScore } from '@/lib/intelligence-score';

// =============================================================================
// Prep List Feedback Route — Chef submits actual portions after service
//
// PATCH /api/prep-list/feedback
// Body: {
//   prep_list_id: string,
//   items: [{ menu_item_id: string, actual_portions: number }]
// }
//
// Updates confidence modifiers for continuous learning.
// =============================================================================

export async function PATCH(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const body = await req.json();
    const { prep_list_id, items } = body;

    if (!prep_list_id || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing prep_list_id or items array' },
        { status: 400 }
      );
    }

    // Verify the prep list belongs to this restaurant
    const { data: prepList } = await auth.supabase
      .from('prep_lists')
      .select('id, status')
      .eq('id', prep_list_id)
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (!prepList) {
      return NextResponse.json({ error: 'Prep list not found' }, { status: 404 });
    }

    if (prepList.status === 'completed') {
      return NextResponse.json(
        { error: 'Feedback already submitted for this prep list' },
        { status: 409 }
      );
    }

    // Process the feedback: update items + adjust confidence modifiers
    const feedback = items.map((item: any) => ({
      menuItemId: item.menu_item_id,
      actualPortions: item.actual_portions,
    }));

    const result = await processChefFeedback(
      auth.supabase,
      auth.restaurantId,
      prep_list_id,
      feedback,
    );

    // Update chef streak
    const today = new Date().toISOString().split('T')[0];
    const { data: streak } = await auth.supabase
      .from('chef_streaks' as any)
      .select('*')
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (streak) {
      const lastDate = streak.last_feedback_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isConsecutive = lastDate === yesterday || lastDate === today;
      const newStreak = isConsecutive ? streak.current_streak + 1 : 1;
      const newLongest = Math.max(streak.longest_streak, newStreak);

      await auth.supabase
        .from('chef_streaks' as any)
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_feedback_date: today,
          total_feedback_days: streak.total_feedback_days + (lastDate === today ? 0 : 1),
        })
        .eq('restaurant_id', auth.restaurantId);
    } else {
      await auth.supabase
        .from('chef_streaks' as any)
        .insert({
          restaurant_id: auth.restaurantId,
          current_streak: 1,
          longest_streak: 1,
          last_feedback_date: today,
          total_feedback_days: 1,
        });
    }

    // Recalculate intelligence score
    const { data: scoreData } = await auth.supabase
      .from('restaurant_intelligence_score' as any)
      .select('*')
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (scoreData) {
      const updatedStreak = streak
        ? (streak.last_feedback_date === new Date(Date.now() - 86400000).toISOString().split('T')[0] || streak.last_feedback_date === today
          ? streak.current_streak + 1 : 1)
        : 1;
      const updatedFeedbackDays = scoreData.feedback_days + (streak?.last_feedback_date === today ? 0 : 1);

      const scoreResult = calculateIntelligenceScore({
        libroConnected: scoreData.libro_connected,
        posConnected: scoreData.pos_connected,
        recipesEntered: scoreData.recipes_entered,
        feedbackDays: updatedFeedbackDays,
        feedbackStreak: updatedStreak,
      });

      await auth.supabase
        .from('restaurant_intelligence_score' as any)
        .update({
          score: scoreResult.score,
          level: scoreResult.level,
          feedback_days: updatedFeedbackDays,
          feedback_streak: updatedStreak,
          longest_streak: Math.max(scoreData.longest_streak, updatedStreak),
          last_feedback_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('restaurant_id', auth.restaurantId);
    }

    return NextResponse.json({
      success: true,
      updatedItems: result.updatedItems,
      avgAccuracy: result.avgAccuracy,
      message: `Feedback enregistré pour ${result.updatedItems} items. Précision moyenne: ${result.avgAccuracy}%`,
    });

  } catch (error: any) {
    console.error('[PrepList/Feedback] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
