// =============================================================================
// Restaurant Health Score — Operational + Visibility Composite
//
// Combines 7 weighted sub-scores into a 0-100 composite with Bayesian
// confidence (OpenSkill), ARIMA trend forecasting, and AI recommendations.
// =============================================================================

import { rating, rate, ordinal } from 'openskill';
import ARIMA from 'arima';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPlaceDetails, findNearbyCompetitors, calculateVisibilityScore } from '@/lib/google-places';
import { aggregateReviews, sentimentToScore } from '@/lib/review-sentiment';

import type { PlaceDetails, NearbyCompetitor } from '@/lib/google-places';
import type { AggregatedSentiment } from '@/lib/review-sentiment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type SubScoreKey =
  | 'food_cost'
  | 'menu_completeness'
  | 'prep_accuracy'
  | 'variance'
  | 'team_engagement'
  | 'reservations'
  | 'visibility';

export type SubScoreDetail = {
  score: number;
  weight: number;
  effectiveWeight: number;
  active: boolean;
  metric: string;
  status: 'healthy' | 'warning' | 'critical';
};

export type HealthScoreResult = {
  totalScore: number;
  grade: HealthGrade;
  confidence: number;
  subScores: Record<SubScoreKey, SubScoreDetail>;
  recommendations: Recommendation[];
  bayesianMu: number;
  bayesianSigma: number;
  forecast: number[];
  activeModules: string[];
  // Visibility data (if available)
  googlePlaceId: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  googlePhotosCount: number | null;
  competitorData: NearbyCompetitor[];
  reviewSentiment: AggregatedSentiment | null;
};

