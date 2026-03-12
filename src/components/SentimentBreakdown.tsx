'use client';

import { useTranslations } from 'next-intl';
import type { AggregatedSentiment } from '@/lib/review-sentiment';

type Props = {
  sentiment: AggregatedSentiment;
};

const ASPECT_LABELS: Record<string, string> = {
  food: 'Food',
  service: 'Service',
  ambiance: 'Ambiance',
  value: 'Value',
};

export default function SentimentBreakdown({ sentiment }: Props) {
  const t = useTranslations('SentimentBreakdown');
  const { aspects, distribution, topPositive, topNegative, averageScore, reviewCount } = sentiment;

  if (reviewCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No review data available
      </div>
    );
  }

  const total = distribution.positive + distribution.neutral + distribution.negative;

  return (
    <div className="space-y-5">
      {/* Overall sentiment bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{t('overallSentiment')}</span>
          <span className={`text-sm font-semibold ${
            averageScore > 0.1 ? 'text-emerald-400' : averageScore < -0.1 ? 'text-red-400' : 'text-amber-400' // i18n-ignore
          }`}>
            {/* i18n-ignore */}
            {averageScore > 0.1 ? t('positive') : averageScore < -0.1 ? t('negative') : t('neutral')}
          </span>
        </div>
        {total > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            <div
              className="bg-emerald-500 rounded-l-full"
              style={{ width: `${(distribution.positive / total) * 100}%` }}
            />
            <div
              className="bg-amber-500"
              style={{ width: `${(distribution.neutral / total) * 100}%` }}
            />
            <div
              className="bg-red-500 rounded-r-full"
              style={{ width: `${(distribution.negative / total) * 100}%` }}
            />
          </div>
        )}
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>{distribution.positive} positive</span>
          <span>{distribution.neutral} neutral</span>
          <span>{distribution.negative} negative</span>
        </div>
      </div>

      {/* Aspect scores */}
      <div className="space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('byAspect')}</p>
        {(Object.entries(aspects) as [string, number | null][]).map(([key, score]) => {
          if (score === null) return null;
          const pct = ((score + 1) / 2) * 100; // -1..1 → 0..100
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">{ASPECT_LABELS[key] || key}</span>
                <span className={`text-xs font-mono ${
                  score > 0.1 ? 'text-emerald-400' : score < -0.1 ? 'text-red-400' : 'text-amber-400' // i18n-ignore
                }`}>
                  {score > 0 ? '+' : ''}{score.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    score > 0.1 ? 'bg-emerald-500' : score < -0.1 ? 'bg-red-500' : 'bg-amber-500' // i18n-ignore
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top keywords */}
      <div className="grid grid-cols-2 gap-4">
        {topPositive.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t('topPositive')}</p>
            <div className="flex flex-wrap gap-1">
              {topPositive.map((w) => (
                <span key={w} className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
        {topNegative.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t('topNegative')}</p>
            <div className="flex flex-wrap gap-1">
              {topNegative.map((w) => (
                <span key={w} className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
