import { SupabaseClient } from '@supabase/supabase-js';
import { loadFoodCostData, calculateItemFoodCost, FoodCostResult } from '@/lib/food-cost';
import { loadMenuFromSupabase } from '@/lib/menu-store';

// =============================================================================
// Smart Prep Engine — Predictive Preparation Planning
//
// This module contains the pure prediction logic that transforms reservation
// data, POS sales history, recipes, and menu engineering data into an
// actionable prep list with prioritized items and aggregated ingredients.
//
// The engine operates at three levels depending on available data:
//   Level 1: Reservations only → cover estimation + dietary alerts
//   Level 2: + POS sales → item-level portion predictions
//   Level 3: + Recipes/Food Cost → raw ingredient aggregation + cost estimation
//
// All logic is designed to be testable without database access by accepting
// data as parameters rather than fetching internally.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServicePeriod = 'lunch' | 'dinner' | 'all_day';

export type PrepListConfig = {
  targetDate: string;          // ISO date string: '2026-02-27'
  servicePeriod: ServicePeriod;
  safetyBuffer: number;        // e.g., 0.10 for 10% extra
  lookbackWeeks: number;       // How many weeks of POS history to analyze (default 8)
};

export type CoverEstimation = {
  reservedCovers: number;
  walkInRatio: number;         // Historical ratio (0-1)
  estimatedWalkIns: number;
  estimatedTotal: number;      // After safety buffer
  servicePeriod: ServicePeriod;
};

export type PredictedItem = {
  menuItemId: string;
  menuItemName: string;
  predictedPortions: number;
  itemShare: number;           // Historical share (0-1)
  confidenceScore: number;     // Data quality indicator (0-1)
  confidenceModifier: number;  // Learned from feedback (0.5-2.0)
  priority: 'high' | 'medium' | 'low';
  priorityScore: number;       // 0-100
  bcgCategory: string | null;  // 'phare' | 'ancre' | 'derive' | 'ecueil'
  marginPercent: number;
  estimatedCost: number;       // Food cost for these portions
};

export type AggregatedIngredient = {
  ingredientId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  estimatedCost: number;
  usedByItems: Array<{
    menuItemName: string;
    qty: number;
    portions: number;
  }>;
};

export type PrepAlert = {
  type: 'dietary' | 'anomaly' | 'vip' | 'occasion' | 'volume';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: Record<string, any>;
};

export type PrepListResult = {
  coverEstimation: CoverEstimation;
  items: PredictedItem[];
  ingredients: AggregatedIngredient[];
  alerts: PrepAlert[];
  estimatedFoodCost: number;
  generationLevel: 1 | 2 | 3;
};

// ---------------------------------------------------------------------------
// Step 1: Estimate covers from reservations + historical walk-in ratio
// ---------------------------------------------------------------------------

export function estimateCovers(
  reservations: Array<{ guest_count: number; status: string; reservation_time: string }>,
  historicalWalkInRatio: number,
  safetyBuffer: number,
  servicePeriod: ServicePeriod,
): CoverEstimation {
  // Filter out cancelled reservations and match service period
  const activeReservations = reservations.filter(r => {
    if (r.status === 'cancelled') return false;
    if (servicePeriod === 'all_day') return true;

    const hour = new Date(r.reservation_time).getHours();
    // Lunch = before 15:00, Dinner = 15:00+
    if (servicePeriod === 'lunch') return hour < 15;
    return hour >= 15;
  });

  const reservedCovers = activeReservations.reduce((sum, r) => sum + (r.guest_count || 0), 0);

  // If walk-in ratio is 0.30, it means 30% of actual covers are walk-ins.
  // So: actual = reserved / (1 - walkInRatio)
  // Clamp ratio between 0 and 0.7 to avoid division issues
  const clampedRatio = Math.max(0, Math.min(0.7, historicalWalkInRatio));
  const estimatedWithWalkIns = clampedRatio > 0
    ? Math.round(reservedCovers / (1 - clampedRatio))
    : reservedCovers;

  const estimatedWalkIns = estimatedWithWalkIns - reservedCovers;

  // Apply safety buffer (e.g., +10%)
  const estimatedTotal = Math.round(estimatedWithWalkIns * (1 + safetyBuffer));

  return {
    reservedCovers,
    walkInRatio: clampedRatio,
    estimatedWalkIns,
    estimatedTotal,
    servicePeriod,
  };
}

