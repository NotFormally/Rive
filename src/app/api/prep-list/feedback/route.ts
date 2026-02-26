import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { processChefFeedback } from '@/lib/prep-engine';

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
