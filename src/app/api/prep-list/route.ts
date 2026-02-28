import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { generatePrepList, PrepListConfig } from '@/lib/prep-engine';

// =============================================================================
// Smart Prep List API Route
//
// GET  /api/prep-list?date=2026-02-27&service=dinner
//   → Returns existing prep list for that date/service, or generates a new one
//
// POST /api/prep-list
//   → Force-regenerates a prep list with custom parameters
//   Body: { date, service_period, safety_buffer?, lookback_weeks? }
// =============================================================================

export const maxDuration = 30;

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const service = (searchParams.get('service') || 'all_day') as 'lunch' | 'dinner' | 'all_day';

  try {
    // Check if a prep list already exists for this date/service
    const { data: existing } = await auth.supabase
      .from('prep_lists')
      .select(`*, prep_list_items (*), prep_list_ingredients (*)`)
      .eq('restaurant_id', auth.restaurantId)
      .eq('target_date', date)
      .eq('service_period', service)
      .single();

    if (existing) {
      return NextResponse.json({
        prepList: existing,
        items: existing.prep_list_items || [],
        ingredients: existing.prep_list_ingredients || [],
        source: 'cached',
      });
    }

    // No existing list — generate a new one
    const config: PrepListConfig = {
      targetDate: date,
      servicePeriod: service,
      safetyBuffer: 0.10,
      lookbackWeeks: 8,
    };

    const result = await generatePrepList(auth.supabase, auth.restaurantId, config);

    // Persist the generated prep list
    const { data: prepList, error: insertError } = await auth.supabase
      .from('prep_lists')
      .insert({
        restaurant_id: auth.restaurantId,
        target_date: date,
        service_period: service,
        reserved_covers: result.coverEstimation.reservedCovers,
        estimated_covers: result.coverEstimation.estimatedTotal,
        walk_in_ratio: result.coverEstimation.walkInRatio,
        safety_buffer: config.safetyBuffer,
        estimated_food_cost: result.estimatedFoodCost,
        alerts: result.alerts,
        generation_level: result.generationLevel,
        status: 'draft',
      } as any)
      .select()
      .single();

    if (insertError || !prepList) {
      console.error('[PrepList] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save prep list' }, { status: 500 });
    }

    // Persist items
    if (result.items.length > 0) {
      await auth.supabase.from('prep_list_items').insert(
        result.items.map(item => ({
          prep_list_id: (prepList as any).id,
          menu_item_id: item.menuItemId,
          menu_item_name: item.menuItemName,
          predicted_portions: item.predictedPortions,
          item_share: item.itemShare,
          confidence_score: item.confidenceScore,
          confidence_modifier: item.confidenceModifier,
          priority: item.priority,
          priority_score: item.priorityScore,
          bcg_category: item.bcgCategory,
          margin_percent: item.marginPercent,
          estimated_cost: item.estimatedCost,
        })) as any
      );
    }

    // Persist ingredients (Level 3)
    if (result.ingredients.length > 0) {
      await auth.supabase.from('prep_list_ingredients').insert(
        result.ingredients.map(ing => ({
          prep_list_id: (prepList as any).id,
          ingredient_id: ing.ingredientId,
          ingredient_name: ing.ingredientName,
          total_quantity: ing.totalQuantity,
          unit: ing.unit,
          estimated_cost: ing.estimatedCost,
          used_by_items: ing.usedByItems,
        })) as any
      );
    }

    return NextResponse.json({
      prepList,
      items: result.items,
      ingredients: result.ingredients,
      alerts: result.alerts,
      coverEstimation: result.coverEstimation,
      generationLevel: result.generationLevel,
      estimatedFoodCost: result.estimatedFoodCost,
      source: 'generated',
    }, { status: 201 });

  } catch (error: any) {
    console.error('[PrepList] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const body = await req.json();
    const {
      date = new Date(Date.now() + 86400000).toISOString().split('T')[0],
      service_period = 'all_day',
      safety_buffer = 0.10,
      lookback_weeks = 8,
    } = body;

    // Delete existing prep list for this date/service (force regeneration)
    await auth.supabase
      .from('prep_lists')
      .delete()
      .eq('restaurant_id', auth.restaurantId)
      .eq('target_date', date)
      .eq('service_period', service_period);

    // Generate fresh
    const config: PrepListConfig = {
      targetDate: date,
      servicePeriod: service_period,
      safetyBuffer: safety_buffer,
      lookbackWeeks: lookback_weeks,
    };

    const result = await generatePrepList(auth.supabase, auth.restaurantId, config);

    // Persist
    const { data: prepList, error: insertError } = await auth.supabase
      .from('prep_lists')
      .insert({
        restaurant_id: auth.restaurantId,
        target_date: date,
        service_period: service_period,
        reserved_covers: result.coverEstimation.reservedCovers,
        estimated_covers: result.coverEstimation.estimatedTotal,
        walk_in_ratio: result.coverEstimation.walkInRatio,
        safety_buffer: config.safetyBuffer,
        estimated_food_cost: result.estimatedFoodCost,
        alerts: result.alerts,
        generation_level: result.generationLevel,
        status: 'draft',
      } as any)
      .select()
      .single();

    if (insertError || !prepList) {
      return NextResponse.json({ error: 'Failed to save prep list' }, { status: 500 });
    }

    if (result.items.length > 0) {
      await auth.supabase.from('prep_list_items').insert(
        result.items.map(item => ({
          prep_list_id: (prepList as any).id, menu_item_id: item.menuItemId,
          menu_item_name: item.menuItemName, predicted_portions: item.predictedPortions,
          item_share: item.itemShare, confidence_score: item.confidenceScore,
          confidence_modifier: item.confidenceModifier, priority: item.priority,
          priority_score: item.priorityScore, bcg_category: item.bcgCategory,
          margin_percent: item.marginPercent, estimated_cost: item.estimatedCost,
        }))
      );
    }

    if (result.ingredients.length > 0) {
      await auth.supabase.from('prep_list_ingredients').insert(
        result.ingredients.map(ing => ({
          prep_list_id: (prepList as any).id, ingredient_id: ing.ingredientId,
          ingredient_name: ing.ingredientName, total_quantity: ing.totalQuantity,
          unit: ing.unit, estimated_cost: ing.estimatedCost, used_by_items: ing.usedByItems,
        }))
      );
    }

    return NextResponse.json({
      prepList, items: result.items, ingredients: result.ingredients,
      alerts: result.alerts, coverEstimation: result.coverEstimation,
      generationLevel: result.generationLevel, estimatedFoodCost: result.estimatedFoodCost,
      source: 'regenerated',
    }, { status: 201 });

  } catch (error: any) {
    console.error('[PrepList] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
