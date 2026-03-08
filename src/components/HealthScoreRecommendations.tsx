'use client';

import { Lightbulb, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Recommendation, SubScoreKey } from '@/lib/health-score';

type Props = {
  recommendations: Recommendation[];
};

const CATEGORY_ROUTES: Partial<Record<SubScoreKey, string>> = {
  food_cost: '/dashboard/recipes',
  menu_completeness: '/dashboard/menu',
  prep_accuracy: '/dashboard/prep-list',
  variance: '/dashboard/inventory',
  team_engagement: '/dashboard/logbook',
  reservations: '/dashboard/reservations',
  visibility: '/dashboard/health-score',
};

const IMPACT_COLORS = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function HealthScoreRecommendations({ recommendations }: Props) {
  const t = useTranslations('HealthScore');

  const CATEGORY_LABELS: Record<SubScoreKey, string> = {
    food_cost: t('cat_food_cost'),
    menu_completeness: t('cat_menu_completeness'),
    prep_accuracy: t('cat_prep_accuracy'),
    variance: t('cat_variance'),
    team_engagement: t('cat_team_engagement'),
    reservations: t('cat_reservations'),
    visibility: t('cat_visibility'),
  };

  const IMPACT_LABELS: Record<string, string> = {
    high: t('impact_high'),
    medium: t('impact_medium'),
    low: t('impact_low'),
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
        {t('no_recommendations')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/50 bg-card/50 p-4 hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${IMPACT_COLORS[rec.impact]}`}
                >
                  {IMPACT_LABELS[rec.impact] ?? rec.impact.toUpperCase()}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {CATEGORY_LABELS[rec.category]}
                </span>
              </div>
              <h4 className="text-sm font-semibold mb-1">{rec.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
            </div>
            {CATEGORY_ROUTES[rec.category] && (
              <a
                href={CATEGORY_ROUTES[rec.category]}
                className="flex-shrink-0 mt-1 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/5"
              >
                <ArrowUpRight className="w-4 h-4 text-primary" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
