"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hasReachedQuota, FREE_QUOTAS } from "@/lib/quotas";

type EngineeringItem = {
  menuItemId: string;
  menuItemName: string;
  category: 'phare' | 'ancre' | 'derive' | 'ecueil';
  weeklyOrders: number;
  sellingPrice: number;
  marginPercent: number;
  marginAmount: number;
  weeklyProfit: number;
  recommendation: string;
};

const CATEGORY_CONFIG = {
  phare:   { label: '🏮 Phare',   color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20',   ring: 'ring-yellow-300', desc: 'Populaire + Rentable' },
  ancre:   { label: '⚓ Ancre',   color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20',       ring: 'ring-blue-300',   desc: 'Populaire + Peu rentable' },
  derive:  { label: '🧭 Dérive',  color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20',   ring: 'ring-purple-300', desc: 'Impopulaire + Rentable' },
  ecueil:  { label: '🪸 Écueil',  color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20',         ring: 'ring-red-300',    desc: 'Impopulaire + Peu rentable' },
};

export function MenuEngineeringDashboard() {
  const [items, setItems] = useState<EngineeringItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [medianMargin, setMedianMargin] = useState(0);
  const [medianOrders, setMedianOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const { profile, subscription, usage, refreshSettings } = useAuth();
  const isTrial = subscription?.tier === 'trial';
  const engQuotaReached = hasReachedQuota(usage, 'menu_engineering', isTrial);

  // Instead of auto-fetching, we only fetch if previously generated or if not in trial
  // For the MVP, we'll keep the button explicit for generation to count quota.

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/menu-engineering');
      const data = await res.json();
      setItems(data.items);
      setCounts(data.categoryCounts);
      setMedianMargin(data.medianMargin);
      setMedianOrders(data.medianOrders);
    } catch (err) {
      console.error('Failed to load menu engineering data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (engQuotaReached) return;
    setAnalyzing(true);
    await fetchData();
    if (profile) {
      await supabase.rpc('increment_usage', { restaurant_uuid: profile.id, metric_name: 'menu_engineering' });
      refreshSettings();
    }
    setAnalyzing(false);
  };

  if (loading && items.length > 0) {
      <div className="w-full h-full">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-center text-zinc-400 h-full min-h-[400px]">
          Analyse du menu en cours...
        </div>
      </div>
  }

  // If no items are generated yet, show the CTA screen
  if (items.length === 0 && !loading) {
    return (
      <div className="w-full h-full flex flex-col space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center text-center h-[500px]">
          <div className="text-4xl mb-4">🧭</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Carte Marine IA</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-8">
            Générez une matrice BCG de votre menu croisant vos prix, coûts et popularité pour découvrir vos Vaches à Lait (Phares) et Poids Morts (Écueils).
          </p>

          {engQuotaReached ? (
            <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800 max-w-md">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Quota atteint</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-4">
                Vous avez généré vos {FREE_QUOTAS.menu_engineering} analyses gratuites. Passez au forfait Performance.
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={generateAnalysis}
                disabled={analyzing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-sm disabled:opacity-50"
              >
                {analyzing ? "Génération en cours..." : "Lancer l'analyse du menu"}
              </button>
              {isTrial && (
                <p className="text-xs text-zinc-500 mt-4">
                  {usage?.menu_engineering || 0} / {FREE_QUOTAS.menu_engineering} analyses utilisées
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">🧭 Menu Engineering — Carte Marine</h2>
        <p className="text-sm text-zinc-500">Classification automatique de vos plats par popularité et rentabilité. Médiane marge : {medianMargin}% | Médiane commandes : {medianOrders}/sem.</p>
      </div>

      {/* Visual BCG Matrix */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex-1">
        <div className="grid grid-cols-2 gap-1 aspect-square w-full max-w-md mx-auto" style={{ maxHeight: '320px' }}>
          {/* Top-Left: Phare */}
          <div className="bg-yellow-50 dark:bg-yellow-900/15 rounded-tl-xl border border-yellow-200 dark:border-yellow-800/30 p-3 flex flex-col">
            <div className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1">🏮 Phares</div>
            <div className="text-[10px] text-yellow-600/70 dark:text-yellow-500/60 mb-2">Populaire + Rentable</div>
            <div className="flex-1 flex flex-col gap-1 overflow-auto">
              {items.filter(i => i.category === 'phare').map(i => (
                <div key={i.menuItemId} className="text-[11px] text-yellow-800 dark:text-yellow-300 font-medium truncate">• {i.menuItemName}</div>
              ))}
            </div>
          </div>
          {/* Top-Right: Dérive */}
          <div className="bg-purple-50 dark:bg-purple-900/15 rounded-tr-xl border border-purple-200 dark:border-purple-800/30 p-3 flex flex-col">
            <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1">🧭 Dérives</div>
            <div className="text-[10px] text-purple-600/70 dark:text-purple-500/60 mb-2">Impopulaire + Rentable</div>
            <div className="flex-1 flex flex-col gap-1 overflow-auto">
              {items.filter(i => i.category === 'derive').map(i => (
                <div key={i.menuItemId} className="text-[11px] text-purple-800 dark:text-purple-300 font-medium truncate">• {i.menuItemName}</div>
              ))}
            </div>
          </div>
          {/* Bottom-Left: Ancre */}
          <div className="bg-blue-50 dark:bg-blue-900/15 rounded-bl-xl border border-blue-200 dark:border-blue-800/30 p-3 flex flex-col">
            <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">⚓ Ancres</div>
            <div className="text-[10px] text-blue-600/70 dark:text-blue-500/60 mb-2">Populaire + Peu rentable</div>
            <div className="flex-1 flex flex-col gap-1 overflow-auto">
              {items.filter(i => i.category === 'ancre').map(i => (
                <div key={i.menuItemId} className="text-[11px] text-blue-800 dark:text-blue-300 font-medium truncate">• {i.menuItemName}</div>
              ))}
            </div>
          </div>
          {/* Bottom-Right: Écueil */}
          <div className="bg-red-50 dark:bg-red-900/15 rounded-br-xl border border-red-200 dark:border-red-800/30 p-3 flex flex-col">
            <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">🪸 Écueils</div>
            <div className="text-[10px] text-red-600/70 dark:text-red-500/60 mb-2">Impopulaire + Peu rentable</div>
            <div className="flex-1 flex flex-col gap-1 overflow-auto">
              {items.filter(i => i.category === 'ecueil').map(i => (
                <div key={i.menuItemId} className="text-[11px] text-red-800 dark:text-red-300 font-medium truncate">• {i.menuItemName}</div>
              ))}
            </div>
          </div>
        </div>
        {/* Axis labels */}
        <div className="max-w-md mx-auto mt-2 flex justify-between text-[10px] text-zinc-400">
          <span>← Populaire</span>
          <span>Impopulaire →</span>
        </div>
      </div>

      {/* Detailed Recommendations Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recommandations IA par plat</h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map(item => {
            const cfg = CATEGORY_CONFIG[item.category];
            return (
              <div key={item.menuItemId} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.color} ring-1 ring-inset ${cfg.ring}`}>
                      {cfg.label}
                    </span>
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{item.menuItemName}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{item.weeklyProfit.toFixed(0)}$/sem</span>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500 mb-1.5">
                  <span>{item.weeklyOrders} commandes/sem</span>
                  <span>Marge {item.marginPercent}%</span>
                  <span>{item.sellingPrice.toFixed(2)}$</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">{item.recommendation}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