// ---------------------------------------------------------------------------
// Step 2: Calculate historical walk-in ratio for a given day of week
// ---------------------------------------------------------------------------

export async function calculateWalkInRatio(
  supabase: SupabaseClient,
  restaurantId: string,
  dayOfWeek: number, // 0=Sun, 1=Mon ... 6=Sat
  lookbackWeeks: number = 8,
): Promise<number> {
  // We need two data points per historical date:
  //   A) Total reserved covers (from reservations table)
  //   B) Total actual covers (from POS sales or manual count)
  //
  // If POS data is unavailable, we fall back to a sensible default (20%)
  
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackWeeks * 7);

  // Fetch historical reservations for this day of week
  const { data: histReservations } = await supabase
    .from('reservations')
    .select('reservation_time, guest_count, status')
    .eq('restaurant_id', restaurantId)
    .neq('status', 'cancelled')
    .gte('reservation_time', lookbackDate.toISOString());

  if (!histReservations || histReservations.length === 0) {
    return 0.20; // Default 20% walk-in ratio when no history
  }

  // Group by date and filter to matching day of week
  const dateGroups: Record<string, number> = {};
  for (const r of histReservations) {
    const d = new Date(r.reservation_time);
    if (d.getDay() !== dayOfWeek) continue;
    const dateKey = d.toISOString().split('T')[0];
    dateGroups[dateKey] = (dateGroups[dateKey] || 0) + (r.guest_count || 0);
  }

  // Fetch POS total covers for the same dates (if available)
  const { data: posTotals } = await supabase
    .from('pos_sales')
    .select('sale_date, quantity_sold_weekly')
    .eq('restaurant_id', restaurantId)
    .eq('day_of_week', dayOfWeek)
    .gte('sale_date', lookbackDate.toISOString().split('T')[0]);

  if (!posTotals || posTotals.length === 0) {
    return 0.20; // Default when POS data is unavailable
  }

  // Compute average walk-in ratio across available dates
  let totalReserved = 0;
  let totalActual = 0;

  const posDateTotals: Record<string, number> = {};
  for (const p of posTotals) {
    const dk = p.sale_date;
    posDateTotals[dk] = (posDateTotals[dk] || 0) + (p.quantity_sold_weekly || 0);
  }

  for (const [dateKey, reserved] of Object.entries(dateGroups)) {
    const actual = posDateTotals[dateKey];
    if (actual && actual > reserved) {
      totalReserved += reserved;
      totalActual += actual;
    }
  }

  if (totalActual === 0) return 0.20;

  // walk_in_ratio = (actual - reserved) / actual
  const ratio = (totalActual - totalReserved) / totalActual;
  return Math.max(0, Math.min(0.7, Math.round(ratio * 1000) / 1000));
}

// ---------------------------------------------------------------------------
// Step 3: Calculate item mix (what percentage of covers order each item)
// ---------------------------------------------------------------------------

export async function calculateItemMix(
  supabase: SupabaseClient,
  restaurantId: string,
  dayOfWeek: number,
  servicePeriod: ServicePeriod,
  activeMenuItemIds: string[],
  lookbackWeeks: number = 8,
): Promise<Record<string, number>> {
  // Query POS sales for this day of week, grouped by menu_item_id
  // The item_share = sum(qty for this item) / sum(qty for all items)
  
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackWeeks * 7);

  let query = supabase
    .from('pos_sales')
    .select('menu_item_id, quantity_sold_weekly')
    .eq('restaurant_id', restaurantId)
    .eq('day_of_week', dayOfWeek)
    .in('menu_item_id', activeMenuItemIds)
    .gte('sale_date', lookbackDate.toISOString().split('T')[0]);

  // Filter by service period if not all_day
  if (servicePeriod !== 'all_day') {
    query = query.eq('service_period', servicePeriod);
  }

  const { data: sales } = await query;

  if (!sales || sales.length === 0) {
    // Fallback: equal distribution across all active items
    const equalShare = activeMenuItemIds.length > 0 ? 1 / activeMenuItemIds.length : 0;
    const mix: Record<string, number> = {};
    for (const id of activeMenuItemIds) {
      mix[id] = equalShare;
    }
    return mix;
  }

  // Aggregate sales by item
  const itemTotals: Record<string, number> = {};
  let grandTotal = 0;

  for (const s of sales) {
    const qty = s.quantity_sold_weekly || 0;
    itemTotals[s.menu_item_id] = (itemTotals[s.menu_item_id] || 0) + qty;
    grandTotal += qty;
  }

  // Convert to shares
  const mix: Record<string, number> = {};
  for (const id of activeMenuItemIds) {
    mix[id] = grandTotal > 0
      ? Math.round(((itemTotals[id] || 0) / grandTotal) * 10000) / 10000
      : 1 / activeMenuItemIds.length;
  }

  return mix;
}

