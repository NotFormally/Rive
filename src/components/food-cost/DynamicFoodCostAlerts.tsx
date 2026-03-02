"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { AlertTriangle, Sparkles, Check, X, Loader2, ArrowRight } from "lucide-react";

type Alert = {
  id: string;
  recipe_name: string;
  ingredient_name: string;
  previous_cost: number;
  new_cost: number;
  ai_recommendation: string;
};

export function DynamicFoodCostAlerts() {
  const t = useTranslations('FoodCostAlerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetchWithTimeout('/api/food-cost/alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to load food cost alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const res = await fetch('/api/food-cost/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.generatedAlerts > 0) {
        await fetchAlerts();
      } else if (data.message) {
        // TODO: replace with toast UI
        alert(data.message);
      }
    } catch (err) {
      console.error('Failed to analyze food cost:', err);
      // TODO: replace with toast UI
      alert(t('error_analysis'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDismiss = async (alertId: string, status: 'actioned' | 'ignored') => {
    try {
      // Optimistic update
      setAlerts(prev => prev.filter(a => a.id !== alertId));

      await fetch('/api/food-cost/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, status })
      });
    } catch (err) {
      console.error('Failed to update alert:', err);
      fetchAlerts(); // Revert on failure
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          <span>{t('title')}</span>
        </h2>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 w-full sm:w-auto"
        >
          {analyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /><span>{t('btn_analyzing')}</span></>
          ) : (
            <><Sparkles className="w-4 h-4" aria-hidden="true" /><span className="sm:hidden">{t('btn_analyze_short')}</span><span className="hidden sm:inline">{t('btn_analyze_full')}</span></>
          )}
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 text-center text-indigo-800">
          <p className="text-sm font-medium">{t('empty_healthy_margins')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />

              <div className="flex-1 flex flex-col gap-2 relative z-10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-900 leading-tight">{t('alert_critical_margin')} : {alert.recipe_name}</h3>
                    <p className="text-sm text-red-800 mt-0.5">
                      {t('alert_material_cost')} : <span className="line-through opacity-70">{alert.previous_cost}$</span> <ArrowRight className="w-3 h-3 inline pb-0.5" /> <span className="font-bold">{alert.new_cost}$</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/60 p-3 rounded-lg border border-red-100 mt-1">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-900 mb-0.5">{t('ai_recommendation_label')}</p>
                      <p className="text-red-900 text-sm leading-snug">{alert.ai_recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleDismiss(alert.id, 'actioned')}
                  className="flex-1 sm:flex-none uppercase text-[10px] font-bold tracking-wider bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" /> {t('btn_resolved')}
                </button>
                <button
                  onClick={() => handleDismiss(alert.id, 'ignored')}
                  className="flex-1 sm:flex-none uppercase text-[10px] font-bold tracking-wider bg-red-100 hover:bg-red-200 text-red-800 py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" /> {t('btn_ignore')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
