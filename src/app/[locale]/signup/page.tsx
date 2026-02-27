"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function SignupPage() {
  const t = useTranslations("Auth");
  const currentLocale = useLocale();
  const tCommon = useTranslations('Common');
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim() || !email.trim() || password.length < 6) {
      setError(t("error_empty"));
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
      setError(authError?.message || t("error_creation"));
      setLoading(false);
      return;
    }

    if (!authData.session) {
      setError(t("error_confirm"));
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
      setError(`${t('error_creation')} ${profileError?.message || tCommon('error_unknown')}`);
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

    // 5. Notify admin of new signup (fire and forget)
    fetch('/api/notify-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_name: restaurantName,
        email,
        locale: currentLocale,
      }),
    }).catch(() => {}); // non-blocking

    // 6. Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">{t("signup_title")}</h1>
        <p className="text-slate-500 mt-2">{t("signup_subtitle")}</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{t("signup_card_title")}</CardTitle>
          <CardDescription>{t("signup_card_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("label_name")}
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder={t("placeholder_name")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("label_email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder_email")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("label_password")}
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
              {loading ? t("btn_loading_signup") : t("btn_signup")}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-500 mt-4">
            {t("has_account")}{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              {t("link_login")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
