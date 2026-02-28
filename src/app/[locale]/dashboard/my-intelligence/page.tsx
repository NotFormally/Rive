"use client";

import { useAuth } from "@/components/AuthProvider";
import {
  getLevelLabel,
  getLevelColor,
  getLevelBgColor,
  type IntelligenceLevel,
} from "@/lib/intelligence-score";
import {
  Brain,
  Gauge,
  MessageSquare,
  Target,
  CalendarDays,
  Flame,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// =============================================================================
// Milestone config
// =============================================================================

const MILESTONES: Array<{
  threshold: number;
  level: IntelligenceLevel;
  label: string;
  description: string;
}> = [
  { threshold: 0, level: "discovery", label: "Découverte", description: "Première connexion — bienvenue." },
  { threshold: 40, level: "operational", label: "Opérationnel", description: "Réservations connectées, prédictions de couverts actives." },
  { threshold: 65, level: "predictive", label: "Prédictif", description: "POS branché — prédictions par item débloquées." },
  { threshold: 80, level: "calibrated", label: "Calibré", description: "7+ jours de feedback — le système s'adapte à votre réalité." },
  { threshold: 95, level: "expert", label: "Expert", description: "4 semaines consécutives — précision maximale atteinte." },
];

// =============================================================================
// My Intelligence Page
// =============================================================================

export default function MyIntelligencePage() {
  const { intelligenceScore, intelligenceLevel } = useAuth();

  const score = intelligenceScore ?? 0;
  const level = intelligenceLevel ?? ("discovery" as IntelligenceLevel);
  const levelLabel = getLevelLabel(level);
  const levelColor = getLevelColor(level);
  const levelBgColor = getLevelBgColor(level);

  // Find current milestone index
  const currentMilestoneIdx = MILESTONES.findIndex(
    (m, i) => i === MILESTONES.length - 1 || score < MILESTONES[i + 1].threshold
  );

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-jakarta font-bold text-foreground flex items-center gap-3">
          <Gauge className="w-7 h-7 text-[#CC5833]" />
          Mon Intelligence
        </h1>
        <p className="font-outfit text-muted-foreground mt-1">
          Votre système apprend de chaque donnée que vous connectez et chaque feedback que vous donnez.
        </p>
      </div>

      {/* Score Card */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6 pb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular Score Display */}
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-secondary/50"
                />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${(score / 100) * 327} 327`}
                  strokeLinecap="round"
                  className={levelColor}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-plex-mono text-3xl font-bold text-foreground">{score}%</span>
                <span className={`text-xs font-outfit font-medium ${levelColor}`}>{levelLabel}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-jakarta font-bold text-foreground mb-1">
                Niveau : {levelLabel}
              </h2>
              <p className="text-sm font-outfit text-muted-foreground mb-4">
                {MILESTONES[currentMilestoneIdx]?.description}
              </p>
              <p className="text-xs font-plex-mono uppercase tracking-widest text-muted-foreground/60">
                C&apos;est votre intelligence, pas la nôtre.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progression Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Parcours d&apos;intelligence
        </h3>
        <div className="space-y-1">
          {MILESTONES.map((milestone, i) => {
            const isReached = score >= milestone.threshold;
            const isCurrent = i === currentMilestoneIdx;
            const mlevelColor = getLevelColor(milestone.level);
            const mlevelBg = getLevelBgColor(milestone.level);

            return (
              <div
                key={milestone.level}
                className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${
                  isCurrent
                    ? "bg-card border border-border shadow-sm"
                    : isReached
                    ? "opacity-60"
                    : "opacity-30"
                }`}
              >
                {/* Dot */}
                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${isReached ? mlevelBg : "bg-secondary"}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-outfit font-semibold ${isReached ? mlevelColor : "text-muted-foreground"}`}>
                      {milestone.threshold}% — {milestone.label}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-[#CC5833]/10 text-[#CC5833] text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Vous êtes ici
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-outfit">{milestone.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data sources overview */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4" /> Sources de données
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><CalendarDays className="w-4 h-4 text-blue-600" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Réservations</p>
                <p className="text-xs text-muted-foreground">+40 points</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg"><Target className="w-4 h-4 text-emerald-600" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">POS</p>
                <p className="text-xs text-muted-foreground">+25 points</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg"><Brain className="w-4 h-4 text-amber-600" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Recettes</p>
                <p className="text-xs text-muted-foreground">+15 points (5+ recettes)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg"><MessageSquare className="w-4 h-4 text-purple-600" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Feedback quotidien</p>
                <p className="text-xs text-muted-foreground">+10 points (7+ jours)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg"><Flame className="w-4 h-4 text-red-600" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Série de calibration</p>
                <p className="text-xs text-muted-foreground">+5 points (4 semaines consécutives)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