export type Recommendation = {
  category: SubScoreKey;
  impact: 'high' | 'medium' | 'low';
  title: string;
  description: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_WEIGHTS: Record<SubScoreKey, number> = {
  food_cost: 0.25,
  menu_completeness: 0.15,
  prep_accuracy: 0.15,
  variance: 0.10,
  team_engagement: 0.10,
  reservations: 0.10,
  visibility: 0.15,
};

const GRADE_THRESHOLDS: Array<{ min: number; grade: HealthGrade }> = [
  { min: 85, grade: 'A' },
  { min: 70, grade: 'B' },
  { min: 55, grade: 'C' },
  { min: 40, grade: 'D' },
  { min: 0, grade: 'F' },
];

// ---------------------------------------------------------------------------
// Main Calculation
// ---------------------------------------------------------------------------

export async function calculateHealthScore(restaurantId: string): Promise<HealthScoreResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = supabaseAdmin();

  // Parallel fetch all operational data
  const [
    foodCostData,
    menuData,
    prepData,
    varianceData,
    engagementData,
    reservationData,
    existingScore,
    historyData,
  ] = await Promise.all([
    fetchFoodCostData(admin, restaurantId),
    fetchMenuData(admin, restaurantId),
    fetchPrepAccuracyData(admin, restaurantId),
    fetchVarianceData(admin, restaurantId),
    fetchTeamEngagementData(admin, restaurantId),
    fetchReservationData(admin, restaurantId),
    admin.from('restaurant_health_scores').select('*').eq('restaurant_id', restaurantId).maybeSingle(),
    admin.from('health_score_history').select('total_score').eq('restaurant_id', restaurantId).order('recorded_at', { ascending: true }).limit(52),
  ]);

  // Calculate each sub-score
  const rawScores: Record<SubScoreKey, { score: number; metric: string; active: boolean }> = {
    food_cost: scoreFoodCost(foodCostData),
    menu_completeness: scoreMenuCompleteness(menuData),
    prep_accuracy: scorePrepAccuracy(prepData),
    variance: scoreVariance(varianceData),
    team_engagement: scoreTeamEngagement(engagementData),
    reservations: scoreReservations(reservationData),
    visibility: { score: 0, metric: 'No Google data', active: false },
  };

  // Visibility: fetch Google data if place ID exists
  let googlePlaceId = existingScore.data?.google_place_id || null;
  let placeDetails: PlaceDetails | null = null;
  let competitors: NearbyCompetitor[] = [];
  let reviewSentiment: AggregatedSentiment | null = null;

  if (googlePlaceId) {
    placeDetails = await getPlaceDetails(googlePlaceId);
    if (placeDetails) {
      // Find competitors (simplified: skip if no geocoding)
      const vis = calculateVisibilityScore(placeDetails, competitors);
      rawScores.visibility = {
        score: vis.total,
        metric: `Rating: ${placeDetails.rating} (${placeDetails.reviewCount} reviews)`,
        active: true,
      };

      // Sentiment analysis on reviews
      if (placeDetails.reviews.length > 0) {
        reviewSentiment = aggregateReviews(placeDetails.reviews);
      }
    }
  }

  // Redistribute weights for inactive modules
  const activeKeys = Object.entries(rawScores).filter(([, v]) => v.active).map(([k]) => k as SubScoreKey);
  const inactiveWeight = Object.entries(rawScores)
    .filter(([, v]) => !v.active)
    .reduce((sum, [k]) => sum + BASE_WEIGHTS[k as SubScoreKey], 0);
  const redistributionPerActive = activeKeys.length > 0 ? inactiveWeight / activeKeys.length : 0;

  // Build sub-scores with effective weights
  const subScores: Record<SubScoreKey, SubScoreDetail> = {} as Record<SubScoreKey, SubScoreDetail>;
  let totalScore = 0;

  for (const key of Object.keys(BASE_WEIGHTS) as SubScoreKey[]) {
    const raw = rawScores[key];
    const effectiveWeight = raw.active ? BASE_WEIGHTS[key] + redistributionPerActive : 0;
    const status: SubScoreDetail['status'] =
      raw.score >= 70 ? 'healthy' : raw.score >= 40 ? 'warning' : 'critical';

    subScores[key] = {
      score: raw.score,
      weight: BASE_WEIGHTS[key],
      effectiveWeight,
      active: raw.active,
      metric: raw.metric,
      status,
    };

    totalScore += raw.score * effectiveWeight;
  }

  totalScore = Math.round(totalScore);
  const grade = GRADE_THRESHOLDS.find(t => totalScore >= t.min)!.grade;

  // Bayesian confidence update (OpenSkill)
  const prevMu = existingScore.data?.bayesian_mu ?? 25.0;
  const prevSigma = existingScore.data?.bayesian_sigma ?? 8.333;
  const playerRating = rating({ mu: prevMu, sigma: prevSigma });
  const benchmarkRating = rating({ mu: 50, sigma: 8.333 });

  // Simulate match: restaurant vs benchmark, outcome based on score
  const outcome = totalScore >= 50
    ? [[playerRating], [benchmarkRating]]
    : [[benchmarkRating], [playerRating]];
  const [[updatedPlayer]] = totalScore >= 50
    ? rate(outcome)
    : [rate(outcome)[1]]; // if lost, get the second team's updated rating

  const bayesianMu = updatedPlayer.mu;
  const bayesianSigma = updatedPlayer.sigma;
  const confidence = Math.max(0, Math.min(1, 1 - bayesianSigma / 8.333));

  // ARIMA forecast
  const historicalScores = (historyData.data || []).map((h: any) => h.total_score);
  historicalScores.push(totalScore);
  let forecast: number[] = [];
  if (historicalScores.length >= 4) {
    try {
      const arima = new ARIMA({ auto: true, verbose: false });
      arima.train(historicalScores);
      const [predicted] = arima.predict(4);
      forecast = predicted.map((v: number) => Math.round(Math.max(0, Math.min(100, v))));
    } catch {
      // ARIMA can fail on very short or flat series — graceful degradation
    }
  }

  // Generate recommendations from lowest sub-scores
  const recommendations = generateRecommendations(subScores);

  return {
    totalScore,
    grade,
    confidence,
    subScores,
    recommendations,
    bayesianMu,
    bayesianSigma,
    forecast,
    activeModules: activeKeys,
    googlePlaceId,
    googleRating: placeDetails?.rating ?? null,
    googleReviewCount: placeDetails?.reviewCount ?? null,
    googlePhotosCount: placeDetails?.photosCount ?? null,
    competitorData: competitors,
    reviewSentiment,
  };
}

