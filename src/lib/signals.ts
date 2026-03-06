/**
 * Notification Signal Taxonomy — La Traversée
 *
 * Ships communicate through a precise hierarchy of signals.
 * Rive's notifications follow the same grammar.
 */

export const SIGNAL_LEVELS = {
  /** Immediate action required — critical alert */
  MAYDAY: 'critical',
  /** Attention needed soon — warning */
  DETRESSE: 'warning',
  /** Informational, no action required — advisory */
  AVIS: 'advisory',
  /** Automated record — routine */
  JOURNAL_DE_QUART: 'routine',
} as const;

export type SignalLevel = (typeof SIGNAL_LEVELS)[keyof typeof SIGNAL_LEVELS];

export const SIGNAL_CONFIG: Record<SignalLevel, {
  label: string;
  labelFr: string;
  color: string;
  bg: string;
  icon: string;
}> = {
  critical: {
    label: 'Mayday',
    labelFr: 'Mayday',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: '🚨',
  },
  warning: {
    label: 'Distress Signal',
    labelFr: 'Pavillon de Détresse',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    icon: '⚠️',
  },
  advisory: {
    label: 'Notice to Mariners',
    labelFr: 'Avis aux Navigateurs',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    icon: 'ℹ️',
  },
  routine: {
    label: 'Watch Log',
    labelFr: 'Journal de Quart',
    color: 'text-slate-500',
    bg: 'bg-slate-50 border-slate-200',
    icon: '📋',
  },
};

/**
 * BCG Matrix — Navigation Allures
 *
 * Menu items classified by the wind they catch:
 * their popularity (volume) and profitability (margin).
 */
export const ALLURES = {
  /** Trade Wind — consistent, powerful performer */
  ALIZE: 'phare',
  /** Safe Anchorage — stable, secure earner */
  MOUILLAGE: 'ancre',
  /** Point of Sail — finding its angle to the wind */
  ALLURE: 'derive',
  /** Damage — taking on water */
  AVARIE: 'ecueil',
} as const;

export type Allure = (typeof ALLURES)[keyof typeof ALLURES];
