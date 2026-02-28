// Rive — Freemium Quotas Configuration

export type MetricName =
  | 'logbook_notes'
  | 'corrective_actions'
  | 'translations'
  | 'menu_engineering'
  | 'instagram_posts'
  | 'receipt_scans';

// Freemium quotas: enough to keep users engaged, encourages upgrade
export const FREEMIUM_QUOTAS: Record<MetricName, number> = {
  logbook_notes: 20,       // ~5 par semaine, suffisant pour garder l'habitude
  corrective_actions: 5,
  translations: 5,
  menu_engineering: 0,     // Réservé aux tiers payants
  instagram_posts: 0,      // Réservé aux tiers payants
  receipt_scans: 0         // Réservé aux tiers payants
};

// Legacy alias — kept for backward compatibility with existing imports
export const FREE_QUOTAS = FREEMIUM_QUOTAS;

export function hasReachedQuota(
  usage: Record<string, number> | undefined | null,
  metric: MetricName,
  isFreemium: boolean
): boolean {
  // Paid subscribers have no quota limits
  if (!isFreemium) return false;

  const currentUsage = usage?.[metric] || 0;
  return currentUsage >= FREEMIUM_QUOTAS[metric];
}
