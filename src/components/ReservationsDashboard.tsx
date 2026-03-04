"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  CalendarDays,
  Users,
  Link2,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  RefreshCw,
  Clock,
  Utensils,
  XCircle,
  UserCheck,
  ChevronRight,
  Sparkles,
  Globe,
} from "lucide-react";
import { useAITranslation } from "@/hooks/useAITranslation";
import { APP_LANGUAGES } from "@/lib/languages";

// ============================================================================
// Types
// ============================================================================

type Provider = {
  id: string;
  restaurant_id: string;
  webhook_token: string;
  provider_name: string | null;
  status: 'pending' | 'active' | 'error';
  last_sync_at: string | null;
  created_at: string;
};

type Reservation = {
  id: string;
  external_id: string;
  guest_count: number;
  reservation_time: string;
  status: 'booked' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_notes: string | null;
  provider_id: string | null;
  created_at: string;
};

// Provider metadata (logo colors)
const PROVIDER_META: Record<string, { color: string; bg: string }> = {
  libro:   { color: 'text-emerald-700', bg: 'bg-emerald-100' },
  resy:    { color: 'text-rose-700',    bg: 'bg-rose-100' },
  zenchef: { color: 'text-blue-700',    bg: 'bg-blue-100' },
  unknown: { color: 'text-slate-600',   bg: 'bg-slate-100' },
};

// Status icons and colors
const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  booked:    { icon: Clock,     color: 'text-blue-700',    bg: 'bg-blue-50' },
  seated:    { icon: Utensils,  color: 'text-amber-700',   bg: 'bg-amber-50' },
  completed: { icon: UserCheck, color: 'text-green-700',   bg: 'bg-green-50' },
  cancelled: { icon: XCircle,   color: 'text-red-600',     bg: 'bg-red-50' },
  no_show:   { icon: XCircle,   color: 'text-slate-500',   bg: 'bg-slate-50' },
};

// ============================================================================
// Main Component
// ============================================================================

