"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { DynamicFoodCostAlerts } from "./food-cost/DynamicFoodCostAlerts";

type FoodCostItem = {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  ingredientCost: number;
  margin: number;
  marginAmount: number;
  laborCostPerUnit: number;
  totalCost: number;
  realMargin: number;
  realMarginAmount: number;
  status: 'healthy' | 'warning' | 'critical';
};

type FoodCostSummary = {
  avgMargin: number;
  avgIngredientMargin: number;
  totalMenuCost: number;
  totalMenuRevenue: number;
  criticalItems: number;
  warningItems: number;
  healthyItems: number;
};

export function FoodCostDashboard() {
  const t = useTranslations('FoodCostDashboard');
  const [items, setItems] = useState<FoodCostItem[]>([]);
  const [summary, setSummary] = useState<FoodCostSummary | null>(null);
  const [hasLaborData, setHasLaborData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetchWithTimeout('/api/food-cost');
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
      setHasLaborData(data.hasLaborData || false);
    } catch (err) {
      console.error('Failed to load food cost data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if any item actually has labor cost filled in
  const anyItemHasLabor = items.some(item => item.laborCostPerUnit > 0);

  const statusConfig = {
    healthy:  { label: 'Saine',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-200' , icon: '✅' },
    warning:  { label: 'Vigilance', color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',     ring: 'ring-amber-200',    icon: '⚠️' },
    critical: { label: 'Critique', color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20',         ring: 'ring-red-200',      icon: '🚨' },
  };

  if (loading) {
    return (
      <div className="w-full h-full">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-center text-zinc-400 h-full min-h-[400px]">
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4 sm:space-y-6">
      <DynamicFoodCostAlerts />

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t('title')}</h2>
        <p className="text-xs sm:text-sm text-zinc-500">
          {anyItemHasLabor
            ? "Marges réelles calculées avec le coût des ingrédients et de la main-d'œuvre."
            : "Marges calculées en temps réel à partir de vos recettes et du coût de vos ingrédients."}
        </p>
      </div>

      {/* Labor cost banner */}
      {!hasLaborData && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('laborBannerTitle')}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {t('laborBannerDesc_before')}<a href="/dashboard/settings" className="underline font-medium">{t('laborBannerSettings')}</a>{t('laborBannerDesc_after')}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summary.avgMargin}%</div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">{anyItemHasLabor ? t('avgRealMargin') : t('avgMargin')}</div>
            {anyItemHasLabor && summary.avgIngredientMargin !== summary.avgMargin && (
              <div className="text-[10px] text-zinc-400 mt-0.5">Ingr. seuls : {summary.avgIngredientMargin}%</div>
            )}
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.healthyItems}</div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">{t('healthyMargins')}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.warningItems}</div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">{t('warningMargins')}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{summary.criticalItems}</div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">{t('criticalMargins')}</div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">{t('colDish')}</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">{t('colSellingPrice')}</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">{t('colIngredientCost')}</th>
                {anyItemHasLabor && (
                  <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">{t('colLabor')}</th>
                )}
                {anyItemHasLabor && (
                  <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">{t('colRealCost')}</th>
                )}
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">{t('colProfit')}</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">{t('colMargin')}</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-400">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const cfg = statusConfig[item.status];
                const displayMargin = item.laborCostPerUnit > 0 ? item.realMargin : item.margin;
                const displayProfit = item.laborCostPerUnit > 0 ? item.realMarginAmount : item.marginAmount;
                return (
                  <tr key={item.menuItemId} className={`border-b border-zinc-100 dark:border-zinc-800 ${idx % 2 === 0 ? '' : 'bg-zinc-50/50 dark:bg-zinc-800/20'}`}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{item.menuItemName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{item.sellingPrice.toFixed(2)}$</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{item.ingredientCost.toFixed(2)}$</td>
                    {anyItemHasLabor && (
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                        {item.laborCostPerUnit > 0 ? `${item.laborCostPerUnit.toFixed(2)}$` : '—'}
                      </td>
                    )}
                    {anyItemHasLabor && (
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                        {item.laborCostPerUnit > 0 ? `${item.totalCost.toFixed(2)}$` : `${item.ingredientCost.toFixed(2)}$`}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">+{displayProfit.toFixed(2)}$</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold tabular-nums ${cfg.color}`}>{displayMargin}%</span>
                      {anyItemHasLabor && item.laborCostPerUnit > 0 && (
                        <span className="block text-[10px] text-zinc-400 tabular-nums">ingr. {item.margin}%</span>
                      )}
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
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 flex-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('marginVisualization')}</h3>
        <div className="space-y-3">
          {items.map(item => {
            const displayMargin = item.laborCostPerUnit > 0 ? item.realMargin : item.margin;
            const barColor = item.status === 'healthy' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-red-500';
            return (
              <div key={item.menuItemId} className="flex items-center gap-2 sm:gap-3">
                <div className="w-20 sm:w-44 text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300 truncate shrink-0">{item.menuItemName}</div>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.min(displayMargin, 100)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{displayMargin}%</span>
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
