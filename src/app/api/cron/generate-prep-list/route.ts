import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generatePrepList, PrepListConfig } from '@/lib/prep-engine';

// =============================================================================
// Cron: Generate Prep Lists — Runs nightly at 4:00 AM
//
// For each restaurant with module_smart_prep enabled, generates tomorrow's
// prep list automatically so the chef finds it ready in the morning.
//
// Vercel Cron config (vercel.json):
// { "crons": [{ "path": "/api/cron/generate-prep-list", "schedule": "0 4 * * *" }] }
// =============================================================================

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const results: Array<{ restaurant_id: string; status: string; detail: string }> = [];

  try {
    // Fetch all restaurants with smart prep enabled
    const { data, error } = await admin
      .from('restaurant_settings')
      .select('restaurant_id')
      .eq('module_smart_prep', true);

    const restaurants = data as { restaurant_id: string }[] | null;

    if (error || !restaurants || restaurants.length === 0) {
      return NextResponse.json({
        message: 'No restaurants with Smart Prep enabled',
        results: [],
      });
    }

    // Tomorrow's date
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    for (const restaurant of restaurants) {
      try {
        // Check if a prep list already exists for tomorrow
        const { data: existing } = await (admin as any)
          .from('prep_lists')
          .select('id')
          .eq('restaurant_id', restaurant.restaurant_id)
          .eq('target_date', tomorrow)
          .eq('service_period', 'all_day')
          .single();

        if (existing) {
          results.push({
            restaurant_id: restaurant.restaurant_id,
            status: 'skipped',
            detail: 'Prep list already exists for tomorrow',
          });
          continue;
        }

        // Generate the prep list
        const config: PrepListConfig = {
          targetDate: tomorrow,
          servicePeriod: 'all_day',
          safetyBuffer: 0.10,
          lookbackWeeks: 8,
        };

        const result = await generatePrepList(admin, restaurant.restaurant_id, config);

        // Persist
        const { data: prepList } = await (admin as any)
          .from('prep_lists')
          .insert({
            restaurant_id: restaurant.restaurant_id,
            target_date: tomorrow,
            service_period: 'all_day',
            reserved_covers: result.coverEstimation.reservedCovers,
            estimated_covers: result.coverEstimation.estimatedTotal,
            walk_in_ratio: result.coverEstimation.walkInRatio,
            safety_buffer: config.safetyBuffer,
            estimated_food_cost: result.estimatedFoodCost,
            alerts: result.alerts,
            generation_level: result.generationLevel,
            status: 'draft',
          })
          .select()
          .single();

        if (prepList && result.items.length > 0) {
          await (admin as any).from('prep_list_items').insert(
            result.items.map(item => ({
              prep_list_id: prepList.id, menu_item_id: item.menuItemId,
              menu_item_name: item.menuItemName, predicted_portions: item.predictedPortions,
              item_share: item.itemShare, confidence_score: item.confidenceScore,
              confidence_modifier: item.confidenceModifier, priority: item.priority,
              priority_score: item.priorityScore, bcg_category: item.bcgCategory,
              margin_percent: item.marginPercent, estimated_cost: item.estimatedCost,
            }))
          );
        }

        if (prepList && result.ingredients.length > 0) {
          await (admin as any).from('prep_list_ingredients').insert(
            result.ingredients.map(ing => ({
              prep_list_id: prepList.id, ingredient_id: ing.ingredientId,
              ingredient_name: ing.ingredientName, total_quantity: ing.totalQuantity,
              unit: ing.unit, estimated_cost: ing.estimatedCost, used_by_items: ing.usedByItems,
            }))
          );
        }

        results.push({
          restaurant_id: restaurant.restaurant_id,
          status: 'success',
          detail: `Generated: ${result.items.length} items, ${result.coverEstimation.estimatedTotal} covers, Level ${result.generationLevel}`,
        });

      } catch (err: any) {
        results.push({
          restaurant_id: restaurant.restaurant_id,
          status: 'error',
          detail: err.message,
        });
      }
    }

    return NextResponse.json({
      message: `Prep list generation complete. ${results.length} restaurants processed.`,
      target_date: tomorrow,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cron/PrepList] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
