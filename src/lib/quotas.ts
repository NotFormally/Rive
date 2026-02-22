// Rive — Freemium Active Quotas Configuration

export type MetricName = 
  | 'logbook_notes'
  | 'corrective_actions'
  | 'translations'
  | 'menu_engineering'
  | 'instagram_posts'
  | 'receipt_scans';

export const FREE_QUOTAS: Record<MetricName, number> = {
  logbook_notes: 150,
  corrective_actions: 40,
  translations: 30,
  menu_engineering: 2,
  instagram_posts: 20,
  receipt_scans: 10
};

export function hasReachedQuota(
  usage: Record<string, number> | undefined | null, 
  metric: MetricName, 
  isTrial: boolean
): boolean {
  // If not in trial (meaning they are paying), there's no quota limit
  if (!isTrial) return false;
  
  const currentUsage = usage?.[metric] || 0;
  return currentUsage >= FREE_QUOTAS[metric];
}
