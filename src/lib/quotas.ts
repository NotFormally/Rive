// Rive — Per-Tier Quota Configuration
//
// La Traversée quota model:
//   Free users get generous sampling of all accessible modules.
//   Paid tiers progressively raise or remove limits.
//   -1 = unlimited (no quota)
//    0 = not available at this tier (module gated)

import type { SubscriptionTier } from './subscription-tiers';

export type MetricName =
  // Core operations (La Passerelle)
  | 'logbook_notes'
  | 'corrective_actions'
  | 'translations'
  // Menu & Social (La Carte / Le Pavillon)
  | 'menu_engineering'
  | 'instagram_posts'
  // Provisions (La Réserve)
  | 'receipt_scans'
  | 'food_cost_reports'
  // Bar & Brasserie
  | 'deposit_entries'
  | 'variance_reports'
  | 'production_batches'
  // Predictive (Le Quart)
  | 'smart_prep_generations'
  | 'reservation_syncs';

/**
 * Per-tier quotas for all tracked metrics.
 * -1 = unlimited, 0 = module not available at this tier.
 */
export const TIER_QUOTAS: Record<SubscriptionTier, Record<MetricName, number>> = {
  free: {
    // Core — generous sampling
    logbook_notes: 50,             // ~12/week, enough to build the habit
    corrective_actions: 15,        // 3-4/week for compliance sampling
    translations: 20,              // enough to appreciate multilingual value
    // Menu & Social
    menu_engineering: 3,           // 3 analyses to see BCG matrix value
    instagram_posts: 10,           // ~2/week, enough for a full cycle
    // Provisions
    receipt_scans: 10,             // enough to see OCR accuracy
    food_cost_reports: 5,          // enough to understand margin tracking
    // Bar & Brasserie (module gated — 0 means not available)
    deposit_entries: 0,            // ❌ Essence+ only
    variance_reports: 0,           // ❌ Performance+ only
    production_batches: 0,         // ❌ Performance+ only
    // Predictive (module gated)
    smart_prep_generations: 0,     // ❌ Intelligence only
    reservation_syncs: 0,          // ❌ Performance+ only
  },

  essence: {
    // Core — unlimited daily operations
    logbook_notes: -1,
    corrective_actions: -1,
    translations: -1,
    // Menu & Social — generous
    menu_engineering: 10,          // 10 analyses/month
    instagram_posts: -1,
    // Provisions — generous
    receipt_scans: 50,
    food_cost_reports: 30,
    // Bar & Brasserie — deposits unlocked
    deposit_entries: -1,           // ✅ Unlimited
    variance_reports: 0,           // ❌ Performance+ only
    production_batches: 0,         // ❌ Performance+ only
    // Predictive (module gated)
    smart_prep_generations: 0,     // ❌ Intelligence only
    reservation_syncs: 0,          // ❌ Performance+ only
  },

  performance: {
    // Core — unlimited
    logbook_notes: -1,
    corrective_actions: -1,
    translations: -1,
    // Menu & Social — unlimited
    menu_engineering: -1,
    instagram_posts: -1,
    // Provisions — unlimited
    receipt_scans: -1,
    food_cost_reports: -1,
    // Bar & Brasserie — unlimited
    deposit_entries: -1,
    variance_reports: -1,
    production_batches: -1,
    // Predictive — module unlocked with limits
    smart_prep_generations: 0,     // ❌ Intelligence only
    reservation_syncs: -1,         // ✅ Unlimited
  },

  intelligence: {
    // Everything unlimited — Le Sonar has no limits
    logbook_notes: -1,
    corrective_actions: -1,
    translations: -1,
    menu_engineering: -1,
    instagram_posts: -1,
    receipt_scans: -1,
    food_cost_reports: -1,
    deposit_entries: -1,
    variance_reports: -1,
    production_batches: -1,
    smart_prep_generations: -1,
    reservation_syncs: -1,
  },
};

// Legacy alias — backward compatibility with existing free-only quota references
export const free_QUOTAS: Record<MetricName, number> = TIER_QUOTAS.free;
export const FREE_QUOTAS = free_QUOTAS;

/**
 * Check if a user has reached their quota for a given metric.
 *
 * Accepts either a SubscriptionTier string or a boolean (legacy: isFree).
 * - tier string: checks against that tier's quota
 * - true (isFree): checks against free tier quota
 * - false (isPaid): returns false (backward compat — treats as unlimited)
 */
export function hasReachedQuota(
  usage: Record<string, number> | undefined | null,
  metric: MetricName,
  tierOrIsFree: SubscriptionTier | boolean
): boolean {
  // Backward compatibility: boolean → tier mapping
  const tier: SubscriptionTier =
    typeof tierOrIsFree === 'boolean'
      ? (tierOrIsFree ? 'free' : 'intelligence')
      : tierOrIsFree;

  const quota = TIER_QUOTAS[tier]?.[metric] ?? -1;

  // Unlimited
  if (quota === -1) return false;

  // Not available at this tier (module gated)
  if (quota === 0) return true;

  const currentUsage = usage?.[metric] || 0;
  return currentUsage >= quota;
}

/**
 * Get remaining quota for a metric at a given tier.
 * Returns -1 for unlimited, 0 for reached/unavailable.
 */
export function getRemainingQuota(
  usage: Record<string, number> | undefined | null,
  metric: MetricName,
  tier: SubscriptionTier
): number {
  const quota = TIER_QUOTAS[tier]?.[metric] ?? -1;
  if (quota === -1) return -1;
  if (quota === 0) return 0;
  const currentUsage = usage?.[metric] || 0;
  return Math.max(0, quota - currentUsage);
}

/**
 * Get the quota limit for a metric at a given tier.
 * Returns -1 for unlimited, 0 for not available.
 */
export function getQuotaLimit(
  metric: MetricName,
  tier: SubscriptionTier
): number {
  return TIER_QUOTAS[tier]?.[metric] ?? -1;
}