// ---------------------------------------------------------------------------
// Sub-Score: Food Cost
// ---------------------------------------------------------------------------

type FoodCostRow = { cost: number; price: number };

async function fetchFoodCostData(admin: any, restaurantId: string): Promise<FoodCostRow[]> {
  const { data } = await admin
    .from('menu_items')
    .select('price, recipe_id')
    .eq('restaurant_id', restaurantId)
    .not('recipe_id', 'is', null)
    .not('price', 'is', null);

  if (!data || data.length === 0) return [];

  const recipeIds = data.map((d: { recipe_id: string }) => d.recipe_id).filter(Boolean);
  if (recipeIds.length === 0) return [];

  const { data: ingredients } = await admin
    .from('recipe_ingredients')
    .select('recipe_id, quantity, ingredient:ingredients(price_per_unit, unit)')
    .in('recipe_id', recipeIds);

  // Sum cost per recipe
  const recipeCosts: Record<string, number> = {};
  for (const ing of (ingredients || [])) {
    const rid = ing.recipe_id;
    const ingData = ing.ingredient as { price_per_unit?: number } | null;
    const cost = (ing.quantity || 0) * (ingData?.price_per_unit || 0);
    recipeCosts[rid] = (recipeCosts[rid] || 0) + cost;
  }

  return data
    .filter((d: { recipe_id: string; price: number }) => recipeCosts[d.recipe_id] !== undefined)
    .map((d: { recipe_id: string; price: number }) => ({
      cost: recipeCosts[d.recipe_id] || 0,
      price: d.price,
    }));
}

function scoreFoodCost(rows: FoodCostRow[]): { score: number; metric: string; active: boolean } {
  if (rows.length === 0) return { score: 0, metric: 'No recipe cost data', active: false };

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPrice = rows.reduce((s, r) => s + r.price, 0);
  if (totalPrice === 0) return { score: 0, metric: 'No pricing data', active: false };

  const pct = (totalCost / totalPrice) * 100;
  let score: number;
  if (pct < 28) score = 100;
  else if (pct < 32) score = 75;
  else if (pct < 36) score = 50;
  else score = 25;

  return { score, metric: `Avg food cost: ${pct.toFixed(1)}%`, active: true };
}

// ---------------------------------------------------------------------------
// Sub-Score: Menu Completeness
// ---------------------------------------------------------------------------

type MenuRow = { recipe_id: string | null; allergens: unknown; image_url: string | null; description: string | null };

async function fetchMenuData(admin: any, restaurantId: string): Promise<MenuRow[]> {
  const { data } = await admin
    .from('menu_items')
    .select('recipe_id, allergens, image_url, description')
    .eq('restaurant_id', restaurantId);
  return (data || []) as MenuRow[];
}

function scoreMenuCompleteness(rows: MenuRow[]): { score: number; metric: string; active: boolean } {
  if (rows.length === 0) return { score: 0, metric: 'No menu items', active: false };

  let totalCompleteness = 0;
  for (const item of rows) {
    let fields = 0;
    if (item.recipe_id) fields++;
    if (item.allergens && (Array.isArray(item.allergens) ? item.allergens.length > 0 : true)) fields++;
    if (item.image_url) fields++;
    if (item.description && item.description.length > 10) fields++;
    totalCompleteness += (fields / 4) * 100;
  }

  const score = Math.round(totalCompleteness / rows.length);
  return { score, metric: `${rows.length} items, ${score}% complete`, active: true };
}

// ---------------------------------------------------------------------------
// Sub-Score: Prep Accuracy
// ---------------------------------------------------------------------------

type PrepRow = { predicted_portions: number; feedback_delta: number };

