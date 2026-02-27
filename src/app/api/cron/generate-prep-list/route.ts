import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generatePrepList, PrepListConfig } from '@/lib/prep-engine';

// =============================================================================
// Cron: Generate Prep Lists — Runs nightly (UTC 09:00 = ~4-5 AM Eastern)
//
// For each restaurant with module_smart_prep enabled, generates tomorrow's
// prep list using their individual prep_settings (service periods, safety
// buffer, walk-in ratio, etc.).
//
// Vercel Cron config (vercel.json):
// { "crons": [{ "path": "/api/cron/generate-prep-list", "schedule": "0 9 * * *" }] }
//
// Note: Vercel Cron uses UTC. 09:00 UTC = 04:00 EST / 05:00 EDT
// =============================================================================

const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60; // Allow up to 60s for multiple restaurants

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends it as Bearer token)
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const results: Array<{ restaurant_id: string; restaurant_name?: string; status: string; detail: string }> = [];

  try {
    // Fetch all restaurants with smart prep enabled + their settings
    const { data: restaurants, error } = await admin
      .from('prep_settings')
      .select(`
        restaurant_id,
        enabled,
        service_periods,
        default_safety_buffer,
        default_lookback_weeks,
        restaurants!inner ( name )
      `)
      .eq('enabled', true);

    if (error || !restaurants || restaurants.length === 0) {
      // Fallback: check restaurant_settings for legacy flag
      const { data: legacy } = await admin
        .from('restaurant_settings')
        .select('restaurant_id')
        .eq('module_smart_prep', true);

      if (!legacy || legacy.length === 0) {
        return NextResponse.json({
          message: 'No restaurants with Smart Prep enabled',
          results: [],
          timestamp: new Date().toISOString(),
        });
      }

      // Use legacy restaurants with defaults
      for (const r of legacy) {
        await processRestaurant(admin, r.restaurant_id, undefined, undefined, results);
      }
    } else {
      // Use prep_settings for each restaurant
      for (const r of restaurants as any[]) {
        const restaurantName = r.restaurants?.name;
        const servicePeriods = r.service_periods || ['all_day'];
        const safetyBuffer = r.default_safety_buffer || 0.10;
        const lookbackWeeks = r.default_lookback_weeks || 8;

        for (const service of servicePeriods) {
          await processRestaurant(
            admin,
            r.restaurant_id,
            restaurantName,
            { servicePeriod: service, safetyBuffer, lookbackWeeks },
            results
          );
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      message: `Prep list generation complete. ${successCount} generated, ${results.length - successCount - errorCount} skipped, ${errorCount} errors.`,
      target_date: getTomorrow(),
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cron/PrepList] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 });
  }
}

// --- Helpers -----------------------------------------------------------------

function getTomorrow(): string {
  return new Date(Date.now() + 86400000).toISOString().split('T')[0];
}

async function processRestaurant(
  admin: ReturnType<typeof supabaseAdmin>,
  restaurantId: string,
  restaurantName: string | undefined,
  settings: { servicePeriod: string; safetyBuffer: number; lookbackWeeks: number } | undefined,
  results: Array<{ restaurant_id: string; restaurant_name?: string; status: string; detail: string }>
) {
  const tomorrow = getTomorrow();
  const servicePeriod = (settings?.servicePeriod || 'all_day') as 'lunch' | 'dinner' | 'all_day';

  try {
    // Check if a prep list already exists for tomorrow + this service
    const { data: existing } = await admin
      .from('prep_lists')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('target_date', tomorrow)
      .eq('service_period', servicePeriod)
      .maybeSingle();

    if (existing) {
      results.push({
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        status: 'skipped',
        detail: `Prep list already exists for ${tomorrow} (${servicePeriod})`,
      });
      return;
    }

    // Generate the prep list
    const config: PrepListConfig = {
      targetDate: tomorrow,
      servicePeriod,
      safetyBuffer: settings?.safetyBuffer ?? 0.10,
      lookbackWeeks: settings?.lookbackWeeks ?? 8,
    };

    const result = await generatePrepList(admin, restaurantId, config);

    // Persist the prep list
    const { data: prepList, error: insertError } = await admin
      .from('prep_lists')
      .insert({
        restaurant_id: restaurantId,
        target_date: tomorrow,
        service_period: servicePeriod,
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

    if (insertError || !prepList) {
      throw new Error(`Insert failed: ${insertError?.message || 'unknown'}`);
    }

    // Persist items
    if (result.items.length > 0) {
      await admin.from('prep_list_items').insert(
        result.items.map(item => ({
          prep_list_id: prepList.id,
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
        }))
      );
    }

    // Persist ingredients (Level 3)
    if (result.ingredients.length > 0) {
      await admin.from('prep_list_ingredients').insert(
        result.ingredients.map(ing => ({
          prep_list_id: prepList.id,
          ingredient_id: ing.ingredientId,
          ingredient_name: ing.ingredientName,
          total_quantity: ing.totalQuantity,
          unit: ing.unit,
          estimated_cost: ing.estimatedCost,
          used_by_items: ing.usedByItems,
        }))
      );
    }

    results.push({
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      status: 'success',
      detail: `Generated: ${result.items.length} items, ${result.coverEstimation.estimatedTotal} covers, Level ${result.generationLevel} (${servicePeriod})`,
    });

  } catch (err: any) {
    console.error(`[Cron/PrepList] Error for ${restaurantId}:`, err);
    results.push({
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      status: 'error',
      detail: err.message,
    });
  }
}