// ---------------------------------------------------------------------------
// Step 4: Convert predicted portions to raw ingredients
// ---------------------------------------------------------------------------

export function aggregateIngredients(
  predictedItems: Array<{ menuItemId: string; menuItemName: string; predictedPortions: number }>,
  recipes: Array<{ id: string; menuItemId: string; ingredients: Array<{ ingredientId: string; ingredientName?: string; quantity: number; unit: string }> }>,
  ingredientMap: Record<string, { id: string; name: string; unitCost: number; unit: string }>,
): AggregatedIngredient[] {
  // Build a map of ingredient_id → aggregated data
  const aggMap: Record<string, AggregatedIngredient> = {};

  for (const item of predictedItems) {
    // Find the recipe for this menu item
    const recipe = recipes.find(r => r.menuItemId === item.menuItemId);
    if (!recipe) continue;

    for (const ri of recipe.ingredients) {
      const totalQty = ri.quantity * item.predictedPortions;
      const ingredient = ingredientMap[ri.ingredientId];
      const ingredientName = ingredient?.name || ri.ingredientName || 'Inconnu';
      const unitCost = ingredient?.unitCost || 0;

      if (!aggMap[ri.ingredientId]) {
        aggMap[ri.ingredientId] = {
          ingredientId: ri.ingredientId,
          ingredientName,
          totalQuantity: 0,
          unit: ri.unit || ingredient?.unit || 'kg',
          estimatedCost: 0,
          usedByItems: [],
        };
      }

      aggMap[ri.ingredientId].totalQuantity += totalQty;
      aggMap[ri.ingredientId].estimatedCost += totalQty * unitCost;
      aggMap[ri.ingredientId].usedByItems.push({
        menuItemName: item.menuItemName,
        qty: Math.round(totalQty * 1000) / 1000,
        portions: item.predictedPortions,
      });
    }
  }

  // Round and sort by cost (most expensive first)
  return Object.values(aggMap)
    .map(ing => ({
      ...ing,
      totalQuantity: Math.round(ing.totalQuantity * 1000) / 1000,
      estimatedCost: Math.round(ing.estimatedCost * 100) / 100,
    }))
    .sort((a, b) => b.estimatedCost - a.estimatedCost);
}

// ---------------------------------------------------------------------------
// Step 5: Calculate priority score from BCG category and margin
// ---------------------------------------------------------------------------

export function calculatePriority(
  bcgCategory: string | null,
  marginPercent: number,
  popularityRank: number, // 0 = most popular, 1 = least popular (normalized)
): { priority: 'high' | 'medium' | 'low'; priorityScore: number } {
  // BCG weight: phare=100, ancre=70, dérive=50, écueil=20
  const bcgWeights: Record<string, number> = {
    phare: 100,
    ancre: 70,
    derive: 50,
    ecueil: 20,
  };

  const bcgWeight = bcgWeights[bcgCategory || ''] || 50;

  // Normalize margin to 0-100 scale (assuming max margin ~90%)
  const normalizedMargin = Math.min(100, (marginPercent / 90) * 100);

  // Popularity rank is already 0-1 where 0 = most popular
  const popularityScore = (1 - popularityRank) * 100;

  // Weighted combination
  const score = Math.round(
    bcgWeight * 0.4 +
    normalizedMargin * 0.3 +
    popularityScore * 0.3
  );

  // Map score to priority label
  let priority: 'high' | 'medium' | 'low';
  if (score >= 65) priority = 'high';
  else if (score >= 40) priority = 'medium';
  else priority = 'low';

  return { priority, priorityScore: Math.max(0, Math.min(100, score)) };
}