async function fetchPrepAccuracyData(admin: any, restaurantId: string): Promise<PrepRow[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from('prep_list_items')
    .select('predicted_portions, feedback_delta')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', thirtyDaysAgo)
    .not('feedback_delta', 'is', null);
  return (data || []) as PrepRow[];
}

function scorePrepAccuracy(rows: PrepRow[]): { score: number; metric: string; active: boolean } {
  if (rows.length === 0) return { score: 0, metric: 'No prep data (30d)', active: false };

  const avgError = rows.reduce((sum, r) => {
    const pct = r.predicted_portions > 0 ? Math.abs(r.feedback_delta) / r.predicted_portions : 0;
    return sum + pct;
  }, 0) / rows.length;

  const pct = avgError * 100;
  let score: number;
  if (pct < 5) score = 100;
  else if (pct < 15) score = 75;
  else if (pct < 25) score = 50;
  else score = 25;

  return { score, metric: `Avg deviation: ${pct.toFixed(1)}%`, active: true };
}

// ---------------------------------------------------------------------------
// Sub-Score: Variance (Spoilage/Waste)
// ---------------------------------------------------------------------------

type VarianceData = { spoilageCost: number; totalIngredientCost: number };

async function fetchVarianceData(admin: any, restaurantId: string): Promise<VarianceData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: spoilage } = await admin
    .from('spoilage_reports')
    .select('quantity, ingredient:ingredients(price_per_unit)')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', thirtyDaysAgo);

  let spoilageCost = 0;
  for (const s of (spoilage || [])) {
    const ing = s.ingredient as { price_per_unit?: number } | null;
    spoilageCost += (s.quantity || 0) * (ing?.price_per_unit || 0);
  }

  const { data: ingredients } = await admin
    .from('ingredients')
    .select('quantity_in_stock, price_per_unit')
    .eq('restaurant_id', restaurantId);

  const totalIngredientCost = (ingredients || []).reduce(
    (sum: number, i: { quantity_in_stock?: number; price_per_unit?: number }) =>
      sum + (i.quantity_in_stock || 0) * (i.price_per_unit || 0),
    0
  );

  return { spoilageCost, totalIngredientCost };
}

function scoreVariance(data: VarianceData): { score: number; metric: string; active: boolean } {
  if (data.totalIngredientCost === 0) return { score: 0, metric: 'No ingredient data', active: false };

  const pct = (data.spoilageCost / data.totalIngredientCost) * 100;
  let score: number;
  if (pct < 2) score = 100;
  else if (pct < 5) score = 75;
  else if (pct < 8) score = 50;
  else score = 25;

  return { score, metric: `Waste: ${pct.toFixed(1)}% of inventory`, active: true };
}

// ---------------------------------------------------------------------------
// Sub-Score: Team Engagement
// ---------------------------------------------------------------------------

type EngagementData = { entriesPerWeek: number; corrActionRate: number };

async function fetchTeamEngagementData(admin: any, restaurantId: string): Promise<EngagementData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [logbook, actions] = await Promise.all([
    admin
      .from('smartlogbook_entries')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .gte('created_at', thirtyDaysAgo),
    admin
      .from('corrective_actions')
      .select('status')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', thirtyDaysAgo),
  ]);

  const entriesPerWeek = ((logbook.count || 0) / 4.3);
  const allActions = actions.data || [];
  const completed = allActions.filter((a: { status: string }) => a.status === 'completed').length;
  const corrActionRate = allActions.length > 0 ? completed / allActions.length : 0;

  return { entriesPerWeek, corrActionRate };
}

function scoreTeamEngagement(data: EngagementData): { score: number; metric: string; active: boolean } {
  if (data.entriesPerWeek === 0 && data.corrActionRate === 0) {
    return { score: 0, metric: 'No logbook or actions', active: false };
  }

  // Logbook: 7+/week = great
  let logScore = 0;
  if (data.entriesPerWeek >= 7) logScore = 100;
  else if (data.entriesPerWeek >= 3) logScore = 70;
  else if (data.entriesPerWeek > 0) logScore = 40;

  // Corrective action completion rate
  const actionScore = Math.round(data.corrActionRate * 100);

  const score = Math.round(logScore * 0.5 + actionScore * 0.5);
  return {
    score,
    metric: `${data.entriesPerWeek.toFixed(1)} entries/wk, ${Math.round(data.corrActionRate * 100)}% actions done`,
    active: true,
  };
}

