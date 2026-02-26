"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";

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

// Provider metadata (logo colors, labels)
const PROVIDER_META: Record<string, { label: string; color: string; bg: string }> = {
  libro:   { label: 'Libro',   color: 'text-emerald-700', bg: 'bg-emerald-100' },
  resy:    { label: 'Resy',    color: 'text-rose-700',    bg: 'bg-rose-100' },
  zenchef: { label: 'Zenchef', color: 'text-blue-700',    bg: 'bg-blue-100' },
  unknown: { label: 'Autre',   color: 'text-slate-600',   bg: 'bg-slate-100' },
};

// Status icons and colors
const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string; bg: string }> = {
  booked:    { icon: Clock,     label: 'Réservé',  color: 'text-blue-700',    bg: 'bg-blue-50' },
  seated:    { icon: Utensils,  label: 'Assis',    color: 'text-amber-700',   bg: 'bg-amber-50' },
  completed: { icon: UserCheck, label: 'Terminé',  color: 'text-green-700',   bg: 'bg-green-50' },
  cancelled: { icon: XCircle,   label: 'Annulé',   color: 'text-red-600',     bg: 'bg-red-50' },
  no_show:   { icon: XCircle,   label: 'No-show',  color: 'text-slate-500',   bg: 'bg-slate-50' },
};

// ============================================================================
// Main Component
// ============================================================================

export default function ReservationsDashboard() {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [newProviderName, setNewProviderName] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today');

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
    if (!confirm('Supprimer cette connexion ? Les réservations associées seront conservées.')) return;
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Réservations</h1>
          <p className="text-sm text-slate-500">
            Libro · Resy · Zenchef — Flux de réservations en temps réel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          <button
            onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Connecter une plateforme
          </button>
        </div>
      </header>

      <main className="p-8 space-y-8 max-w-6xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg"><CalendarDays className="w-5 h-5 text-blue-600" /></div>
              <span className="text-sm text-slate-500">Réservations actives</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{activeReservations.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg"><Users className="w-5 h-5 text-emerald-600" /></div>
              <span className="text-sm text-slate-500">Couverts attendus</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalGuests}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg"><XCircle className="w-5 h-5 text-red-500" /></div>
              <span className="text-sm text-slate-500">Annulations</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{cancelledCount}</p>
          </div>
        </div>

        {/* Connected Providers */}
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Plateformes connectées
          </h2>
          {providers.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
              <Link2 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium mb-1">Aucune plateforme connectée</p>
              <p className="text-xs text-slate-400 mb-4">
                Connectez Libro, Resy ou Zenchef pour recevoir vos réservations automatiquement.
              </p>
              <button
                onClick={() => setShowSetup(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Configurer maintenant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((prov) => {
                const meta = PROVIDER_META[prov.provider_name || 'unknown'] || PROVIDER_META.unknown;
                return (
                  <div key={prov.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color} ${meta.bg}`}>
                          {meta.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          prov.status === 'active' ? 'text-green-600' :
                          prov.status === 'error' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            prov.status === 'active' ? 'bg-green-500' :
                            prov.status === 'error' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
                          }`}></span>
                          {prov.status === 'active' ? 'Actif' : prov.status === 'error' ? 'Erreur' : 'En attente'}
                        </span>
                      </div>
                      <button onClick={() => deleteProvider(prov.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Webhook URL */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">URL Webhook</p>
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
                        Dernière synchro : {new Date(prov.last_sync_at).toLocaleString('fr-CA')}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Réservations
            </h2>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['today', 'tomorrow', 'week', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dateFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f === 'today' ? "Aujourd'hui" : f === 'tomorrow' ? 'Demain' : f === 'week' ? '7 jours' : 'Tout'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-slate-400 py-8 text-center">Chargement des réservations...</div>
          ) : reservations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Aucune réservation pour cette période.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-[1fr_100px_100px_120px_80px] gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Client</span>
                <span>Couverts</span>
                <span>Heure</span>
                <span>Source</span>
                <span>Statut</span>
              </div>
              {reservations.map((r) => {
                const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.booked;
                const StatusIcon = sc.icon;
                const provName = getProviderForReservation(r.provider_id);
                const pm = PROVIDER_META[provName] || PROVIDER_META.unknown;
                const time = new Date(r.reservation_time);

                return (
                  <div key={r.id} className="grid grid-cols-[1fr_100px_100px_120px_80px] gap-2 px-5 py-3.5 border-b border-slate-100 last:border-b-0 items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{r.customer_name || 'Client inconnu'}</p>
                      {r.customer_notes && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{r.customer_notes}</p>
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
                      {pm.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal: Add New Provider */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Connecter une plateforme</h3>
            <p className="text-sm text-slate-500 mb-6">
              Sélectionnez votre logiciel de réservation. Rive générera un lien Webhook unique que vous 
              devrez coller dans les paramètres de votre plateforme.
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
                        {meta.label}
                      </span>
                      <span className="text-sm text-slate-600">
                        {name === 'libro' && 'Canada & Amérique du Nord'}
                        {name === 'resy' && 'Tables gastronomiques (Amex)'}
                        {name === 'zenchef' && 'France & Europe'}
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
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-slate-100">Autre</span>
                  <span className="text-sm text-slate-600">Plateforme non listée (détection auto)</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${newProviderName === 'other' ? 'text-indigo-500' : 'text-slate-300'}`} />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSetup(false); setNewProviderName(''); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={createProvider}
                disabled={creating || !newProviderName}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Création...' : 'Générer le Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