// ---------------------------------------------------------------------------
// Step 6: Extract dietary alerts from reservation notes
// ---------------------------------------------------------------------------

export function extractDietaryAlerts(
  reservations: Array<{ customer_name: string | null; customer_notes: string | null; guest_count: number; reservation_time: string }>,
): PrepAlert[] {
  const alerts: PrepAlert[] = [];

  // Keywords to detect in customer notes (case-insensitive)
  const dietaryPatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /sans\s*gluten|gluten[\s-]*free|celiac|coeliaque/i, label: 'sans gluten' },
    { pattern: /végétarien|vegetarian/i, label: 'végétarien' },
    { pattern: /végétalien|vegan/i, label: 'végétalien / vegan' },
    { pattern: /allergi.+noix|nut\s*allergy|tree\s*nut/i, label: 'allergie aux noix' },
    { pattern: /allergi.+lait|lactose|dairy[\s-]*free|sans\s*lactose/i, label: 'sans lactose' },
    { pattern: /allergi.+fruits?\s*de\s*mer|shellfish|crustacé/i, label: 'allergie fruits de mer' },
    { pattern: /halal/i, label: 'halal' },
    { pattern: /kasher|kosher/i, label: 'kasher' },
    { pattern: /enceinte|pregnant/i, label: 'femme enceinte (pas de cru)' },
  ];

  const occasionPatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /anniversaire|birthday|fête/i, label: 'anniversaire' },
    { pattern: /mariage|wedding|noce/i, label: 'mariage' },
    { pattern: /affaires|business|corporate/i, label: 'repas d\'affaires' },
    { pattern: /vip|important|spécial/i, label: 'VIP / invité spécial' },
  ];

  // Track counts for each dietary need
  const dietaryCounts: Record<string, Array<{ name: string; time: string; guests: number }>> = {};
  const occasionMatches: Array<{ label: string; name: string; time: string; guests: number }> = [];

  for (const r of reservations) {
    const notes = r.customer_notes || '';
    if (!notes.trim()) continue;

    for (const { pattern, label } of dietaryPatterns) {
      if (pattern.test(notes)) {
        if (!dietaryCounts[label]) dietaryCounts[label] = [];
        dietaryCounts[label].push({
          name: r.customer_name || 'Client anonyme',
          time: new Date(r.reservation_time).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
          guests: r.guest_count,
        });
      }
    }

    for (const { pattern, label } of occasionPatterns) {
      if (pattern.test(notes)) {
        occasionMatches.push({
          label,
          name: r.customer_name || 'Client anonyme',
          time: new Date(r.reservation_time).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
          guests: r.guest_count,
        });
      }
    }
  }

  // Generate dietary alerts
  for (const [label, matches] of Object.entries(dietaryCounts)) {
    const severity = matches.length >= 3 ? 'critical' : matches.length >= 2 ? 'warning' : 'info';
    alerts.push({
      type: 'dietary',
      severity,
      message: `${matches.length} réservation${matches.length > 1 ? 's' : ''} ${label}`,
      details: { matches },
    });
  }

  // Generate occasion alerts
  for (const occ of occasionMatches) {
    alerts.push({
      type: 'occasion',
      severity: 'info',
      message: `${occ.label} — ${occ.name} à ${occ.time} (${occ.guests} pers.)`,
      details: occ,
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Step 7: Detect volume anomalies
// ---------------------------------------------------------------------------

export function detectVolumeAnomalies(
  estimatedCovers: number,
  historicalAvgCovers: number,
  dayLabel: string,
): PrepAlert[] {
  const alerts: PrepAlert[] = [];

  if (historicalAvgCovers === 0) return alerts;

  const ratio = estimatedCovers / historicalAvgCovers;

  if (ratio >= 2.0) {
    alerts.push({
      type: 'volume',
      severity: 'critical',
      message: `Volume exceptionnel : ${estimatedCovers} couverts estimés vs ${Math.round(historicalAvgCovers)} en moyenne le ${dayLabel}. Prévoir du renfort en cuisine.`,
      details: { ratio: Math.round(ratio * 100) / 100, estimated: estimatedCovers, average: Math.round(historicalAvgCovers) },
    });
  } else if (ratio >= 1.4) {
    alerts.push({
      type: 'volume',
      severity: 'warning',
      message: `Volume supérieur à la moyenne : ${estimatedCovers} couverts estimés vs ${Math.round(historicalAvgCovers)} habituellement le ${dayLabel} (+${Math.round((ratio - 1) * 100)}%).`,
      details: { ratio: Math.round(ratio * 100) / 100, estimated: estimatedCovers, average: Math.round(historicalAvgCovers) },
    });
  } else if (ratio <= 0.5 && estimatedCovers > 0) {
    alerts.push({
      type: 'volume',
      severity: 'info',
      message: `Volume faible : seulement ${estimatedCovers} couverts estimés vs ${Math.round(historicalAvgCovers)} en moyenne le ${dayLabel}. Réduire la prep en conséquence.`,
      details: { ratio: Math.round(ratio * 100) / 100, estimated: estimatedCovers, average: Math.round(historicalAvgCovers) },
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Master function: Generate a complete Smart Prep List
// ---------------------------------------------------------------------------

export async function generatePrepList(
  supabase: SupabaseClient,
  restaurantId: string,
  config: PrepListConfig,
): Promise<PrepListResult> {
  const targetDate = new Date(config.targetDate);
  const dayOfWeek = targetDate.getDay(); // 0=Sun through 6=Sat
  const dayLabels = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayLabel = dayLabels[dayOfWeek];

  // ---- LEVEL 1: Reservations-based cover estimation ----

  // Fetch reservations for the target date
  const startOfDay = `${config.targetDate}T00:00:00`;
  const endOfDay = `${config.targetDate}T23:59:59`;

  const { data: reservations } = await supabase
    .from('reservations')
    .select('guest_count, status, reservation_time, customer_name, customer_notes, customer_email')
    .eq('restaurant_id', restaurantId)
    .gte('reservation_time', startOfDay)
    .lte('reservation_time', endOfDay);

  const allReservations = reservations || [];

  // Calculate walk-in ratio from historical data
  const walkInRatio = await calculateWalkInRatio(supabase, restaurantId, dayOfWeek, config.lookbackWeeks);

  // Estimate total covers
  const coverEstimation = estimateCovers(
    allReservations,
    walkInRatio,
    config.safetyBuffer,
    config.servicePeriod,
  );

  // Extract dietary and occasion alerts from reservation notes
  const alerts: PrepAlert[] = extractDietaryAlerts(allReservations);

  // Start building the result at Level 1
  let generationLevel: 1 | 2 | 3 = 1;
  let items: PredictedItem[] = [];
  let ingredients: AggregatedIngredient[] = [];
  let estimatedFoodCost = 0;

  // ---- LEVEL 2: POS-based item predictions ----

  // Load menu items
  const { items: menuItems } = await loadMenuFromSupabase();
  const activeItems = menuItems.filter(i => i.available);
  const activeMenuItemIds = activeItems.map(i => i.id);

  if (activeMenuItemIds.length > 0) {
    // Calculate item mix from POS history
    const itemMix = await calculateItemMix(
      supabase, restaurantId, dayOfWeek, config.servicePeriod,
      activeMenuItemIds, config.lookbackWeeks,
    );

    // Check if we have meaningful POS data (at least some items with share > 0)
    const hasPOSData = Object.values(itemMix).some(share => share > 0 && share < 1);
    if (hasPOSData) generationLevel = 2;

    // Load confidence modifiers (learned from past feedback)
    const { data: modifiers } = await supabase
      .from('prep_confidence_modifiers')
      .select('menu_item_id, modifier, feedback_count')
      .eq('restaurant_id', restaurantId)
      .in('menu_item_id', activeMenuItemIds);

    const modifierMap: Record<string, { modifier: number; feedbackCount: number }> = {};
    for (const m of (modifiers || [])) {
      modifierMap[m.menu_item_id] = { modifier: m.modifier, feedbackCount: m.feedback_count };
    }

    // Load food cost data for margin calculation and BCG
    const { ingredients: ingredientMap, recipes } = await loadFoodCostData(supabase, restaurantId);

    // Load POS sales for BCG classification (reuse menu-engineering logic)
    const { data: posSales } = await supabase
      .from('pos_sales')
      .select('menu_item_id, quantity_sold_weekly')
      .eq('restaurant_id', restaurantId)
      .in('menu_item_id', activeMenuItemIds);

    // Calculate medians for BCG
    const costResults: FoodCostResult[] = [];
    for (const recipe of recipes) {
      const menuItem = activeItems.find(i => i.id === recipe.menuItemId);
      if (!menuItem) continue;
      costResults.push(calculateItemFoodCost(recipe, menuItem.price, menuItem.name, ingredientMap));
    }

    const margins = costResults.map(r => r.margin).sort((a, b) => a - b);
    const medianMargin = margins[Math.floor(margins.length / 2)] || 65;

    const salesMap: Record<string, number> = {};
    for (const s of (posSales || [])) {
      salesMap[s.menu_item_id] = (salesMap[s.menu_item_id] || 0) + (s.quantity_sold_weekly || 0);
    }
    const salesValues = Object.values(salesMap).sort((a, b) => a - b);
    const medianSales = salesValues[Math.floor(salesValues.length / 2)] || 0;

    // Build predicted items
    const rawItems: PredictedItem[] = activeItems.map((menuItem, index) => {
      const share = itemMix[menuItem.id] || 0;
      const mod = modifierMap[menuItem.id];
      const confidenceModifier = mod?.modifier || 1.0;

      // Predicted portions = estimated covers × item share × confidence modifier
      const predictedPortions = Math.max(0, Math.round(
        coverEstimation.estimatedTotal * share * confidenceModifier
      ));

      // Food cost for this item
      const costResult = costResults.find(c => c.menuItemId === menuItem.id);
      const marginPercent = costResult?.margin || 0;
      const ingredientCostPerUnit = costResult?.ingredientCost || 0;

      // BCG category
      const isHighMargin = marginPercent >= medianMargin;
      const itemSales = salesMap[menuItem.id] || 0;
      const isPopular = itemSales >= medianSales;
      let bcgCategory: string;
      if (isHighMargin && isPopular) bcgCategory = 'phare';
      else if (!isHighMargin && isPopular) bcgCategory = 'ancre';
      else if (isHighMargin && !isPopular) bcgCategory = 'derive';
      else bcgCategory = 'ecueil';

      // Confidence score depends on data quality and feedback history
      let confidenceScore = 0.30; // Base: reservations only
      if (hasPOSData) confidenceScore += 0.30;
      if (costResult) confidenceScore += 0.20;
      if (mod && mod.feedbackCount >= 3) confidenceScore += 0.20;
      confidenceScore = Math.min(1.0, confidenceScore);

      return {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        predictedPortions,
        itemShare: share,
        confidenceScore,
        confidenceModifier,
        priority: 'medium' as const,  // Will be overwritten below
        priorityScore: 50,
        bcgCategory,
        marginPercent,
        estimatedCost: Math.round(ingredientCostPerUnit * predictedPortions * 100) / 100,
      };
    });

    // Calculate popularity rank (0 = most popular)
    const sortedByShare = [...rawItems].sort((a, b) => b.itemShare - a.itemShare);
    const totalItems = sortedByShare.length;

    for (let i = 0; i < sortedByShare.length; i++) {
      const rankNormalized = totalItems > 1 ? i / (totalItems - 1) : 0;
      const { priority, priorityScore } = calculatePriority(
        sortedByShare[i].bcgCategory,
        sortedByShare[i].marginPercent,
        rankNormalized,
      );
      sortedByShare[i].priority = priority;
      sortedByShare[i].priorityScore = priorityScore;
    }

    // Sort by priority score descending, then filter out zero-portion items
    items = sortedByShare
      .filter(item => item.predictedPortions > 0)
      .sort((a, b) => b.priorityScore - a.priorityScore);

    // Calculate total food cost
    estimatedFoodCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);

    // ---- LEVEL 3: Ingredient aggregation ----
    if (recipes.length > 0 && Object.keys(ingredientMap).length > 0) {
      generationLevel = 3;

      ingredients = aggregateIngredients(
        items.map(i => ({
          menuItemId: i.menuItemId,
          menuItemName: i.menuItemName,
          predictedPortions: i.predictedPortions,
        })),
        recipes,
        ingredientMap,
      );
    }
  }

  // ---- Volume anomaly detection ----
  // Calculate historical average covers for this day of week
  const { data: histCoverData } = await supabase
    .from('reservations')
    .select('guest_count, reservation_time')
    .eq('restaurant_id', restaurantId)
    .neq('status', 'cancelled');

  if (histCoverData) {
    const historicalCovers: Record<string, number> = {};
    for (const r of histCoverData) {
      const d = new Date(r.reservation_time);
      if (d.getDay() !== dayOfWeek) continue;
      const dk = d.toISOString().split('T')[0];
      historicalCovers[dk] = (historicalCovers[dk] || 0) + (r.guest_count || 0);
    }
    const dates = Object.values(historicalCovers);
    const avgCovers = dates.length > 0 ? dates.reduce((a, b) => a + b, 0) / dates.length : 0;

    const volumeAlerts = detectVolumeAnomalies(coverEstimation.estimatedTotal, avgCovers, dayLabel);
    alerts.push(...volumeAlerts);
  }

  return {
    coverEstimation,
    items,
    ingredients,
    alerts,
    estimatedFoodCost: Math.round(estimatedFoodCost * 100) / 100,
    generationLevel,
  };
}

// ---------------------------------------------------------------------------
// Feedback processing: Update confidence modifiers based on chef input
// ---------------------------------------------------------------------------

export async function processChefFeedback(
  supabase: SupabaseClient,
  restaurantId: string,
  prepListId: string,
  feedback: Array<{ menuItemId: string; actualPortions: number }>,
): Promise<{ updatedItems: number; avgAccuracy: number }> {
  let totalDelta = 0;
  let totalPredicted = 0;
  let updatedItems = 0;

  for (const fb of feedback) {
    // Fetch the prep list item to get predicted portions
    const { data: item } = await supabase
      .from('prep_list_items')
      .select('id, predicted_portions, confidence_modifier')
      .eq('prep_list_id', prepListId)
      .eq('menu_item_id', fb.menuItemId)
      .single();

    if (!item) continue;

    const delta = fb.actualPortions - item.predicted_portions;

    // Update the prep list item with actual data
    await supabase
      .from('prep_list_items')
      .update({
        actual_portions: fb.actualPortions,
        feedback_delta: delta,
      })
      .eq('id', item.id);

    // Update the persistent confidence modifier using exponential moving average
    // New modifier = old modifier + (learning_rate × error_ratio)
    // The learning rate is inversely proportional to feedback count (learns fast early, slows down)
    const { data: existingModifier } = await supabase
      .from('prep_confidence_modifiers')
      .select('modifier, feedback_count')
      .eq('restaurant_id', restaurantId)
      .eq('menu_item_id', fb.menuItemId)
      .single();

    const currentModifier = existingModifier?.modifier || 1.0;
    const feedbackCount = (existingModifier?.feedback_count || 0) + 1;

    // Learning rate decreases as feedback accumulates: 0.3 early → ~0.05 after 20 feedbacks
    const learningRate = Math.max(0.05, 0.3 / Math.sqrt(feedbackCount));

    // Error ratio: if predicted 10 but actual was 14, error ratio = 4/10 = 0.4
    const errorRatio = item.predicted_portions > 0 ? delta / item.predicted_portions : 0;

    // New modifier adjusted by learning rate × error ratio
    let newModifier = currentModifier + (learningRate * errorRatio);
    // Clamp between 0.5 and 2.0
    newModifier = Math.max(0.5, Math.min(2.0, Math.round(newModifier * 100) / 100));

    await supabase
      .from('prep_confidence_modifiers')
      .upsert({
        restaurant_id: restaurantId,
        menu_item_id: fb.menuItemId,
        modifier: newModifier,
        feedback_count: feedbackCount,
        last_feedback_at: new Date().toISOString(),
      }, { onConflict: 'restaurant_id,menu_item_id' });

    totalDelta += Math.abs(delta);
    totalPredicted += item.predicted_portions;
    updatedItems++;
  }

  // Mark the prep list as completed
  await supabase
    .from('prep_lists')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', prepListId);

  // Average accuracy: 1 - (total absolute error / total predicted)
  const avgAccuracy = totalPredicted > 0
    ? Math.round((1 - totalDelta / totalPredicted) * 1000) / 10
    : 0;

  return { updatedItems, avgAccuracy };
}
