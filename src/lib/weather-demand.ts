// =============================================================================
// Weather Demand Correlation Engine
//
// Tracks and calibrates the relationship between weather conditions and
// menu item demand. Over time, the system learns each restaurant's specific
// weather sensitivity through actual cover/sales feedback.
//
// Flow:
//   1. Before service: record predicted modifier + covers (recordWeatherPrediction)
//   2. After service: record actual covers (recordWeatherOutcome)
//   3. Periodically: recalculate demand multipliers (calibrateDemandCorrelation)
// =============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type { WeatherAlert, DailyForecast } from '@/lib/weather';
import type { WeatherCoverModifier } from '@/lib/prep-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WeatherImpactRecord = {
  restaurantId: string;
  weatherDate: string;
  alertType: WeatherAlert['type'] | 'clear';
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationMm: number;
  windSpeedMax: number;
  predictedCoverModifier: number;
  predictedCovers: number;
  baselineCovers: number;
};

export type WeatherOutcome = {
  restaurantId: string;
  weatherDate: string;
  actualCovers: number;
};

export type DemandCorrelation = {
  weatherType: string;
  menuCategory: string;
  demandMultiplier: number;
  sampleCount: number;
  confidence: number;
};

// Menu category keywords for automatic classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  soups: ['soupe', 'soup', 'potage', 'velouté', 'bouillon', 'consommé', 'minestrone', 'bisque', 'crème de'],
  hot_beverages: ['café', 'coffee', 'thé', 'tea', 'chocolat chaud', 'hot chocolate', 'tisane', 'infusion', 'cappuccino', 'latte', 'espresso'],
  salads: ['salade', 'salad', 'crudités', 'mesclun', 'taboulé', 'coleslaw', 'caesar', 'niçoise'],
  cold_desserts: ['glace', 'ice cream', 'sorbet', 'panna cotta', 'mousse', 'tiramisu', 'crème glacée', 'frozen', 'parfait'],
  comfort_food: ['gratin', 'raclette', 'fondue', 'cassoulet', 'pot-au-feu', 'blanquette', 'bourguignon', 'stew', 'ragout', 'daube', 'tajine'],
};

// ---------------------------------------------------------------------------
// Classify a menu item into a weather-relevant category
// ---------------------------------------------------------------------------

