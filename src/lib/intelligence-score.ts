// =============================================================================
// Intelligence Score — Goal Gradient Engine
//
// Calculates a restaurant's "intelligence level" based on connected data sources
// and calibration activity. This score drives the <IntelligenceGauge> component
// and contextualizes nudges throughout the app.
// =============================================================================

export type IntelligenceLevel = 'discovery' | 'operational' | 'predictive' | 'calibrated' | 'expert';

export type IntelligenceScoreData = {
  libroConnected: boolean;
  posConnected: boolean;
  recipesEntered: number;
  feedbackDays: number;
  feedbackStreak: number;
};

export type IntelligenceScoreResult = {
  score: number;
  level: IntelligenceLevel;
  nextMilestone: string;
  nextMilestoneScore: number;
};

const LEVELS: Array<{ min: number; level: IntelligenceLevel; label: string }> = [
  { min: 95, level: 'expert', label: 'Expert' },
  { min: 80, level: 'calibrated', label: 'Calibré' },
  { min: 65, level: 'predictive', label: 'Prédictif' },
  { min: 40, level: 'operational', label: 'Opérationnel' },
  { min: 0, level: 'discovery', label: 'Découverte' },
];

export function calculateIntelligenceScore(data: IntelligenceScoreData): IntelligenceScoreResult {
  let rawScore = 0;

  // Libro connected: +40 points (biggest early jump)
  if (data.libroConnected) rawScore += 40;

  // POS connected: +25 points
  if (data.posConnected) rawScore += 25;

  // Recipes entered (>= 5): +15 points
  if (data.recipesEntered >= 5) rawScore += 15;
  else if (data.recipesEntered > 0) rawScore += Math.round((data.recipesEntered / 5) * 15);

  // 7+ days of feedback: +10 points
  if (data.feedbackDays >= 7) rawScore += 10;
  else if (data.feedbackDays > 0) rawScore += Math.round((data.feedbackDays / 7) * 10);

  // 4+ weeks consecutive streak: +5 points
  if (data.feedbackStreak >= 28) rawScore += 5;
  else if (data.feedbackStreak >= 7) rawScore += Math.round(((data.feedbackStreak - 7) / 21) * 5);

  // Asymptotic cap — never reach 100%
  const score = Math.min(98, rawScore);

  // Determine level
  const levelConfig = LEVELS.find(l => score >= l.min) || LEVELS[LEVELS.length - 1];

  // Next milestone
  let nextMilestone = 'Vous êtes au maximum !';
  let nextMilestoneScore = 100;

  if (score < 40) {
    nextMilestone = data.libroConnected
      ? 'Connectez votre POS pour passer à Opérationnel'
      : 'Connectez vos réservations pour démarrer';
    nextMilestoneScore = 40;
  } else if (score < 65) {
    nextMilestone = data.posConnected
      ? 'Ajoutez 5 recettes pour passer à Prédictif'
      : 'Connectez votre POS pour des prédictions par item';
    nextMilestoneScore = 65;
  } else if (score < 80) {
    nextMilestone = 'Donnez 7 jours de feedback pour passer à Calibré';
    nextMilestoneScore = 80;
  } else if (score < 95) {
    nextMilestone = '4 semaines de feedback consécutif pour atteindre Expert';
    nextMilestoneScore = 95;
  }

  return { score, level: levelConfig.level, nextMilestone, nextMilestoneScore };
}

export function getLevelLabel(level: IntelligenceLevel): string {
  const labels: Record<IntelligenceLevel, string> = {
    discovery: 'Découverte',
    operational: 'Opérationnel',
    predictive: 'Prédictif',
    calibrated: 'Calibré',
    expert: 'Expert',
  };
  return labels[level];
}

export function getLevelColor(level: IntelligenceLevel): string {
  const colors: Record<IntelligenceLevel, string> = {
    discovery: 'text-slate-400',
    operational: 'text-blue-500',
    predictive: 'text-amber-500',
    calibrated: 'text-emerald-500',
    expert: 'text-[#CC5833]',
  };
  return colors[level];
}

export function getLevelBgColor(level: IntelligenceLevel): string {
  const colors: Record<IntelligenceLevel, string> = {
    discovery: 'bg-slate-500',
    operational: 'bg-blue-500',
    predictive: 'bg-amber-500',
    calibrated: 'bg-emerald-500',
    expert: 'bg-[#CC5833]',
  };
  return colors[level];
}
