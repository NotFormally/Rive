"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MODULE_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  module_logbook:          { label: "Cahier de Bord Intelligent",  emoji: "📋", description: "Notes IA, classification automatique, urgences" },
  module_menu_editor:      { label: "Gestionnaire de Menu + QR",   emoji: "🍽️", description: "Menu CRUD, mini-site web public, QR Code" },
  module_food_cost:        { label: "Food Cost — Marges",          emoji: "💰", description: "Calcul automatique des marges par plat" },
  module_menu_engineering: { label: "Menu Engineering — Carte Marine", emoji: "🧭", description: "Classification Phare/Ancre/Dérive/Écueil + IA" },
  module_receipt_scanner:  { label: "Scanner de Reçus (OCR)",      emoji: "📸", description: "Extraction IA des factures fournisseurs" },
  module_instagram:        { label: "Générateur Instagram",        emoji: "📱", description: "Posts IA pour vos plats avec captions et hashtags" },
};

export default function SettingsPage() {
  const { user, profile, settings, subscription, loading: authLoading, refreshSettings } = useAuth();
  const [localSettings, setLocalSettings] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileTagline, setProfileTagline] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        module_logbook: settings.module_logbook,
        module_menu_editor: settings.module_menu_editor,
        module_food_cost: settings.module_food_cost,
        module_menu_engineering: settings.module_menu_engineering,
        module_receipt_scanner: settings.module_receipt_scanner,
        module_instagram: settings.module_instagram,
      });
    }
    if (profile) {
      setProfileName(profile.restaurant_name);
      setProfileTagline(profile.tagline || "");
    }
  }, [settings, profile]);

  const handleToggle = async (moduleKey: string) => {
    const newValue = !localSettings[moduleKey];
    setLocalSettings(prev => ({ ...prev, [moduleKey]: newValue }));

    if (profile) {
      await supabase
        .from("restaurant_settings")
        .update({ [moduleKey]: newValue })
        .eq("restaurant_id", profile.id);
      await refreshSettings();
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from("restaurant_profiles")
      .update({
        restaurant_name: profileName,
        tagline: profileTagline,
      })
      .eq("id", profile.id);
    setSaving(false);
  };

  const handlePortalSession = async () => {
    if (!subscription?.stripeCustomerId) return;
    try {
      setPortalLoading(true);
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripeCustomerId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      alert("Impossible de charger le portail.");
      setPortalLoading(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center flex-1">Génération de l'espace...</div>;
  if (!user) return null;

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4">
        <div>
          <h1 className="text-xl font-bold">Menu & Paramètres</h1>
          <p className="text-sm text-slate-500">Gérez vos préférences et modules</p>
        </div>
      </header>

      <main className="p-8 max-w-3xl space-y-8">
        {/* Restaurant Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏠 Mon Restaurant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom du restaurant</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slogan</label>
              <input
                type="text"
                value={profileTagline}
                onChange={(e) => setProfileTagline(e.target.value)}
                placeholder="Cuisine française contemporaine"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>

        {/* Module Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🧩 Modules Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-6">Activez ou désactivez les modules que vous souhaitez voir apparaître dans votre barre latérale de navigation.</p>
            <div className="space-y-4">
              {Object.entries(MODULE_LABELS).map(([key, config]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.emoji}</span>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{config.label}</p>
                      <p className="text-xs text-slate-500">{config.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings[key] ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings[key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👤 Compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-600">
              <strong>Email :</strong> {user.email}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Slug du menu QR :</strong> /menu/{profile?.slug}
            </p>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💳 Abonnement & Facturation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              <strong>Forfait actuel :</strong> <span className="capitalize">{subscription?.tier || 'trial'}</span>
            </p>
            {subscription?.stripeCustomerId ? (
              <Button 
                onClick={handlePortalSession} 
                disabled={portalLoading}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {portalLoading ? "Chargement du portail..." : "Gérer mon abonnement (Stripe)"}
              </Button>
            ) : (
              <div>
                <p className="text-sm text-slate-500 mb-4">Vous êtes actuellement sur le système d'essai gratuit ou manuel. Vous n'avez pas de facturation automatique configurée.</p>
                <Button onClick={() => router.push('/pricing')} className="bg-blue-600 text-white hover:bg-blue-700">
                  Voir les forfaits
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
