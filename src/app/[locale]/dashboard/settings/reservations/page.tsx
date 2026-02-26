"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

type ProviderType = 'libro' | 'resy' | 'zenchef';

interface IntegrationState {
  id: string;
  provider_name: ProviderType;
  status: 'active' | 'pending' | 'error';
  last_sync_at: string | null;
}

export default function ReservationIntegrationsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<IntegrationState[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  
  // Modals / Inputs state
  const [activeProviderSetup, setActiveProviderSetup] = useState<ProviderType | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!profile) return;
      setLoadingIntegrations(true);
      const { data, error } = await supabase
        .from('reservation_providers')
        .select('id, provider_name, status, last_sync_at')
        .eq('restaurant_id', profile.id)
        .in('provider_name', ['libro', 'resy', 'zenchef']);
        
      if (!error && data) {
        setIntegrations(data as IntegrationState[]);
      }
      setLoadingIntegrations(false);
    };
    
    fetchIntegrations();
  }, [profile]);

  const handleConnectProvider = async (provider: ProviderType) => {
    if (!profile) return;
    setSavingKey(true);
    
    try {
      // 1. Check if provider already exists in DB
      const existing = integrations.find(i => i.provider_name === provider);
      
      if (existing) {
        // Update
        await supabase
          .from('reservation_providers')
          .update({ api_key: apiKeyInput, status: 'active' })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('reservation_providers')
          .insert({
            restaurant_id: profile.id,
            provider_name: provider,
            api_key: apiKeyInput,
            status: 'active'
          });
      }
      
      // Refresh local state
      const { data } = await supabase
        .from('reservation_providers')
        .select('id, provider_name, status, last_sync_at')
        .eq('restaurant_id', profile.id)
        .in('provider_name', ['libro', 'resy', 'zenchef']);
        
      if (data) setIntegrations(data as IntegrationState[]);
      
      setActiveProviderSetup(null);
      setApiKeyInput("");
      alert(`${provider} connecté avec succès !`);
      
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la connexion");
    } finally {
      setSavingKey(false);
    }
  };

  const providers = [
    { id: 'libro', name: 'Libro Reserve', description: 'Logiciel de réservation canadien.', logo: 'L' },
    { id: 'resy', name: 'Resy', description: 'L\'un des leaders mondiaux de la réservation.', logo: 'R' },
    { id: 'zenchef', name: 'Zenchef', description: 'La référence européenne (sans commission).', logo: 'Z' }
  ] as const;

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/settings')}>
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Intégrations Réservations</h1>
          <p className="text-sm text-slate-500">Connectez vos plateformes natives (Libro, Resy, Zenchef)</p>
        </div>
      </header>

      <main className="p-8 max-w-3xl space-y-6">
        {providers.map(provider => {
          const integration = integrations.find(i => i.provider_name === provider.id);
          const isConnected = integration?.status === 'active';
          
          return (
            <Card key={provider.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                    {provider.logo}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </div>
                </div>
                {isConnected ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle2 className="h-4 w-4" /> Connecté
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
                    <AlertCircle className="h-4 w-4" /> Non connecté
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {activeProviderSetup === provider.id ? (
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl mt-4 space-y-4">
                    <p className="text-sm text-slate-600">
                      Entrez votre clé API {provider.name}. Vous pouvez la trouver dans les paramètres développeur de votre compte {provider.name}.
                    </p>
                    <input
                      type="text"
                      placeholder="sk_live_..."
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => handleConnectProvider(provider.id)} 
                        disabled={!apiKeyInput || savingKey}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {savingKey ? "Connexion..." : "Valider la connexion"}
                      </Button>
                      <Button variant="ghost" onClick={() => { setActiveProviderSetup(null); setApiKeyInput(""); }}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                       {isConnected 
                          ? `Dernière synchronisation : ${integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString() : 'Jamais'}`
                          : "Synchronisation automatique de l'historique et action bi-directionnelle."}
                    </p>
                    <Button 
                      variant={isConnected ? "outline" : "default"}
                      onClick={() => setActiveProviderSetup(provider.id)}
                    >
                      {isConnected ? "Modifier la connexion" : `Connecter ${provider.name}`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </main>
    </>
  );
}
