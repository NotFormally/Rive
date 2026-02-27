"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Check, AlertCircle, Play, Save } from "lucide-react";

type IntegrationRecord = {
  id?: string;
  provider: 'stripe' | 'square' | 'lightspeed' | 'toast' | 'sumup' | 'zettle';
  access_token: string;
  is_active: boolean;
};

// Simplified UI components for each integration
const integrationsList: Array<{ id: 'stripe' | 'square' | 'lightspeed' | 'toast' | 'sumup' | 'zettle', name: string, description: string, placeholder: string }> = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Synchroniser les volumes de ventes depuis vos transactions et paiements Stripe Checkout.",
    placeholder: "sk_live_..."
  },
  {
    id: "square",
    name: "Square",
    description: "Connecter vos caisses Square pour importer vos ventes de la semaine automatiquement.",
    placeholder: "EAAA..."
  },
  {
    id: "lightspeed",
    name: "Lightspeed",
    description: "Lier votre compte Lightspeed Retail/Restaurant.",
    placeholder: "ACCOUNT_ID:TOKEN"
  },
  {
    id: "toast",
    name: "Toast POS",
    description: "Connecter votre système Toast (M2M API) pour importer les tickets hebdomadaires.",
    placeholder: "Client ID : Client Secret"
  },
  {
    id: "sumup",
    name: "SumUp",
    description: "Synchroniser l'historique de vos paiements SumUp réussis.",
    placeholder: "sup_sk_..."
  },
  {
    id: "zettle",
    name: "Zettle (PayPal)",
    description: "Importer vos transactions iZettle en temps réel.",
    placeholder: "Bearer Token Zettle"
  }
];

export default function IntegrationsSettingsPage() {
  const { profile } = useAuth();
  const [integrations, setIntegrations] = useState<Record<string, IntegrationRecord>>({});
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurant_integrations")
        .select("*")
        .eq("restaurant_id", profile!.id);

      if (error) throw error;

      const acc: Record<string, IntegrationRecord> = {};
      for (const row of data || []) {
        acc[row.provider] = row;
      }
      setIntegrations(acc);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (provider: string, field: keyof IntegrationRecord, value: any) => {
    setIntegrations(prev => ({
      ...prev,
      [provider]: {
        ...(prev[provider] || { provider, access_token: "", is_active: false }),
        [field]: value
      }
    }));
  };

  const saveIntegration = async (provider: 'stripe' | 'square' | 'lightspeed' | 'toast' | 'sumup' | 'zettle') => {
    setSavingKeys(prev => ({ ...prev, [provider]: true }));
    setMessage(null);

    const record = integrations[provider];
    if (!record || !record.access_token) {
      setSavingKeys(prev => ({ ...prev, [provider]: false }));
      setMessage({ type: 'error', text: 'Veuillez renseigner une clé API avant d\'enregistrer.' });
      return;
    }

    try {
      const { error } = await supabase
        .from("restaurant_integrations")
        .upsert({
          restaurant_id: profile!.id,
          provider: provider,
          access_token: record.access_token || '',
          is_active: record.is_active || false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'restaurant_id,provider' });

      if (error) throw error;

      setMessage({ type: 'success', text: `Intégration ${provider} sauvegardée avec succès.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingKeys(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <>
      <header className="bg-[#F2F0E9] dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10 px-8 py-6">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-[#1A1A1A] dark:text-white">Connexions POS</h1>
          <p className="text-sm text-slate-500 mt-1 font-outfit">Synchronisation en direct & importation de données</p>
        </div>
      </header>

      <div className="p-8 max-w-5xl space-y-8">
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border font-medium ${message.type === 'error' ? 'bg-red-950/30 border-red-900/50 text-red-400' : 'bg-[#2E4036]/20 border-[#2E4036]/50 text-green-400'}`}>
            {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <Check className="w-5 h-5 flex-shrink-0" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {loading ? (
          <div className="text-slate-500">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrationsList.map((integration) => {
              const record = integrations[integration.id] || { access_token: '', is_active: false };
              const isSaving = savingKeys[integration.id];

              return (
                <div key={integration.id} className="bg-[#1A1A1A] text-[#F2F0E9] border border-[#2E4036] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative noise-bg-subtle">
                  <div className="px-6 py-5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                    <h3 className="font-jakarta font-bold text-xl">{integration.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-plex-mono font-semibold text-[#CC5833] tracking-widest uppercase">Activer</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={record.is_active}
                          onChange={(e) => handleUpdateField(integration.id, 'is_active', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CC5833]"></div>
                      </label>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col z-10">
                    <p className="text-sm font-outfit text-[#F2F0E9]/60 mb-8 leading-relaxed">{integration.description}</p>
                    
                    <div className="mt-auto space-y-4">
                      <div>
                        <label className="block text-xs font-plex-mono tracking-wider text-[#F2F0E9]/80 mb-2 uppercase">Clé d'API Secrète / Token</label>
                        <input
                          type="password"
                          value={record.access_token}
                          onChange={(e) => handleUpdateField(integration.id, 'access_token', e.target.value)}
                          placeholder={integration.placeholder}
                          className="w-full px-4 py-3 text-sm font-mono bg-black/20 border border-white/10 rounded-xl focus:border-[#CC5833] focus:ring-1 focus:ring-[#CC5833] outline-none text-[#F2F0E9] placeholder:text-white/20 transition-all"
                        />
                      </div>
                      <button
                        onClick={() => saveIntegration(integration.id)}
                        disabled={isSaving}
                        className="group w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#CC5833] text-[#F2F0E9] font-jakarta font-bold text-sm tracking-wide rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isSaving ? "Sauvegarde..." : (
                          <>
                            <Save className="w-4 h-4 group-hover:-translate-y-[1px] transition-transform" /> Enregistrer {integration.name}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
