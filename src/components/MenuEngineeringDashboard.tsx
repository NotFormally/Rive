"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hasReachedQuota, FREE_QUOTAS } from "@/lib/quotas";
import { useTranslations } from "next-intl";

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

export function MenuEngineeringDashboard() {
  const [items, setItems] = useState<EngineeringItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [medianMargin, setMedianMargin] = useState(0);
  const [medianOrders, setMedianOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const t = useTranslations('MenuEngineering');

  const CATEGORY_CONFIG = {
    phare:   { label: t('cat_phare'),   color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20',   ring: 'ring-yellow-300', desc: t('cat_phare_desc') },
    ancre:   { label: t('cat_ancre'),   color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20',       ring: 'ring-blue-300',   desc: t('cat_ancre_desc') },
    derive:  { label: t('cat_derive'),  color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20',   ring: 'ring-purple-300', desc: t('cat_derive_desc') },
    ecueil:  { label: t('cat_ecueil'),  color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20',         ring: 'ring-red-300',    desc: t('cat_ecueil_desc') },
  };

  const { profile, subscription, usage, refreshSettings } = useAuth();
  const isTrial = subscription?.tier === 'trial';
  const engQuotaReached = hasReachedQuota(usage, 'menu_engineering', isTrial);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/menu-engineering');
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const data = await res.json();
      setItems(data?.items || []);
      setCounts(data?.categoryCounts || {});
      setMedianMargin(data?.medianMargin || 0);
      setMedianOrders(data?.medianOrders || 0);
    } catch (err) {
      console.error('Failed to load menu engineering data:', err);
      setItems([]);
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
    return (
      <div className="w-full h-full">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-center text-zinc-400 h-full min-h-[400px]">
          {t('analyzing')}
        </div>
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="w-full h-full flex flex-col space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center text-center h-[500px]">
          <div className="text-4xl mb-4">🧭</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t('title')}</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-8">
            {t('desc_full')}
          </p>

          {engQuotaReached ? (
            <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800 max-w-md">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">{t('quota_reached')}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-4">
                {t('quota_desc', { count: FREE_QUOTAS.menu_engineering })}
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={generateAnalysis}
                disabled={analyzing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-sm disabled:opacity-50"
              >
                {analyzing ? t('btn_generating') : t('btn_generate')}
              </button>
              {isTrial && (
                <p className="text-xs text-zinc-500 mt-4">
                  {t('quota_usage', { used: usage?.menu_engineering || 0, total: FREE_QUOTAS.menu_engineering })}
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
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t('title')}</h2>
        <p className="text-sm text-zinc-500">{t('desc_short')} {t('median_info', { margin: medianMargin, orders: medianOrders })}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex-1">
        <div className="grid grid-cols-2 gap-1 aspect-square w-full max-w-md mx-auto" style={{ maxHeight: '320px' }}>
          <div className="bg-yellow-50 dark:bg-yellow-900/15 rounded-tl-xl border border-yellow-200 dark:border-yellow-800/30 p-3 flex flex-col">
            <div className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1">{t('cat_phare')}</div>
            <div className="text-[10px] text-yellow-600/70 dark:text-yellow-500/60 mb-2">{t('cat_phare_desc')}</div>
            <div className="flex-1 flex flex-col gap-1 overflow-auto">
              {items.filter(i => i.category === 'phare').map(i => (
                <div key={i.menuItemId} className="text-[11px] text-yellow-800 dark:text-yellow-300 font-medium truncate">• {i.menuItemName}</div>
              ))}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/15 rounded-tr-xl border border-purple-200 dark:border-purple-800/30 p-3 flex flex-col">
            <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1">{t('cat_derive')}</div>
            <div className="text-[10px] text-purple-600/70 dark:text-purple-500/60 mb-2">{t('cat_derive_desc')}</div>
            <div className="flex-1 flex flex-col gap-1 overflow-auto">
              {items.filter(i => i.category === 'derive').map(i => (
                <div key={i.menuItemId} className="text-[11px] text-purple-800 dark:text-purple-300 font-medium truncate">• {i.menuItemName}</div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/15 rounded-bl-xl border border-blue-200 dark:border-blue-800/30 p-3 flex flex-col">
            <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">{t('cat_ancre')}</div>
            <div className="text-[10px] text-blue-600/70 dark:text-blue-500/60 mb-2">{t('cat_ancre_desc')}</div>
            <div className="flex-1 flex flex-col gap-1 overflow-auto">
              {items.filter(i => i.category === 'ancre').map(i => (
                <div key={i.menuItemId} className="text-[11px] text-blue-800 dark:text-blue-300 font-medium truncate">• {i.menuItemName}</div>
              ))}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/15 rounded-br-xl border border-red-200 dark:border-red-800/30 p-3 flex flex-col">
            <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">{t('cat_ecueil')}</div>
            <div className="text-[10px] text-red-600/70 dark:text-red-500/60 mb-2">{t('cat_ecueil_desc')}</div>
            <div className="flex-1 flex flex-col gap-1 overflow-auto">
              {items.filter(i => i.category === 'ecueil').map(i => (
                <div key={i.menuItemId} className="text-[11px] text-red-800 dark:text-red-300 font-medium truncate">• {i.menuItemName}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-md mx-auto mt-2 flex justify-between text-[10px] text-zinc-400">
          <span>{t('axis_pop')}</span>
          <span>{t('axis_impop')}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('table_title')}</h3>
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
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{t('profit_label', { amount: item.weeklyProfit.toFixed(0) })}</span>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500 mb-1.5">
                  <span>{t('orders_label', { count: item.weeklyOrders })}</span>
                  <span>{t('margin_label', { percent: item.marginPercent })}</span>
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
