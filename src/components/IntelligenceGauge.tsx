"use client";

import { useAuth } from "@/components/AuthProvider";
import {
  getLevelLabel,
  getLevelColor,
  getLevelBgColor,
  type IntelligenceLevel,
} from "@/lib/intelligence-score";
import { Brain } from "lucide-react";

// =============================================================================
// Milestone positions on the track (percent thresholds from intelligence-score)
// =============================================================================

const MILESTONES = [
  { position: 40, level: "operational" as IntelligenceLevel },
  { position: 65, level: "predictive" as IntelligenceLevel },
  { position: 80, level: "calibrated" as IntelligenceLevel },
  { position: 95, level: "expert" as IntelligenceLevel },
];

// Static hint text per level — gives the user a nudge toward the next tier
const NEXT_HINTS: Record<IntelligenceLevel, string> = {
  discovery: "Connectez vos réservations pour progresser",
  operational: "Ajoutez vos recettes pour passer à Prédictif",
  predictive: "Donnez du feedback quotidien pour passer à Calibré",
  calibrated: "4 semaines consécutives pour atteindre Expert",
  expert: "Score maximal atteint",
};

// =============================================================================
// IntelligenceGauge
// =============================================================================

export function IntelligenceGauge() {
  const { intelligenceScore, intelligenceLevel } = useAuth();

  // Nothing to render until the score is loaded
  if (intelligenceScore === null || intelligenceLevel === null) {
    return null;
  }

  const levelLabel = getLevelLabel(intelligenceLevel);
  const levelColor = getLevelColor(intelligenceLevel);
  const levelBgColor = getLevelBgColor(intelligenceLevel);
  const hint = NEXT_HINTS[intelligenceLevel];

  return (
    <div className="bg-card border-b border-border/50 px-4 sm:px-8 py-2">
      {/* ---------------------------------------------------------------- */}
      {/* Desktop layout (md+): full bar with label, percentage, and hint */}
      {/* ---------------------------------------------------------------- */}
      <div className="hidden md:flex items-center gap-4">
        {/* Level badge */}
        <div className="flex items-center gap-2 shrink-0">
          <Brain className={`h-4 w-4 ${levelColor}`} />
          <span className={`font-outfit text-sm font-medium ${levelColor}`}>
            {levelLabel}
          </span>
        </div>

        {/* Track */}
        <div className="relative flex-1 max-w-md">
          <div className="bg-secondary/50 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${levelBgColor}`}
              style={{ width: `${intelligenceScore}%` }}
            />
          </div>

          {/* Milestone dots */}
          {MILESTONES.map((m) => (
            <div
              key={m.position}
              className={`absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full border border-card ${
                intelligenceScore >= m.position
                  ? getLevelBgColor(m.level)
                  : "bg-secondary"
              }`}
              style={{ left: `${m.position}%` }}
              title={getLevelLabel(m.level)}
            />
          ))}
        </div>

        {/* Percentage */}
        <span className="font-plex-mono text-sm font-semibold text-foreground tabular-nums shrink-0">
          {intelligenceScore}%
        </span>

        {/* Next milestone hint */}
        {intelligenceLevel !== "expert" && (
          <span className="text-xs text-muted-foreground font-outfit truncate">
            {hint}
          </span>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile layout (<md): compact icon + percentage                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex md:hidden items-center gap-2">
        <Brain className={`h-4 w-4 ${levelColor}`} />
        <span className="font-plex-mono text-sm font-semibold text-foreground tabular-nums">
          {intelligenceScore}%
        </span>

        {/* Mini track */}
        <div className="relative flex-1">
          <div className="bg-secondary/50 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${levelBgColor}`}
              style={{ width: `${intelligenceScore}%` }}
            />
          </div>

          {/* Milestone dots (smaller on mobile) */}
          {MILESTONES.map((m) => (
            <div
              key={m.position}
              className={`absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full border border-card ${
                intelligenceScore >= m.position
                  ? getLevelBgColor(m.level)
                  : "bg-secondary"
              }`}
              style={{ left: `${m.position}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