// ---------------------------------------------------------------------------
// Sub-Score: Reservations
// ---------------------------------------------------------------------------

type ReservationData = { total: number; noShows: number };

async function fetchReservationData(admin: any, restaurantId: string): Promise<ReservationData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from('reservations')
    .select('status')
    .eq('restaurant_id', restaurantId)
    .gte('date', thirtyDaysAgo);

  const all = data || [];
  return {
    total: all.length,
    noShows: all.filter((r: { status: string }) => r.status === 'no_show').length,
  };
}

function scoreReservations(data: ReservationData): { score: number; metric: string; active: boolean } {
  if (data.total === 0) return { score: 0, metric: 'No reservations', active: false };

  const noShowRate = (data.noShows / data.total) * 100;
  let score: number;
  if (noShowRate < 5) score = 100;
  else if (noShowRate < 10) score = 75;
  else if (noShowRate < 20) score = 50;
  else score = 25;

  return { score, metric: `No-show rate: ${noShowRate.toFixed(1)}%`, active: true };
}

// ---------------------------------------------------------------------------
// Recommendations Generator
// ---------------------------------------------------------------------------

function generateRecommendations(subScores: Record<SubScoreKey, SubScoreDetail>): Recommendation[] {
  const sorted = Object.entries(subScores)
    .filter(([, v]) => v.active)
    .sort(([, a], [, b]) => a.score - b.score);

  const recommendations: Recommendation[] = [];

  for (const [key, detail] of sorted.slice(0, 3)) {
    const category = key as SubScoreKey;
    const impact: Recommendation['impact'] = detail.score < 40 ? 'high' : detail.score < 70 ? 'medium' : 'low';
    const rec = RECOMMENDATION_TEMPLATES[category];
    if (rec) {
      recommendations.push({
        category,
        impact,
        title: rec.title,
        description: detail.score < 40 ? rec.critical : detail.score < 70 ? rec.warning : rec.healthy,
      });
    }
  }

  return recommendations;
}

const RECOMMENDATION_TEMPLATES: Record<SubScoreKey, { title: string; critical: string; warning: string; healthy: string }> = {
  food_cost: {
    title: 'Optimize Food Costs',
    critical: 'Your food cost is above 36%. Review your highest-cost recipes and negotiate supplier pricing. Consider portion adjustments.',
    warning: 'Food cost is between 28-36%. Focus on the top 5 highest-cost items and explore alternative ingredients.',
    healthy: 'Food costs are well controlled. Keep monitoring seasonal ingredient price changes.',
  },
  menu_completeness: {
    title: 'Complete Your Menu',
    critical: 'Most menu items are missing key info. Add recipes, allergens, images, and descriptions to improve guest experience.',
    warning: 'Some menu items lack complete information. Focus on adding allergen data and photos.',
    healthy: 'Menu is well-documented. Keep updating photos and seasonal descriptions.',
  },
  prep_accuracy: {
    title: 'Improve Prep Accuracy',
    critical: 'Prep predictions are off by more than 25%. Review historical sales data and adjust prep multipliers.',
    warning: 'Prep accuracy has room for improvement. Calibrate predictions weekly using feedback data.',
    healthy: 'Prep accuracy is excellent. Your predictions are within 5% of actual needs.',
  },
  variance: {
    title: 'Reduce Waste',
    critical: 'Waste exceeds 8% of inventory value. Implement FIFO strictly, review over-ordering patterns, and track spoilage by category.',
    warning: 'Waste is between 2-8%. Focus on the top 3 most-wasted ingredients and adjust order quantities.',
    healthy: 'Waste is minimal. Maintain current inventory practices.',
  },
  team_engagement: {
    title: 'Boost Team Engagement',
    critical: 'Low logbook activity and incomplete corrective actions. Encourage daily log entries and assign action ownership.',
    warning: 'Team engagement is moderate. Set weekly logbook targets and review corrective actions in team meetings.',
    healthy: 'Strong team engagement. Keep the momentum with recognition and feedback.',
  },
  reservations: {
    title: 'Reduce No-Shows',
    critical: 'No-show rate exceeds 20%. Implement SMS confirmations, consider deposits, and analyze peak no-show times.',
    warning: 'No-show rate is between 5-20%. Send reminder messages and consider an overbooking strategy for high-risk slots.',
    healthy: 'No-show rate is excellent. Current reservation management is effective.',
  },
  visibility: {
    title: 'Improve Online Visibility',
    critical: 'Low visibility score. Complete your Google Business Profile, respond to reviews, and add quality photos.',
    warning: 'Visibility can be improved. Focus on getting more reviews and updating your business information.',
    healthy: 'Strong online presence. Keep responding to reviews and posting updates.',
  },
};

