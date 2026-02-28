import { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Insight Generator — Data-driven daily insights (no LLM calls)
//
// Mines existing restaurant data to surface interesting patterns, records,
// and trends. Returns a single insight as a French template string, or null
// if nothing noteworthy is found.
// =============================================================================

type Insight = {
  text: string;
  type: string;
  data: Record<string, any>;
};

type InsightGenerator = (
  supabase: SupabaseClient,
  restaurantId: string
) => Promise<Insight | null>;

// --- Insight generators ------------------------------------------------------

const detectRecord: InsightGenerator = async (supabase, restaurantId) => {
  const today = new Date().toISOString().split('T')[0];

  // Get today's prep list items with actual feedback
  const { data: todayItems } = await supabase
    .from('prep_list_items')
    .select('menu_item_name, actual_portions, prep_list_id')
    .not('actual_portions', 'is', null)
    .order('actual_portions', { ascending: false })
    .limit(10);

  if (!todayItems || todayItems.length === 0) return null;

  // Filter to items from today's prep lists
  const { data: todayLists } = await supabase
    .from('prep_lists')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('target_date', today);

  if (!todayLists || todayLists.length === 0) return null;

  const todayListIds = new Set(todayLists.map((l: any) => l.id));
  const todayFiltered = todayItems.filter((i: any) => todayListIds.has(i.prep_list_id));

  if (todayFiltered.length === 0) return null;

  // Check if any item hit a new all-time high
  for (const item of todayFiltered) {
    const { data: historicalMax } = await supabase
      .from('prep_list_items')
      .select('actual_portions')
      .eq('menu_item_name', item.menu_item_name)
      .not('actual_portions', 'is', null)
      .order('actual_portions', { ascending: false })
      .limit(1)
      .single();

    if (historicalMax && item.actual_portions >= historicalMax.actual_portions) {
      return {
        text: `Nouveau record pour "${item.menu_item_name}" : ${item.actual_portions} portions servies aujourd'hui, un sommet historique.`,
        type: 'record',
        data: {
          itemName: item.menu_item_name,
          portions: item.actual_portions,
        },
      };
    }
  }

  return null;
};

const detectStreak: InsightGenerator = async (supabase, restaurantId) => {
  const { data: streak } = await supabase
    .from('chef_streaks')
    .select('current_streak, feedback_days')
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (!streak || streak.current_streak <= 7) return null;

  const weeks = Math.floor(streak.current_streak / 7);

  return {
    text: `L'équipe est sur une lancée : ${streak.current_streak} jours consécutifs de calibration (${weeks} semaine${weeks > 1 ? 's' : ''}). La précision de Rive s'améliore chaque jour.`,
    type: 'streak',
    data: {
      currentStreak: streak.current_streak,
      totalFeedbackDays: streak.feedback_days,
    },
  };
};

const detectOccasions: InsightGenerator = async (supabase, restaurantId) => {
  const today = new Date().toISOString().split('T')[0];

  const { data: reservations } = await supabase
    .from('reservations')
    .select('occasion')
    .eq('restaurant_id', restaurantId)
    .eq('date', today)
    .not('occasion', 'is', null);

  if (!reservations || reservations.length === 0) return null;

  // Count by occasion type
  const counts: Record<string, number> = {};
  for (const r of reservations) {
    const occ = r.occasion as string;
    counts[occ] = (counts[occ] || 0) + 1;
  }

  const birthdays = counts['anniversaire'] || counts['birthday'] || 0;
  if (birthdays > 0) {
    return {
      text: `${birthdays} anniversaire${birthdays > 1 ? 's' : ''} ce soir parmi les réservations. Pensez aux attentions spéciales.`,
      type: 'occasion',
      data: { occasions: counts, birthdays },
    };
  }

  // Fallback: mention total occasions
  const totalOccasions = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalOccasions >= 3) {
    const topOccasion = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      text: `${totalOccasions} occasions spéciales ce soir, dont ${topOccasion[1]} "${topOccasion[0]}".`,
      type: 'occasion',
      data: { occasions: counts, total: totalOccasions },
    };
  }

  return null;
};

const detectWalkInTrend: InsightGenerator = async (supabase, restaurantId) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const { data: prepLists } = await supabase
    .from('prep_lists')
    .select('target_date, walk_in_ratio')
    .eq('restaurant_id', restaurantId)
    .gte('target_date', thirtyDaysAgo)
    .not('walk_in_ratio', 'is', null)
    .order('target_date', { ascending: true });

  if (!prepLists || prepLists.length < 7) return null;

  // Split into first half / second half to detect trend
  const mid = Math.floor(prepLists.length / 2);
  const firstHalf = prepLists.slice(0, mid);
  const secondHalf = prepLists.slice(mid);

  const avgFirst =
    firstHalf.reduce((sum: number, p: any) => sum + (p.walk_in_ratio || 0), 0) / firstHalf.length;
  const avgSecond =
    secondHalf.reduce((sum: number, p: any) => sum + (p.walk_in_ratio || 0), 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  const diffPercent = Math.round(diff * 100);

  if (Math.abs(diffPercent) < 3) return null;

  if (diff > 0) {
    return {
      text: `Tendance walk-in en hausse : +${diffPercent}% sur les 30 derniers jours. Rive ajuste automatiquement les prévisions.`,
      type: 'walk_in_trend',
      data: { avgFirst: Math.round(avgFirst * 100), avgSecond: Math.round(avgSecond * 100), diffPercent },
    };
  } else {
    return {
      text: `Les walk-ins ont baissé de ${Math.abs(diffPercent)}% ce mois-ci. Les prévisions de Rive s'adaptent en conséquence.`,
      type: 'walk_in_trend',
      data: { avgFirst: Math.round(avgFirst * 100), avgSecond: Math.round(avgSecond * 100), diffPercent },
    };
  }
};

// --- Main export -------------------------------------------------------------

const generators: InsightGenerator[] = [
  detectRecord,
  detectStreak,
  detectOccasions,
  detectWalkInTrend,
];

export async function generateDailyInsight(
  supabase: SupabaseClient,
  restaurantId: string
): Promise<Insight | null> {
  // Shuffle generators for variety
  const shuffled = [...generators].sort(() => Math.random() - 0.5);

  for (const generate of shuffled) {
    try {
      const insight = await generate(supabase, restaurantId);
      if (insight) return insight;
    } catch (error) {
      console.warn('[InsightGenerator] Generator failed, trying next:', error);
    }
  }

  return null;
}
