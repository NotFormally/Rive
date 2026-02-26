// Rive — Subscription Tier Configuration
// Maps each tier to the modules it includes

export type SubscriptionTier = 'trial' | 'essential' | 'performance' | 'intelligence' | 'enterprise';

export type TierModules = {
  module_logbook: boolean;
  module_menu_editor: boolean;
  module_food_cost: boolean;
  module_menu_engineering: boolean;
  module_instagram: boolean;
  module_receipt_scanner: boolean;
  module_reservations: boolean;
  module_smart_prep: boolean;
};

export const TIER_CONFIG: Record<SubscriptionTier, { label: string; modules: TierModules }> = {
  trial: {
    label: 'Essai gratuit',
    modules: {
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: true,
      module_menu_engineering: true,
      module_instagram: true,
      module_receipt_scanner: true,
      module_reservations: true,  // Full access during trial
      module_smart_prep: true,    // Smart Prep available during trial (degrades gracefully by data level)
    },
  },
  essential: {
    label: 'Essentiel',
    modules: {
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: false,
      module_menu_engineering: false,
      module_instagram: false,
      module_receipt_scanner: false,
      module_reservations: false,
      module_smart_prep: false,
    },
  },
  performance: {
    label: 'Performance',
    modules: {
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: true,
      module_menu_engineering: true,
      module_instagram: true,
      module_receipt_scanner: false,
      module_reservations: false,
      module_smart_prep: false,
    },
  },
  intelligence: {
    label: 'Intelligence',
    modules: {
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: true,
      module_menu_engineering: true,
      module_instagram: true,
      module_receipt_scanner: true,
      module_reservations: true,   // ✅ Tier 3: Libro, Resy, Zenchef
      module_smart_prep: true,     // ✅ Smart Prep Lists (data-level degradation, not tier-gated)
    },
  },
  enterprise: {
    label: 'Entreprise',
    modules: {
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: true,
      module_menu_engineering: true,
      module_instagram: true,
      module_receipt_scanner: true,
      module_reservations: true,
      module_smart_prep: true,
    },
  },
};

/**
 * Given raw settings from the database, compute the effective module access.
 * If the trial has expired and no paid tier is active, restrict to essential.
 */
export function computeEffectiveModules(
  dbSettings: TierModules & { subscription_tier?: SubscriptionTier; trial_ends_at?: string }
): { modules: TierModules; tier: SubscriptionTier; trialExpired: boolean; daysLeft: number } {
  const tier = (dbSettings.subscription_tier || 'trial') as SubscriptionTier;
  const trialEndsAt = dbSettings.trial_ends_at ? new Date(dbSettings.trial_ends_at) : null;
  const now = new Date();

  const trialExpired = tier === 'trial' && trialEndsAt ? now > trialEndsAt : false;
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  // If trial expired, enforce essential tier
  const effectiveTier = trialExpired ? 'essential' : tier;
  const tierModules = TIER_CONFIG[effectiveTier].modules;

  // Intersect: a module is active only if BOTH the tier allows it AND the user hasn't manually disabled it
  const modules: TierModules = {
    module_logbook: tierModules.module_logbook && dbSettings.module_logbook,
    module_menu_editor: tierModules.module_menu_editor && dbSettings.module_menu_editor,
    module_food_cost: tierModules.module_food_cost && dbSettings.module_food_cost,
    module_menu_engineering: tierModules.module_menu_engineering && dbSettings.module_menu_engineering,
    module_instagram: tierModules.module_instagram && dbSettings.module_instagram,
    module_receipt_scanner: tierModules.module_receipt_scanner && dbSettings.module_receipt_scanner,
    module_reservations: tierModules.module_reservations && (dbSettings.module_reservations ?? true),
    module_smart_prep: tierModules.module_smart_prep && (dbSettings.module_smart_prep ?? true),
  };

  return { modules, tier: effectiveTier, trialExpired, daysLeft };
}