export function classifyMenuItemCategory(itemName: string, description?: string): string | null {
  const text = `${itemName} ${description || ''}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return category;
    }
  }

  return null; // No weather-relevant category match
}

// ---------------------------------------------------------------------------
// Record predicted weather impact before service
// ---------------------------------------------------------------------------

export async function recordWeatherPrediction(
  supabase: SupabaseClient,
  record: WeatherImpactRecord,
): Promise<void> {
  await supabase.from('weather_impact_history').upsert({
    restaurant_id: record.restaurantId,
    weather_date: record.weatherDate,
    weather_alert_type: record.alertType,
    weather_code: record.weatherCode,
    temp_max: record.tempMax,
    temp_min: record.tempMin,
    precipitation_mm: record.precipitationMm,
    wind_speed_max: record.windSpeedMax,
    predicted_cover_modifier: record.predictedCoverModifier,
    predicted_covers: record.predictedCovers,
    baseline_covers: record.baselineCovers,
  }, { onConflict: 'restaurant_id,weather_date' });
}

// ---------------------------------------------------------------------------
// Record actual covers after service (feedback loop)
// ---------------------------------------------------------------------------

export async function recordWeatherOutcome(
  supabase: SupabaseClient,
  outcome: WeatherOutcome,
): Promise<{ calibrationScore: number }> {
  // Fetch the prediction record
  const { data: record } = await supabase
    .from('weather_impact_history')
    .select('predicted_covers, baseline_covers, predicted_cover_modifier')
    .eq('restaurant_id', outcome.restaurantId)
    .eq('weather_date', outcome.weatherDate)
    .single();

  if (!record) {
    // No prediction was recorded — just store actuals
    await supabase.from('weather_impact_history').upsert({
      restaurant_id: outcome.restaurantId,
      weather_date: outcome.weatherDate,
      weather_alert_type: 'clear',
      actual_covers: outcome.actualCovers,
      feedback_given_at: new Date().toISOString(),
    }, { onConflict: 'restaurant_id,weather_date' });
    return { calibrationScore: 0 };
  }

  // Calculate actual modifier and calibration score
  const baselineCovers = record.baseline_covers || record.predicted_covers;
  const actualModifier = baselineCovers > 0 ? outcome.actualCovers / baselineCovers : 1.0;

  // Calibration score: 100 = perfect, 0 = completely off
  // Based on how close the predicted modifier was to the actual modifier
  const predictionError = Math.abs((record.predicted_cover_modifier || 1) - actualModifier);
  const calibrationScore = Math.max(0, Math.round((1 - predictionError) * 100));

  await supabase.from('weather_impact_history').update({
    actual_covers: outcome.actualCovers,
    actual_cover_modifier: Math.round(actualModifier * 1000) / 1000,
    calibration_score: calibrationScore,
    feedback_given_at: new Date().toISOString(),
  })
    .eq('restaurant_id', outcome.restaurantId)
    .eq('weather_date', outcome.weatherDate);

  return { calibrationScore };
}

// ---------------------------------------------------------------------------
// Calibrate demand correlation from historical data
// ---------------------------------------------------------------------------

export async function calibrateDemandCorrelation(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<DemandCorrelation[]> {
  // Fetch all weather impact records with actual feedback
  const { data: history } = await supabase
    .from('weather_impact_history')
    .select('weather_alert_type, actual_cover_modifier, baseline_covers, actual_covers')
    .eq('restaurant_id', restaurantId)
    .not('actual_covers', 'is', null)
    .not('actual_cover_modifier', 'is', null)
    .order('weather_date', { ascending: false })
    .limit(365); // Last year of data

  if (!history || history.length === 0) return [];

  // Group by weather type and compute average actual modifier
  const typeGroups: Record<string, { modifiers: number[]; count: number }> = {};

  for (const row of history) {
    const type = row.weather_alert_type;
    if (!typeGroups[type]) typeGroups[type] = { modifiers: [], count: 0 };
    typeGroups[type].modifiers.push(row.actual_cover_modifier);
    typeGroups[type].count++;
  }

  // For each weather type, compute learned cover modifier
  const correlations: DemandCorrelation[] = [];

  for (const [weatherType, group] of Object.entries(typeGroups)) {
    const avgModifier = group.modifiers.reduce((a, b) => a + b, 0) / group.modifiers.length;
    // Confidence increases with sample size: 3 samples = 0.3, 10 = 0.7, 20+ = 0.9+
    const confidence = Math.min(0.95, 1 - 1 / (1 + group.count * 0.15));

    // Store overall cover correlation
    correlations.push({
      weatherType,
      menuCategory: 'overall_covers',
      demandMultiplier: Math.round(avgModifier * 1000) / 1000,
      sampleCount: group.count,
      confidence: Math.round(confidence * 100) / 100,
    });

    // Upsert into DB
    await supabase.from('weather_demand_correlation').upsert({
      restaurant_id: restaurantId,
      weather_type: weatherType,
      menu_category: 'overall_covers',
      demand_multiplier: Math.round(avgModifier * 1000) / 1000,
      sample_count: group.count,
      confidence: Math.round(confidence * 100) / 100,
      last_calibrated_at: new Date().toISOString(),
    }, { onConflict: 'restaurant_id,weather_type,menu_category' });
  }

  return correlations;
}

// ---------------------------------------------------------------------------
// Get learned weather modifier (replaces hardcoded defaults when enough data)
// ---------------------------------------------------------------------------

export async function getLearnedWeatherModifier(
  supabase: SupabaseClient,
  restaurantId: string,
  alertType: WeatherAlert['type'],
): Promise<{ modifier: number; confidence: number; sampleCount: number } | null> {
  const { data } = await supabase
    .from('weather_demand_correlation')
    .select('demand_multiplier, confidence, sample_count')
    .eq('restaurant_id', restaurantId)
    .eq('weather_type', alertType)
    .eq('menu_category', 'overall_covers')
    .single();

  if (!data || data.confidence < 0.3) return null; // Not enough data yet

  return {
    modifier: data.demand_multiplier,
    confidence: data.confidence,
    sampleCount: data.sample_count,
  };
}

// ---------------------------------------------------------------------------
// Get weather calibration stats for a restaurant (used in intelligence score)
// ---------------------------------------------------------------------------

export async function getWeatherCalibrationStats(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<{
  totalFeedbacks: number;
  avgCalibrationScore: number;
  weatherTypesCalibrated: number;
}> {
  const { data: feedbacks } = await supabase
    .from('weather_impact_history')
    .select('calibration_score')
    .eq('restaurant_id', restaurantId)
    .not('calibration_score', 'is', null);

  const { data: correlations } = await supabase
    .from('weather_demand_correlation')
    .select('weather_type')
    .eq('restaurant_id', restaurantId)
    .gte('confidence', 0.3);

  const scores = (feedbacks || []).map(f => f.calibration_score).filter(Boolean);
  const avgScore = scores.length > 0
    ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    : 0;

  return {
    totalFeedbacks: scores.length,
    avgCalibrationScore: Math.round(avgScore),
    weatherTypesCalibrated: (correlations || []).length,
  };
}
