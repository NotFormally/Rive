"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  Brain,
  CalendarDays,
  Users,
  ChefHat,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Check,
  ArrowRight,
  Loader2,
  Info,
  Sparkles,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  ShoppingBasket,
  MessageSquare,
  DollarSign,
  Percent,
  Send,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InsightAttribution } from "@/components/InsightAttribution";
import { ChefCalibrationBadge } from "@/components/ChefCalibrationBadge";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import { useAITranslation } from "@/hooks/useAITranslation";
import { APP_LANGUAGES } from "@/lib/languages";

// =============================================================================
// Types
// =============================================================================

type PrepAlert = {
  type: 'dietary' | 'anomaly' | 'vip' | 'occasion' | 'volume';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: Record<string, string | number | boolean>;
};

type PrepItem = {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  predicted_portions: number;
  item_share: number;
  confidence_score: number;
  confidence_modifier: number;
  priority: 'high' | 'medium' | 'low';
  priority_score: number;
  bcg_category: string;
  margin_percent: number;
  estimated_cost: number;
  actual_portions: number | null;
  feedback_delta: number | null;
  ai_suggestion_quantity?: number | null;
  ai_reasoning?: string | null;
};

type PrepIngredient = {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  total_quantity: number;
  unit: string;
  estimated_cost: number;
  used_by_items: Array<{ menuItemName: string; qty: number; portions: number }>;
};

type PrepList = {
  id: string;
  target_date: string;
  service_period: string;
  reserved_covers: number;
  estimated_covers: number;
  walk_in_ratio: number;
  safety_buffer: number;
  estimated_food_cost: number;
  alerts: PrepAlert[];
  generation_level: number;
  status: 'draft' | 'confirmed' | 'completed';
  chef_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
};

// =============================================================================
// Helper Components
// =============================================================================

function PriorityIcon({ priority }: { priority: string }) {
  switch (priority) {
    case 'high': return <ChevronsUp className="w-4 h-4 text-red-500" />;
    case 'medium': return <ChevronUp className="w-4 h-4 text-amber-500" />;
    default: return <ChevronDown className="w-4 h-4 text-emerald-500" />;
  }
}

function LevelBadge({ level }: { level: number }) {
  const t = useTranslations('SmartPrep');
  const config = {
    1: { label: t('level_1_label'), color: 'bg-blue-100 text-blue-700', hint: t('level_1_hint') },
    2: { label: t('level_2_label'), color: 'bg-amber-100 text-amber-700', hint: t('level_2_hint') },
    3: { label: t('level_3_label'), color: 'bg-emerald-100 text-emerald-700', hint: t('level_3_hint') },
  }[level] || { label: t('level_unknown'), color: 'bg-slate-100 text-slate-700', hint: '' };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
      {level < 3 && (
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3" /> {config.hint}
        </span>
      )}
    </div>
  );
}

