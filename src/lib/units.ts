// utilitaire de conversion des unités pour Bars & Brasseries

type UnitCategory = 'volume' | 'weight' | 'count';

interface UnitDefinition {
  name: string;
  category: UnitCategory;
  toBaseMultiplier: number; // Multiplicateur pour convertir vers l'unité de base (ml pour volume, g pour weight)
}

// Base Volume: millilitre (ml)
// Base Poids: gramme (g)

export const UNITS: Record<string, UnitDefinition> = {
  // --- VOLUME (Base: ml) ---
  ml: { name: 'Millilitre', category: 'volume', toBaseMultiplier: 1 },
  cl: { name: 'Centilitre', category: 'volume', toBaseMultiplier: 10 },
  l: { name: 'Litre', category: 'volume', toBaseMultiplier: 1000 },
  oz: { name: 'Once (oz)', category: 'volume', toBaseMultiplier: 29.5735 },
  dash: { name: 'Trait (Dash)', category: 'volume', toBaseMultiplier: 0.92 }, // Environ 1/32 d'once
  drop: { name: 'Goutte (Drop)', category: 'volume', toBaseMultiplier: 0.05 },
  teaspoon: { name: 'Cuillère à café', category: 'volume', toBaseMultiplier: 4.92892 },
  tablespoon: { name: 'Cuillère à soupe', category: 'volume', toBaseMultiplier: 14.7868 },
  cup: { name: 'Tasse (Cup)', category: 'volume', toBaseMultiplier: 236.588 },
  pint: { name: 'Pinte (US)', category: 'volume', toBaseMultiplier: 473.176 },
  pint_uk: { name: 'Pinte (UK)', category: 'volume', toBaseMultiplier: 568.261 },
  keg_50l: { name: 'Fût (50L)', category: 'volume', toBaseMultiplier: 50000 },
  keg_30l: { name: 'Fût (30L)', category: 'volume', toBaseMultiplier: 30000 },

  // --- POIDS (Base: g) ---
  g: { name: 'Gramme', category: 'weight', toBaseMultiplier: 1 },
  kg: { name: 'Kilogramme', category: 'weight', toBaseMultiplier: 1000 },
  oz_wt: { name: 'Once (poids)', category: 'weight', toBaseMultiplier: 28.3495 },
  lb: { name: 'Livre (lb)', category: 'weight', toBaseMultiplier: 453.592 },

  // --- COUNT (Base: unité) ---
  unit: { name: 'Unité', category: 'count', toBaseMultiplier: 1 },
  case_12: { name: 'Caisse (12)', category: 'count', toBaseMultiplier: 12 },
  case_24: { name: 'Caisse (24)', category: 'count', toBaseMultiplier: 24 },
};

/**
 * Convertit une quantité d'une unité à une autre.
 * Ex: convertUnit(1, 'oz', 'ml') => 29.5735
 */
export function convertUnit(quantity: number, fromUnit: string, toUnit: string): number | null {
  const from = UNITS[fromUnit];
  const to = UNITS[toUnit];

  if (!from || !to) {
    console.error(`Unité inconnue: ${fromUnit} ou ${toUnit}`);
    return null;
  }

  if (from.category !== to.category && from.category !== 'count' && to.category !== 'count') {
    console.error(`Impossible de convertir ${from.category} en ${to.category}`);
    return null;
  }

  // Convertir en unité de base, puis diviser par le multiplicateur de destination
  const quantityInBase = quantity * from.toBaseMultiplier;
  return quantityInBase / to.toBaseMultiplier;
}

/**
 * Calcule le coût réel par unité après les pertes (ex: fûts)
 */
export function calculateYieldCost(totalCost: number, totalVolume: number, expectedYieldPercentage: number = 1.0): number {
  if (totalVolume === 0) return 0;
  // Par exemple, si 50L coûte 100$, le coût est 2$/L.
  // Si le rendement est de 85% (0.85), le coût réel par litre utilisable est 2$ / 0.85 = 2.35$/L
  return (totalCost / totalVolume) / expectedYieldPercentage;
}
