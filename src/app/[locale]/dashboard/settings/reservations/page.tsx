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
      <header className="bg-[#F2F0E9] dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10 px-8 py-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/settings')} className="hover:bg-black/5 dark:hover:bg-white/5">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Button>
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-[#1A1A1A] dark:text-white">Intégrations Réservations</h1>
          <p className="text-sm font-outfit text-slate-500 mt-1">Connectez vos plateformes natives (Libro, Resy, Zenchef)</p>
        </div>
      </header>

      <main className="p-8 max-w-4xl space-y-8">
        {providers.map(provider => {
          const integration = integrations.find(i => i.provider_name === provider.id);
          const isConnected = integration?.status === 'active';
          
          return (
            <Card key={provider.id} className="bg-[#1A1A1A] text-[#F2F0E9] border border-[#2E4036] rounded-[2rem] overflow-hidden shadow-2xl relative noise-bg-subtle">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.06] bg-white/[0.02] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-black/40 rounded-xl flex items-center justify-center font-jakarta font-bold text-xl text-[#F2F0E9] border border-white/10 shadow-inner">
                    {provider.logo}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-jakarta text-[#F2F0E9] tracking-wide">{provider.name}</CardTitle>
                    <CardDescription className="font-outfit text-[#F2F0E9]/60">{provider.description}</CardDescription>
                  </div>
                </div>
                {isConnected ? (
                  <div className="flex items-center gap-2 text-green-400 text-xs font-plex-mono uppercase tracking-widest font-semibold bg-[#2E4036]/20 border border-[#2E4036]/50 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="h-4 w-4" /> Connecté
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[#F2F0E9]/40 text-xs font-plex-mono uppercase tracking-widest font-semibold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                    <AlertCircle className="h-4 w-4" /> Non connecté
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {activeProviderSetup === provider.id ? (
                  <div className="bg-black/20 p-5 border border-white/10 rounded-[1.5rem] mt-2 space-y-5">
                    <p className="text-sm font-outfit text-[#F2F0E9]/80 leading-relaxed">
                      Entrez votre clé API {provider.name}. Vous pouvez la trouver dans les paramètres développeur de votre compte {provider.name}.
                    </p>
                    <input
                      type="text"
                      placeholder="sk_live_..."
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm font-mono text-[#F2F0E9] placeholder:text-white/20 focus:outline-none focus:border-[#CC5833] focus:ring-1 focus:ring-[#CC5833] transition-all"
                    />
                    <div className="flex items-center gap-3 pt-2">
                       <Button 
                        onClick={() => handleConnectProvider(provider.id)} 
                        disabled={!apiKeyInput || savingKey}
                        className="bg-[#CC5833] text-[#F2F0E9] hover:bg-[#b04b2b] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl font-jakarta font-bold px-6 h-11"
                      >
                        {savingKey ? "Connexion..." : "Valider la connexion"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => { setActiveProviderSetup(null); setApiKeyInput(""); }}
                        className="text-[#F2F0E9]/60 hover:text-[#F2F0E9] hover:bg-white/5 rounded-xl font-outfit h-11 px-6"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-outfit text-[#F2F0E9]/50">
                       {isConnected 
                          ? `Dernière synchronisation : ${integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString() : 'Jamais'}`
                          : "Synchronisation automatique de l'historique et action bi-directionnelle."}
                    </p>
                    <Button 
                      onClick={() => setActiveProviderSetup(provider.id)}
                      className="bg-white/10 text-[#F2F0E9] hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl font-jakarta font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all h-10 px-6"
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
