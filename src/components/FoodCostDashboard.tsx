"use client";

import { useState, useEffect } from "react";
import { DynamicFoodCostAlerts } from "./food-cost/DynamicFoodCostAlerts";

type FoodCostItem = {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  ingredientCost: number;
  margin: number;
  marginAmount: number;
  status: 'healthy' | 'warning' | 'critical';
};

type FoodCostSummary = {
  avgMargin: number;
  totalMenuCost: number;
  totalMenuRevenue: number;
  criticalItems: number;
  warningItems: number;
  healthyItems: number;
};

export function FoodCostDashboard() {
  const [items, setItems] = useState<FoodCostItem[]>([]);
  const [summary, setSummary] = useState<FoodCostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/food-cost');
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Failed to load food cost data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    healthy:  { label: 'Saine',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-200' , icon: '✅' },
    warning:  { label: 'Vigilance', color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',     ring: 'ring-amber-200',    icon: '⚠️' },
    critical: { label: 'Critique', color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20',         ring: 'ring-red-200',      icon: '🚨' },
  };

  if (loading) {
    return (
      <div className="w-full h-full">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-center text-zinc-400 h-full min-h-[400px]">
          Calcul du food cost en cours...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <DynamicFoodCostAlerts />

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">💰 Food Cost — Analyse des Marges</h2>
        <p className="text-sm text-zinc-500">Marges calculées en temps réel à partir de vos recettes et du coût de vos ingrédients (factures scannées).</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summary.avgMargin}%</div>
            <div className="text-xs text-zinc-500 mt-1">Marge Moyenne</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.healthyItems}</div>
            <div className="text-xs text-zinc-500 mt-1">Marges Saines</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.warningItems}</div>
            <div className="text-xs text-zinc-500 mt-1">En Vigilance</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.criticalItems}</div>
            <div className="text-xs text-zinc-500 mt-1">Critiques</div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Plat</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">Prix Vente</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">Coût Ingr.</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">Profit</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">Marge</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-400">Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const cfg = statusConfig[item.status];
                return (
                  <tr key={item.menuItemId} className={`border-b border-zinc-100 dark:border-zinc-800 ${idx % 2 === 0 ? '' : 'bg-zinc-50/50 dark:bg-zinc-800/20'}`}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{item.menuItemName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{item.sellingPrice.toFixed(2)}$</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{item.ingredientCost.toFixed(2)}$</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">+{item.marginAmount.toFixed(2)}$</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold tabular-nums ${cfg.color}`}>{item.margin}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} ring-1 ring-inset ${cfg.ring}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Margin Bar Chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Visualisation des Marges</h3>
        <div className="space-y-3">
          {items.map(item => {
            const cfg = statusConfig[item.status];
            const barColor = item.status === 'healthy' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-red-500';
            return (
              <div key={item.menuItemId} className="flex items-center gap-3">
                <div className="w-32 sm:w-44 text-xs text-zinc-700 dark:text-zinc-300 truncate shrink-0">{item.menuItemName}</div>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.min(item.margin, 100)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{item.margin}%</span>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Target line legend */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> ≥70% (Saine)
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500 ml-3" /> 60-70% (Vigilance)
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500 ml-3" /> &lt;60% (Critique)
          </div>
        </div>
      </div>
    </div>
  );
}