function AlertCard({ alert }: { alert: PrepAlert }) {
  const severityStyles = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons: Record<string, string> = {
    dietary: '🍽️',
    occasion: '🎂',
    volume: '📊',
    anomaly: '⚠️',
    vip: '⭐',
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${severityStyles[alert.severity]}`}>
      <span className="text-base flex-shrink-0">{icons[alert.type] || '💡'}</span>
      <p className="font-medium leading-snug">{alert.message}</p>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function SmartPrepDashboard() {
  const t = useTranslations('SmartPrep');
  const { profile } = useAuth();

  // State
  const [prepList, setPrepList] = useState<PrepList | null>(null);
  const [items, setItems] = useState<PrepItem[]>([]);
  const [ingredients, setIngredients] = useState<PrepIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'prep' | 'ingredients' | 'feedback'>('prep');
  const [targetLanguage, setTargetLanguage] = useState("original");

  // Date picker
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState(tomorrow);
  const [servicePeriod, setServicePeriod] = useState<'all_day' | 'lunch' | 'dinner'>('all_day');

  // Feedback state
  const [feedbackValues, setFeedbackValues] = useState<Record<string, number>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // --------------------------------------------------------------------------
  // Data loading
  // --------------------------------------------------------------------------

  const loadPrepList = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/prep-list?date=${targetDate}&service=${servicePeriod}`
      );
      const data = await res.json();

      if (res.ok) {
        setPrepList(data.prepList);
        setItems(data.items || data.prepList?.prep_list_items || []);
        setIngredients(data.ingredients || data.prepList?.prep_list_ingredients || []);

        // Initialize feedback values from current predictions
        const fbInit: Record<string, number> = {};
        const itemList = data.items || data.prepList?.prep_list_items || [];
        for (const item of itemList) {
          fbInit[item.menu_item_id] = item.actual_portions ?? item.predicted_portions;
        }
        setFeedbackValues(fbInit);
      }
    } catch (err) {
      console.error('Error loading prep list:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, targetDate, servicePeriod]);

  useEffect(() => { loadPrepList(); }, [loadPrepList]);

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/prep-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: targetDate, service_period: servicePeriod }),
      });
      if (res.ok) {
        await loadPrepList();
      }
    } catch (err) {
      console.error('Error regenerating:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const generateAI = async () => {
    if (!prepList) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/prep-list/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prep_list_id: prepList.id }),
      });
      if (res.ok) {
        await loadPrepList(); // Reload to get the new AI suggestions
      } else {
        const errData = await res.json();
        // TODO: replace with toast UI
        alert(t('error_ai') + ": " + (errData.error || t('error_unknown')));
      }
    } catch (err) {
      console.error('Error generating AI:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  const submitFeedback = async () => {
    if (!prepList) return;
    setSubmittingFeedback(true);
    try {
      const feedbackItems = Object.entries(feedbackValues).map(([menuItemId, actual]) => ({
        menu_item_id: menuItemId,
        actual_portions: actual,
      }));

      const res = await fetch('/api/prep-list/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prep_list_id: prepList.id, items: feedbackItems }),
      });

      if (res.ok) {
        setFeedbackSuccess(true);
        setTimeout(() => setFeedbackSuccess(false), 3000);
        await loadPrepList();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // --------------------------------------------------------------------------
  // Derived data
  // --------------------------------------------------------------------------

  const highPriority = items.filter(i => i.priority === 'high');
  const medPriority = items.filter(i => i.priority === 'medium');
  const lowPriority = items.filter(i => i.priority === 'low');
  const alerts = prepList?.alerts || [];
  const totalPortions = items.reduce((s, i) => s + i.predicted_portions, 0);

  const dayLabel = (() => {
    const d = new Date(targetDate + 'T12:00:00');
    return d.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const serviceLabel = servicePeriod === 'lunch' ? t('service_lunch') : servicePeriod === 'dinner' ? t('service_dinner') : t('service_all_day');

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                {t('title')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={regenerate}
                disabled={regenerating || aiGenerating}
                className="gap-1.5"
              >
                {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="hidden sm:inline">{t('btn_regenerate')}</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['all_day', 'lunch', 'dinner'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setServicePeriod(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    servicePeriod === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s === 'all_day' ? t('period_all') : s === 'lunch' ? t('period_lunch') : t('period_dinner')}
                </button>
              ))}
            </div>
            {prepList && (
              <Button
                variant="default"
                size="sm"
                onClick={generateAI}
                disabled={aiGenerating || regenerating}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {t('btn_generate_ai')}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-8 space-y-6 max-w-6xl">
        {loading ? (
          <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="ml-3 text-sm text-slate-500">{t('loading_generation')}</span>
          </div>
        ) : !prepList ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-2">{t('empty_no_reservations')}</p>
              <p className="text-sm text-slate-400 mb-6">{t('empty_connect_platforms')}</p>
              <Button variant="default" onClick={() => window.location.href = '/dashboard/reservations'}>
                <CalendarDays className="w-4 h-4 mr-2" /> {t('btn_configure_reservations')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5">
                  <InsightAttribution
                    chefValue={prepList.reserved_covers}
                    riveValue={prepList.estimated_covers}
                    chefLabel={t('label_your_reservations')}
                    riveLabel={t('label_rive_anticipates')}
                    unit={t('unit_covers')}
                    explanation={t('walk_ins_estimated', { count: prepList.estimated_covers - prepList.reserved_covers, percent: Math.round(prepList.walk_in_ratio * 100) })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-50 rounded-lg"><ChefHat className="w-5 h-5 text-indigo-600" /></div>
                    <span className="text-sm text-slate-500">{t('card_total_portions')}</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{totalPortions}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('card_menu_items', { count: items.length })}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                    <span className="text-sm text-slate-500">{t('card_estimated_food_cost')}</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">${prepList.estimated_food_cost.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('card_based_on_recipes')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
                    <span className="text-sm text-slate-500">{t('card_alerts')}</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{alerts.length}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('card_critical_count', { count: alerts.filter(a => a.severity === 'critical').length })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Level Badge + Date + Language */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 capitalize">{dayLabel} — {serviceLabel}</p>
                <LevelBadge level={prepList.generation_level} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="text-xs rounded-lg border-slate-200 py-1 pl-2 pr-6 text-slate-700 focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                  >
                    <option value="original">{t('lang_original') || 'Original'}</option>
                    {APP_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                </div>
                <Badge variant={prepList.status === 'completed' ? 'default' : 'secondary'}
                  className={prepList.status === 'completed' ? 'bg-emerald-500' : ''}>
                  {prepList.status === 'completed' ? t('status_feedback_received') : prepList.status === 'confirmed' ? t('status_confirmed') : t('status_draft')}
                </Badge>
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <AlertCard key={i} alert={alert} />
                ))}
              </div>
            )}

            {/* Upgrade Nudge — Loss framing for sub-optimal generation levels */}
            {prepList.generation_level < 3 && (
              <UpgradeNudge currentLevel={prepList.generation_level as 1 | 2} />
            )}

            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 w-full sm:w-fit overflow-x-auto">
              {([
                { key: 'prep', label: t('tab_prep_list'), icon: ChefHat },
                { key: 'ingredients', label: t('tab_ingredients'), icon: ShoppingBasket },
                { key: 'feedback', label: t('tab_feedback'), icon: MessageSquare },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Prep List */}
            {activeTab === 'prep' && (
              <div className="space-y-6">
                {highPriority.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ChevronsUp className="w-4 h-4 text-red-500" /> {t('priority_high')}
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                      {highPriority.map((item) => (
                        <PrepItemRow key={item.id || item.menu_item_id} item={item} targetLanguage={targetLanguage} />
                      ))}
                    </div>
                  </section>
                )}
                {medPriority.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <ChevronUp className="w-4 h-4 text-amber-500" /> {t('priority_medium')}
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                      {medPriority.map((item) => (
                        <PrepItemRow key={item.id || item.menu_item_id} item={item} targetLanguage={targetLanguage} />
                      ))}
                    </div>
                  </section>
                )}
                {lowPriority.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <ChevronDown className="w-4 h-4 text-emerald-500" /> {t('priority_low')}
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                      {lowPriority.map((item) => (
                        <PrepItemRow key={item.id || item.menu_item_id} item={item} targetLanguage={targetLanguage} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Tab: Ingredients */}
            {activeTab === 'ingredients' && (
              <div>
                {ingredients.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <ShoppingBasket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 mb-1">{t('ingredients_unavailable')}</p>
                      <p className="text-xs text-slate-400">{t('ingredients_unlock_hint')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Desktop header */}
                    <div className="hidden sm:grid grid-cols-[1fr_100px_80px_140px] gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <span>{t('col_ingredient')}</span>
                      <span>{t('col_quantity')}</span>
                      <span>{t('col_unit')}</span>
                      <span>{t('col_estimated_cost')}</span>
                    </div>
                    {ingredients.map((ing) => (
                      <div key={ing.id || ing.ingredient_id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                        {/* Desktop row */}
                        <div className="hidden sm:grid grid-cols-[1fr_100px_80px_140px] gap-2 px-5 py-3.5 items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{ing.ingredient_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {(ing.used_by_items || []).map((u: any) => `${u.menuItemName} (${u.portions}×)`).join(' · ')}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-slate-800">{ing.total_quantity}</span>
                          <span className="text-sm text-slate-500">{ing.unit}</span>
                          <span className="text-sm text-slate-700 font-medium">${ing.estimated_cost.toFixed(2)}</span>
                        </div>
                        {/* Mobile card */}
                        <div className="sm:hidden px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-slate-900">{ing.ingredient_name}</p>
                            <span className="text-sm text-slate-700 font-medium">${ing.estimated_cost.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-bold text-slate-800">{ing.total_quantity} {ing.unit}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            {(ing.used_by_items || []).map((u: any) => `${u.menuItemName} (${u.portions}×)`).join(' · ')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between text-sm">
                      <span className="text-slate-500">{t('ingredients_count', { count: ingredients.length })}</span>
                      <span className="font-bold text-slate-900">
                        {t('label_total')}: ${ingredients.reduce((s, i) => s + i.estimated_cost, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Feedback */}
            {activeTab === 'feedback' && (
              <div>
                {prepList.status === 'completed' ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                      <p className="text-slate-700 font-semibold mb-1">{t('feedback_already_submitted')}</p>
                      <p className="text-sm text-slate-400">{t('feedback_adjustments_integrated')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-indigo-500" />
                          {t('feedback_title')}
                        </CardTitle>
                        <CardDescription>
                          {t('feedback_desc')}
                        </CardDescription>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            // "Tout correct" — accept all predictions as-is
                            const allCorrect: Record<string, number> = {};
                            items.forEach(item => {
                              allCorrect[item.menu_item_id] = item.predicted_portions;
                            });
                            setFeedbackValues(allCorrect);
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {t('btn_all_correct')}
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {items.map((item) => {
                          const currentVal = feedbackValues[item.menu_item_id] ?? item.predicted_portions;
                          const delta = currentVal - item.predicted_portions;
                          const deltaColor = delta === 0 ? 'text-emerald-600' : delta > 0 ? 'text-red-600' : 'text-amber-600';
                          const deltaLabel = delta === 0 ? t('delta_perfect') : delta > 0 ? t('delta_missed', { count: delta }) : t('delta_surplus', { count: delta });

                          return (
                            <div
                              key={item.id || item.menu_item_id}
                              className={`flex items-center gap-4 p-3 rounded-xl border ${
                                delta === 0 ? 'bg-emerald-50/50 border-emerald-200' :
                                delta > 0 ? 'bg-red-50/50 border-red-200' :
                                'bg-amber-50/50 border-amber-200'
                              }`}
                            >
                              <PriorityIcon priority={item.priority} />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{item.menu_item_name}</p>
                                <p className={`text-xs ${deltaColor}`}>
                                  {t('feedback_predicted')}: {item.predicted_portions} → {t('feedback_actual')}: {currentVal} ({deltaLabel})
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setFeedbackValues(prev => ({
                                    ...prev,
                                    [item.menu_item_id]: Math.max(0, (prev[item.menu_item_id] ?? item.predicted_portions) - 1),
                                  }))}
                                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  value={currentVal}
                                  onChange={(e) => setFeedbackValues(prev => ({
                                    ...prev,
                                    [item.menu_item_id]: Math.max(0, parseInt(e.target.value) || 0),
                                  }))}
                                  className="w-16 h-8 text-center text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <button
                                  onClick={() => setFeedbackValues(prev => ({
                                    ...prev,
                                    [item.menu_item_id]: (prev[item.menu_item_id] ?? item.predicted_portions) + 1,
                                  }))}
                                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button
                        onClick={submitFeedback}
                        disabled={submittingFeedback}
                        className="gap-2"
                      >
                        {submittingFeedback ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : feedbackSuccess ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {feedbackSuccess ? t('feedback_saved') : t('btn_submit_feedback')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// =============================================================================
// Prep Item Row
// =============================================================================

function PrepItemRow({ item, targetLanguage }: { item: PrepItem, targetLanguage: string }) {
  const t = useTranslations('SmartPrep');
  const bcgLabels: Record<string, string> = {
    phare: t('bcg_phare'), ancre: t('bcg_ancre'), derive: t('bcg_derive'), ecueil: t('bcg_ecueil'),
  };
  const bcgColors: Record<string, string> = {
    phare: 'bg-emerald-100 text-emerald-700',
    ancre: 'bg-blue-100 text-blue-700',
    derive: 'bg-amber-100 text-amber-700',
    ecueil: 'bg-slate-100 text-slate-600',
  };

  const { translate, isTranslating, translationsCache } = useAITranslation();
  const [translatedReasoning, setTranslatedReasoning] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (targetLanguage === 'original' || !item.ai_reasoning) return;
    const txt = await translate(item.ai_reasoning, targetLanguage);
    if (txt) setTranslatedReasoning(txt);
  };
  
  // Reset translation if language goes back to original
  useEffect(() => {
    if (targetLanguage === 'original') setTranslatedReasoning(null);
  }, [targetLanguage]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <PriorityIcon priority={item.priority} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">{item.menu_item_name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${bcgColors[item.bcg_category] || bcgColors.ecueil}`}>
              {bcgLabels[item.bcg_category] || item.bcg_category}
            </span>
            <span className="text-xs text-slate-400">
              {t('label_margin')} {item.margin_percent.toFixed(0)}%
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              · {t('label_confidence')} {Math.round(item.confidence_score * 100)}%
            </span>
            {item.confidence_modifier !== 1 && (
              <ChefCalibrationBadge
                feedbackCount={Math.round(Math.abs(item.confidence_modifier - 1) * 50)}
                modifier={item.confidence_modifier}
                trend={item.confidence_modifier > 1 ? 'up' : item.confidence_modifier < 1 ? 'down' : 'stable'} // i18n-ignore
              />
            )}
          </div>
          {item.ai_reasoning && (
            <div className="mt-1.5">
               <span className="text-xs text-indigo-500 inline-flex flex-wrap items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md">
                 <Sparkles className="w-3.5 h-3.5 shrink-0" /> 
                 <span className="break-words">
                   {translatedReasoning || item.ai_reasoning}
                 </span>
                 {translatedReasoning && (
                   <span className="text-[10px] font-semibold ml-1 bg-indigo-100 px-1 rounded">{t('translated_badge')}</span>
                 )}
               </span>
               {targetLanguage !== 'original' && !translatedReasoning && (
                 <button 
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="text-[11px] underline text-slate-400 hover:text-indigo-600 block mt-1 transition-colors"
                 >
                    {isTranslating ? t('translating_in_progress') : t('translate_to', { lang: APP_LANGUAGES.find(l => l.code === targetLanguage)?.label || targetLanguage.toUpperCase() })}
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 pl-7 sm:pl-0">
        <div className="text-left sm:text-right">
          {item.ai_suggestion_quantity !== undefined && item.ai_suggestion_quantity !== null ? (
            <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <span className="text-sm line-through text-slate-400">{item.predicted_portions}</span>
                <p className="text-lg sm:text-xl font-bold text-indigo-600">{item.ai_suggestion_quantity}</p>
              </div>
              <p className="text-[11px] text-indigo-400 font-medium">{t('label_your_system')}</p>
            </div>
          ) : (
            <div className="flex items-center sm:flex-col gap-1 sm:gap-0">
              <p className="text-base sm:text-lg font-bold text-slate-900">{item.predicted_portions}</p>
              <p className="text-[11px] text-slate-400">{t('label_portions')}</p>
            </div>
          )}
        </div>
        {item.estimated_cost > 0 && (
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium text-slate-600">${item.estimated_cost.toFixed(2)}</p>
            <p className="text-[11px] text-slate-400 hidden sm:block">{t('label_food_cost')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