export default function ReservationsDashboard() {
  const { profile } = useAuth();
  const t = useTranslations('Reservations');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [newProviderName, setNewProviderName] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today');
  const [targetLanguage, setTargetLanguage] = useState("original");

  // Translated labels for providers
  const PROVIDER_LABELS: Record<string, string> = {
    libro: 'Libro',
    resy: 'Resy',
    zenchef: 'Zenchef',
    unknown: t('provider_other'),
  };

  // Translated labels for statuses
  const STATUS_LABELS: Record<string, string> = {
    booked: t('status_booked'),
    seated: t('status_seated'),
    completed: t('status_completed'),
    cancelled: t('status_cancelled'),
    no_show: t('status_no_show'),
  };

  // Base URL for webhook — uses window.location in browser
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/reservations`
    : 'https://app.rive.com/api/webhooks/reservations';

  // --------------------------------------------------------------------------
  // Data loading
  // --------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    try {
      // Load providers
      const { data: provData } = await supabase
        .from('reservation_providers')
        .select('*')
        .eq('restaurant_id', profile.id)
        .order('created_at', { ascending: false });

      setProviders(provData || []);

      // Load reservations with date filter
      let query = supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', profile.id)
        .order('reservation_time', { ascending: true });

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString();
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

      if (dateFilter === 'today') {
        query = query.gte('reservation_time', startOfToday).lt('reservation_time', startOfTomorrow);
      } else if (dateFilter === 'tomorrow') {
        query = query.gte('reservation_time', startOfTomorrow).lt('reservation_time', endOfTomorrow);
      } else if (dateFilter === 'week') {
        query = query.gte('reservation_time', startOfToday).lt('reservation_time', endOfWeek);
      }

      const { data: resData } = await query;
      setReservations(resData || []);
    } catch (err) {
      console.error('Error loading reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, dateFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // --------------------------------------------------------------------------
  // Provider actions
  // --------------------------------------------------------------------------

  const createProvider = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/reservations/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_name: newProviderName || null }),
      });
      if (res.ok) {
        setNewProviderName('');
        setShowSetup(false);
        await loadData();
      }
    } catch (err) {
      console.error('Error creating provider:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm(t('confirm_delete_provider'))) return;
    await fetch(`/api/reservations/providers?id=${id}`, { method: 'DELETE' });
    await loadData();
  };

  const copyWebhookUrl = (token: string, id: string) => {
    navigator.clipboard.writeText(`${baseUrl}?token=${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Find provider name from ID for display
  const getProviderForReservation = (providerId: string | null) => {
    const prov = providers.find(p => p.id === providerId);
    return prov?.provider_name || 'unknown';
  };

  // --------------------------------------------------------------------------
  // Summary stats
  // --------------------------------------------------------------------------

  const activeReservations = reservations.filter(r => r.status === 'booked' || r.status === 'seated');
  const totalGuests = activeReservations.reduce((sum, r) => sum + r.guest_count, 0);
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 mr-2">
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
            <button
              onClick={() => loadData()}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              title={t('btn_refresh')}
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_connect_a')}</span> {t('btn_platform')}
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-6xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg"><CalendarDays className="w-5 h-5 text-blue-600" /></div>
              <span className="text-sm text-slate-500">{t('stat_active_reservations')}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{activeReservations.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg"><Users className="w-5 h-5 text-emerald-600" /></div>
              <span className="text-sm text-slate-500">{t('stat_expected_covers')}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalGuests}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg"><XCircle className="w-5 h-5 text-red-500" /></div>
              <span className="text-sm text-slate-500">{t('stat_cancellations')}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{cancelledCount}</p>
          </div>
        </div>

        {/* Connected Providers */}
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4" /> {t('section_connected_platforms')}
          </h2>
          {providers.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
              <Link2 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium mb-1">{t('empty_no_platform')}</p>
              <p className="text-xs text-slate-400 mb-4">
                {t('empty_no_platform_desc')}
              </p>
              <button
                onClick={() => setShowSetup(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                {t('btn_configure_now')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((prov) => {
                const meta = PROVIDER_META[prov.provider_name || 'unknown'] || PROVIDER_META.unknown;
                const provLabel = PROVIDER_LABELS[prov.provider_name || 'unknown'] || PROVIDER_LABELS.unknown;
                return (
                  <div key={prov.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color} ${meta.bg}`}>
                          {provLabel}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          prov.status === 'active' ? 'text-green-600' :
                          prov.status === 'error' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            prov.status === 'active' ? 'bg-green-500' :
                            prov.status === 'error' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
                          }`}></span>
                          {prov.status === 'active' ? t('provider_status_active') : prov.status === 'error' ? t('provider_status_error') : t('provider_status_pending')}
                        </span>
                      </div>
                      <button onClick={() => deleteProvider(prov.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Webhook URL */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{t('webhook_url_label')}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-slate-600 font-mono flex-1 truncate">
                          {baseUrl}?token={prov.webhook_token.slice(0, 20)}...
                        </code>
                        <button
                          onClick={() => copyWebhookUrl(prov.webhook_token, prov.id)}
                          className="p-1.5 rounded bg-white border border-slate-200 hover:border-indigo-300 transition-colors"
                        >
                          {copiedId === prov.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                    {prov.last_sync_at && (
                      <p className="text-[11px] text-slate-400">
                        {t('last_sync')} : {new Date(prov.last_sync_at).toLocaleString('fr-CA')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Date Filter + Reservations List */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> {t('section_reservations')}
            </h2>
            <div className="flex bg-slate-100 rounded-lg p-0.5 overflow-x-auto">
              {(['today', 'tomorrow', 'week', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    dateFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f === 'today' ? t('filter_today') : f === 'tomorrow' ? t('filter_tomorrow') : f === 'week' ? t('filter_week') : t('filter_all')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-slate-400 py-8 text-center">{t('loading_reservations')}</div>
          ) : reservations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">{t('empty_no_reservations')}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {/* Desktop table header */}
              <div className="hidden md:grid grid-cols-[1fr_100px_100px_120px_80px] gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>{t('table_client')}</span>
                <span>{t('table_covers')}</span>
                <span>{t('table_time')}</span>
                <span>{t('table_source')}</span>
                <span>{t('table_status')}</span>
              </div>
              {reservations.map((r) => (
                <ReservationRow 
                  key={r.id} 
                  r={r} 
                  targetLanguage={targetLanguage} 
                  providers={providers}
                  providerLabels={PROVIDER_LABELS}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal: Add New Provider */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reservation-modal-title">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 id="reservation-modal-title" className="text-lg font-bold text-slate-900 mb-2">{t('modal_title')}</h3>
            <p className="text-sm text-slate-500 mb-6">
              {t('modal_description')}
            </p>

            <div className="space-y-3 mb-6">
              {['libro', 'resy', 'zenchef'].map((name) => {
                const meta = PROVIDER_META[name];
                const isSelected = newProviderName === name;
                return (
                  <button
                    key={name}
                    onClick={() => setNewProviderName(name)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${meta.color} ${meta.bg}`}>
                        {PROVIDER_LABELS[name]}
                      </span>
                      <span className="text-sm text-slate-600">
                        {name === 'libro' && t('provider_libro_region')}
                        {name === 'resy' && t('provider_resy_region')}
                        {name === 'zenchef' && t('provider_zenchef_region')}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-500' : 'text-slate-300'}`} />
                  </button>
                );
              })}
              <button
                onClick={() => setNewProviderName('other')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  newProviderName === 'other'
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-slate-100">{t('provider_other')}</span>
                  <span className="text-sm text-slate-600">{t('provider_other_desc')}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${newProviderName === 'other' ? 'text-indigo-500' : 'text-slate-300'}`} />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSetup(false); setNewProviderName(''); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('btn_cancel')}
              </button>
              <button
                onClick={createProvider}
                disabled={creating || !newProviderName}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? t('btn_creating') : t('btn_generate_webhook')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Reservation Row (with Translation support)
// ============================================================================
function ReservationRow({ r, targetLanguage, providers, providerLabels }: { r: Reservation, targetLanguage: string, providers: Provider[], providerLabels: Record<string, string> }) {
  const t = useTranslations('Reservations');
  const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.booked;
  const StatusIcon = sc.icon;
  
  const STATUS_LABELS: Record<string, string> = {
    booked: t('status_booked'),
    seated: t('status_seated'),
    completed: t('status_completed'),
    cancelled: t('status_cancelled'),
    no_show: t('status_no_show'),
  };
  const statusLabel = STATUS_LABELS[r.status] || STATUS_LABELS.booked;
  
  const provName = providers.find(p => p.id === r.provider_id)?.provider_name || 'unknown';
  const pm = PROVIDER_META[provName] || PROVIDER_META.unknown;
  const provLabel = providerLabels[provName] || providerLabels.unknown;
  const time = new Date(r.reservation_time);

  const { translate, isTranslating } = useAITranslation();
  const [translatedNotes, setTranslatedNotes] = useState<string | null>(null);

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetLanguage === 'original' || !r.customer_notes) return;
    const txt = await translate(r.customer_notes, targetLanguage);
    if (txt) setTranslatedNotes(txt);
  };

  useEffect(() => {
    if (targetLanguage === 'original') setTranslatedNotes(null);
  }, [targetLanguage]);

  return (
    <div className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[1fr_100px_100px_120px_80px] gap-2 px-5 py-3.5 items-center">
        <div>
          <p className="text-sm font-medium text-slate-900">{r.customer_name || t('unknown_client')}</p>
          {r.customer_notes && (
            <div className="mt-0.5 max-w-sm">
              <span className="text-xs text-slate-400 break-words">
                {translatedNotes || r.customer_notes}
              </span>
              {translatedNotes && (
                 <span className="text-[10px] font-semibold ml-1 text-indigo-500 bg-indigo-50 px-1 rounded inline-flex items-center gap-1">
                   <Sparkles className="w-2.5 h-2.5" /> Traduit
                 </span>
               )}
               {targetLanguage !== 'original' && !translatedNotes && (
                 <button 
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="text-[10px] underline text-indigo-400 hover:text-indigo-600 block transition-colors"
                 >
                    {isTranslating ? 'Traduction en cours...' : `Traduire en ${APP_LANGUAGES.find(l => l.code === targetLanguage)?.label || targetLanguage}`}
                 </button>
               )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700 font-medium">{r.guest_count}</span>
        </div>
        <span className="text-sm text-slate-700 font-mono">
          {time.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium ${pm.color} ${pm.bg}`}>
          {provLabel}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${sc.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusLabel}
        </span>
      </div>
      {/* Mobile card */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-slate-900">{r.customer_name || t('unknown_client')}</p>
          <span className="text-sm text-slate-700 font-mono">
            {time.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-600">{r.guest_count}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${pm.color} ${pm.bg}`}>
            {provLabel}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${sc.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusLabel}
          </span>
        </div>
        {r.customer_notes && (
          <div className="mt-1">
            <span className="text-xs text-slate-500 break-words">{translatedNotes || r.customer_notes}</span>
            {translatedNotes && (
               <span className="text-[10px] font-semibold ml-1 text-indigo-500 bg-indigo-50 px-1 rounded inline-flex items-center gap-1 mt-1">
                 <Sparkles className="w-2.5 h-2.5" /> Traduit
               </span>
             )}
            {targetLanguage !== 'original' && !translatedNotes && (
               <button 
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="text-[10px] underline text-indigo-400 hover:text-indigo-600 block transition-colors mt-0.5"
               >
                  {isTranslating ? 'Traduction en cours...' : `Traduire`}
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
