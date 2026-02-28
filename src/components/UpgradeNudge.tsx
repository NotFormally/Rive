"use client";

import { AlertTriangle } from "lucide-react";

type UpgradeNudgeProps = {
  currentLevel: 1 | 2 | 3;
  averageCovers?: number;
  averageTicket?: number;
};

const NUDGE_MESSAGES: Record<1 | 2, string> = {
  1: "Sans donn\u00e9es POS, marge d\u2019erreur ~35%. Avec votre POS \u2192 ~12%.",
  2: "Sans recettes, pas de pr\u00e9diction d\u2019ingr\u00e9dients. Ajoutez 5 recettes pour le Niveau\u00a03.",
};

function calculateWeeklyGap(
  level: 1 | 2,
  covers: number,
  ticket: number,
): number {
  const foodCostRatio = 0.35;
  // Error margin difference at each level
  const errorMargins: Record<1 | 2, { current: number; next: number }> = {
    1: { current: 0.35, next: 0.12 },
    2: { current: 0.12, next: 0.03 },
  };
  const { current, next } = errorMargins[level];
  return covers * ticket * foodCostRatio * (current - next);
}

export function UpgradeNudge({
  currentLevel,
  averageCovers,
  averageTicket,
}: UpgradeNudgeProps) {
  // Don't render at max level
  if (currentLevel === 3) return null;

  const message = NUDGE_MESSAGES[currentLevel];
  const hasEstimate =
    averageCovers !== undefined && averageTicket !== undefined;
  const weeklyGap = hasEstimate
    ? calculateWeeklyGap(currentLevel, averageCovers!, averageTicket!)
    : null;

  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-outfit text-sm text-amber-900">{message}</p>
          {weeklyGap !== null && (
            <p className="font-outfit text-xs text-amber-700">
              \u00c9cart estim\u00e9 :{" "}
              <span className="font-plex-mono font-semibold tabular-nums">
                ~{Math.round(weeklyGap)}$
              </span>
              /semaine
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
