// Rive — Subscription Tier Configuration
// Maps each tier to the modules it includes
//
// La Traversée — Progressive unlock model:
//   Free:         Core sampling with quotas (La Passerelle basics)
//   Essence:      Daily operations unlimited (Le Navire)
//   Performance:  + Financial intelligence (La Boussole)
//   Intelligence: + Predictive AI & integrations (Le Sonar)

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
  // Bar & Brasserie
  module_deposits: boolean;
  module_variance: boolean;
  module_production: boolean;
};

export const TIER_CONFIG: Record<SubscriptionTier, { label: string; labelFr: string; modules: TierModules }> = {
  free: {
    label: 'Free',
    labelFr: 'Gratuit',
    modules: {
      module_logbook: true,           // Le Journal de Quart — quota-limited
      module_menu_editor: true,       // La Carte — basic access
      module_food_cost: true,         // La Réserve — quota-limited
      module_menu_engineering: true,  // Les Allures — quota-limited
      module_instagram: true,         // Le Pavillon — quota-limited
      module_receipt_scanner: true,   // Les Provisions — quota-limited
      module_reservations: true,      // Le Mouillage — quota-limited (freemium)
      module_smart_prep: true,        // L'Appareillage — quota-limited (freemium)
      module_deposits: true,          // Le Lest — quota-limited (freemium)
      module_variance: true,          // Le Tirant d'Eau — quota-limited (freemium)
      module_production: true,        // Production — quota-limited (freemium)
    },
  },
  essence: {
    label: 'Essence',
    labelFr: 'Essence',
    modules: {
      module_logbook: true,           // ✅ Unlimited
      module_menu_editor: true,       // ✅ Full access
      module_food_cost: true,         // ✅ Higher quotas
      module_menu_engineering: true,  // ✅ Higher quotas
      module_instagram: true,         // ✅ Unlimited
      module_receipt_scanner: true,   // ✅ Higher quotas
      module_reservations: true,      // ✅ Le Mouillage — unlocked
      module_smart_prep: true,        // ✅ L'Appareillage — unlocked
      module_deposits: true,          // ✅ Le Lest — unlocked
      module_variance: true,          // ✅ Le Tirant d'Eau — unlocked
      module_production: true,        // ✅ Production — unlocked
    },
  },
  performance: {
    label: 'Performance',
    labelFr: 'Performance',
    modules: {
      module_logbook: true,           // ✅ Unlimited
      module_menu_editor: true,       // ✅ Full access
      module_food_cost: true,         // ✅ Unlimited
      module_menu_engineering: true,  // ✅ Unlimited
      module_instagram: true,         // ✅ Unlimited
      module_receipt_scanner: true,   // ✅ Unlimited
      module_reservations: true,      // ✅ Le Mouillage — unlocked
      module_smart_prep: true,        // ✅ L'Appareillage — unlocked
      module_deposits: true,          // ✅ Le Lest
      module_variance: true,          // ✅ Le Tirant d'Eau — unlocked
      module_production: true,        // ✅ Production — unlocked
    },
  },
  intelligence: {
    label: 'Intelligence',
    labelFr: 'Intelligence',
    modules: {
      module_logbook: true,           // ✅ Unlimited
      module_menu_editor: true,       // ✅ Full access
      module_food_cost: true,         // ✅ Unlimited
      module_menu_engineering: true,  // ✅ Unlimited
      module_instagram: true,         // ✅ Unlimited
      module_receipt_scanner: true,   // ✅ Unlimited
      module_reservations: true,      // ✅ Le Mouillage — Resy, Libro, Zenchef
      module_smart_prep: true,        // ✅ L'Appareillage — Predictive AI
      module_deposits: true,          // ✅ Le Lest
      module_variance: true,          // ✅ Le Tirant d'Eau
      module_production: true,        // ✅ Production
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
    module_food_cost: tierModules.module_food_cost && (dbSettings.module_food_cost ?? true),
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
