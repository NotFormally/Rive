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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4">
        <div>
          <h1 className="text-xl font-bold">Connexions POS</h1>
          <p className="text-sm text-slate-500">Gérez l'intégration de votre système de caisse avec Rive</p>
        </div>
      </header>

      <div className="p-8 max-w-4xl space-y-6">
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
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
                <div key={integration.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{integration.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Activer</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={record.is_active}
                          onChange={(e) => handleUpdateField(integration.id, 'is_active', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-sm text-slate-600 mb-6">{integration.description}</p>
                    
                    <div className="mt-auto space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Clé d'API Secrète / Token</label>
                        <input
                          type="password"
                          value={record.access_token}
                          onChange={(e) => handleUpdateField(integration.id, 'access_token', e.target.value)}
                          placeholder={integration.placeholder}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => saveIntegration(integration.id)}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? "Sauvegarde..." : (
                          <>
                            <Save className="w-4 h-4" /> Enregistrer {integration.name}
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