// ---------------------------------------------------------------------------
// Persist Score
// ---------------------------------------------------------------------------

export async function persistHealthScore(restaurantId: string, result: HealthScoreResult): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = supabaseAdmin();

  // Upsert main score
  await admin.from('restaurant_health_scores').upsert({
    restaurant_id: restaurantId,
    total_score: result.totalScore,
    grade: result.grade,
    confidence: result.confidence,
    food_cost_score: result.subScores.food_cost.score,
    menu_completeness_score: result.subScores.menu_completeness.score,
    prep_accuracy_score: result.subScores.prep_accuracy.score,
    variance_score: result.subScores.variance.score,
    team_engagement_score: result.subScores.team_engagement.score,
    reservation_score: result.subScores.reservations.score,
    visibility_score: result.subScores.visibility.score,
    sub_score_details: result.subScores,
    recommendations: result.recommendations,
    google_place_id: result.googlePlaceId,
    google_rating: result.googleRating,
    google_review_count: result.googleReviewCount,
    google_photos_count: result.googlePhotosCount,
    competitor_data: result.competitorData,
    review_sentiment: result.reviewSentiment || {},
    bayesian_mu: result.bayesianMu,
    bayesian_sigma: result.bayesianSigma,
    trend_forecast: result.forecast,
    active_modules: result.activeModules,
    calculated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'restaurant_id' });

  // Append history snapshot
  await admin.from('health_score_history').insert({
    restaurant_id: restaurantId,
    total_score: result.totalScore,
    food_cost_score: result.subScores.food_cost.score,
    menu_completeness_score: result.subScores.menu_completeness.score,
    prep_accuracy_score: result.subScores.prep_accuracy.score,
    variance_score: result.subScores.variance.score,
    team_engagement_score: result.subScores.team_engagement.score,
    reservation_score: result.subScores.reservations.score,
    visibility_score: result.subScores.visibility.score,
  });
}

// ---------------------------------------------------------------------------
// Grade Helpers (for UI)
// ---------------------------------------------------------------------------

export function getGradeColor(grade: HealthGrade): string {
  const colors: Record<HealthGrade, string> = {
    A: 'text-emerald-500',
    B: 'text-cyan-500',
    C: 'text-amber-500',
    D: 'text-orange-500',
    F: 'text-red-500',
  };
  return colors[grade];
}

export function getGradeBgColor(grade: HealthGrade): string {
  const colors: Record<HealthGrade, string> = {
    A: 'bg-emerald-500',
    B: 'bg-cyan-500',
    C: 'bg-amber-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  };
  return colors[grade];
}

export function getGradeLabel(grade: HealthGrade): string {
  const labels: Record<HealthGrade, string> = {
    A: 'Excellent',
    B: 'Good',
    C: 'Average',
    D: 'Below Average',
    F: 'Critical',
  };
  return labels[grade];
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence > 0.8) return 'High Confidence';
  if (confidence > 0.5) return 'Growing';
  return 'Building...';
}
