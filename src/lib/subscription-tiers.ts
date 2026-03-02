// Rive — Subscription Tier Configuration
// Maps each tier to the modules it includes

export type SubscriptionTier = 'free' | 'essence' | 'performance' | 'intelligence';

export type TierModules = {
  module_logbook: boolean;
  module_menu_editor: boolean;
  module_food_cost: boolean;
  module_menu_engineering: boolean;
  module_instagram: boolean;
  module_receipt_scanner: boolean;
  module_reservations: boolean;
  module_smart_prep: boolean;
  // Nouvelles fonctionnalités Bar/Brasserie
  module_deposits: boolean;
  module_variance: boolean;
  module_production: boolean;
};

export const TIER_CONFIG: Record<SubscriptionTier, { label: string; modules: TierModules }> = {
  free: {
    label: 'Gratuit',
    modules: {
      module_logbook: true,        // Carnet de bord (avec quotas)
      module_menu_editor: true,     // Éditeur de recettes (accès de base)
      module_food_cost: false,
      module_menu_engineering: true, // Accès limité par quota
      module_instagram: true,        // Accès limité par quota
      module_receipt_scanner: true,  // Accès limité par quota
      module_reservations: false,
      module_smart_prep: false,
      module_deposits: false,
      module_variance: false,
      module_production: false,
    },
  },
  essence: {
    label: 'Essence',
    modules: {
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: false,
      module_menu_engineering: false,
      module_instagram: false,
      module_receipt_scanner: false,
      module_reservations: false,
      module_smart_prep: false,
      module_deposits: false,
      module_variance: false,
      module_production: false,
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
      module_deposits: false,
      module_variance: false,
      module_production: false,
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
      module_deposits: true,
      module_variance: true,
      module_production: true,
    },
  },
};

/**
 * Given raw settings from the database, compute the effective module access.
 * Intersects the tier's allowed modules with the user's manual toggles.
 */
export function computeEffectiveModules(
  dbSettings: TierModules & { subscription_tier?: string }
): { modules: TierModules; tier: SubscriptionTier } {
  const rawTier = (dbSettings.subscription_tier || 'free') as string;

  // Legacy: treat any unknown tier (including old 'trial') as free
  const effectiveTier: SubscriptionTier = (rawTier in TIER_CONFIG) ? rawTier as SubscriptionTier : 'free';

  const tierModules = TIER_CONFIG[effectiveTier].modules;

  // Intersect: a module is active only if BOTH the tier allows it AND the user hasn't manually disabled it
  const modules: TierModules = {
    module_logbook: tierModules.module_logbook && (dbSettings.module_logbook ?? true),
    module_menu_editor: tierModules.module_menu_editor && (dbSettings.module_menu_editor ?? true),
    module_food_cost: tierModules.module_food_cost && dbSettings.module_food_cost,
    module_menu_engineering: tierModules.module_menu_engineering && (dbSettings.module_menu_engineering ?? true),
    module_instagram: tierModules.module_instagram && (dbSettings.module_instagram ?? true),
    module_receipt_scanner: tierModules.module_receipt_scanner && (dbSettings.module_receipt_scanner ?? true),
    module_reservations: tierModules.module_reservations && (dbSettings.module_reservations ?? true),
    module_smart_prep: tierModules.module_smart_prep && (dbSettings.module_smart_prep ?? true),
    module_deposits: tierModules.module_deposits && (dbSettings.module_deposits ?? true),
    module_variance: tierModules.module_variance && (dbSettings.module_variance ?? true),
    module_production: tierModules.module_production && (dbSettings.module_production ?? true),
  };

  return { modules, tier: effectiveTier };
}

