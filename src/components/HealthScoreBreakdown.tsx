'use client';

import {
  UtensilsCrossed,
  BookOpen,
  Target,
  Trash2,
  Users,
  CalendarCheck,
  Globe,
} from 'lucide-react';
import type { SubScoreKey, SubScoreDetail } from '@/lib/health-score';

type Props = {
  subScores: Record<SubScoreKey, SubScoreDetail>;
};

const CATEGORY_CONFIG: Record<SubScoreKey, { label: string; icon: React.ElementType }> = {
  food_cost: { label: 'Food Cost', icon: UtensilsCrossed },
  menu_completeness: { label: 'Menu', icon: BookOpen },
  prep_accuracy: { label: 'Prep Accuracy', icon: Target },
  variance: { label: 'Waste', icon: Trash2 },
  team_engagement: { label: 'Team', icon: Users },
  reservations: { label: 'Reservations', icon: CalendarCheck },
  visibility: { label: 'Visibility', icon: Globe },
};

const STATUS_COLORS = {
  healthy: { bar: 'bg-emerald-500', badge: 'text-emerald-400 bg-emerald-500/10', label: 'Healthy' },
  warning: { bar: 'bg-amber-500', badge: 'text-amber-400 bg-amber-500/10', label: 'Warning' },
  critical: { bar: 'bg-red-500', badge: 'text-red-400 bg-red-500/10', label: 'Critical' },
};

export default function HealthScoreBreakdown({ subScores }: Props) {
  const entries = Object.entries(subScores) as [SubScoreKey, SubScoreDetail][];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {entries.map(([key, detail]) => {
        const config = CATEGORY_CONFIG[key];
        const status = STATUS_COLORS[detail.status];
        const Icon = config.icon;

        return (
          <div
            key={key}
            className={`rounded-xl border p-4 transition-all ${
              detail.active
                ? 'border-border/50 bg-card/50'
                : 'border-border/20 bg-card/20 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {config.label}
                </span>
              </div>
              {detail.active && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.badge}`}>
                  {status.label}
                </span>
              )}
            </div>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold">{detail.active ? detail.score : '—'}</span>
              <span className="text-xs text-muted-foreground mb-1">/100</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${status.bar}`}
                style={{ width: detail.active ? `${detail.score}%` : '0%' }}
              />
            </div>

            <p className="text-[11px] text-muted-foreground truncate">{detail.metric}</p>
          </div>
        );
      })}
    </div>
  );
}
