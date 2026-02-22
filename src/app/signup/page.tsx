"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim() || !email.trim() || password.length < 6) {
      setError("Veuillez remplir tous les champs (mot de passe : 6 caractères min.)");
      return;
    }

    setLoading(true);
    setError("");

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Erreur lors de la création du compte.");
      setLoading(false);
      return;
    }

    if (!authData.session) {
      setError("Le paramètre 'Confirm email' est toujours actif sur Supabase. Désactivez-le dans Authentication > Providers > Email pour tester sans email de validation.");
      setLoading(false);
      return;
    }

    // 2. Generate a slug from the restaurant name
    const slug = restaurantName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // 3. Create the restaurant profile
    const { data: profileData, error: profileError } = await supabase
      .from("restaurant_profiles")
      .insert({
        user_id: authData.user.id,
        restaurant_name: restaurantName,
        slug: slug + "-" + Date.now().toString(36),
      })
      .select()
      .single();

    if (profileError || !profileData) {
      console.error("Profile creation error:", profileError);
      setError(`Compte créé, mais erreur de configuration : ${profileError?.message || 'Inconnue'}`);
      setLoading(false);
      return;
    }

    // 4. Create default module settings — Trial period, all modules ON
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await supabase.from("restaurant_settings").insert({
      restaurant_id: profileData.id,
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: true,
      module_menu_engineering: true,
      module_instagram: true,
      module_receipt_scanner: true,
      subscription_tier: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
    });

    // 5. Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Rive</h1>
        <p className="text-slate-500 mt-2">Créez votre espace restaurant</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Inscription</CardTitle>
          <CardDescription>Configurez votre restaurant en 30 secondes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nom du restaurant
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Chez Marcel"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@monrestaurant.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer mon espace"}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-500 mt-4">
            Déjà un compte ?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              Se connecter
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
