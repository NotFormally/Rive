"use client";

import { useState, Suspense } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

function SignupForm() {
  const t = useTranslations("Auth");
  const currentLocale = useLocale();
  const tCommon = useTranslations('Common');
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  
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

    // 4. Create default module settings — Freemium tier
    await supabase.from("restaurant_settings").insert({
      restaurant_id: profileData.id,
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: false,
      module_menu_engineering: false,
      module_instagram: false,
      module_receipt_scanner: false,
      subscription_tier: 'freemium',
    });

    // 5. Create owner membership — links user to restaurant
    await supabase.from("restaurant_members").insert({
      restaurant_id: profileData.id,
      user_id: authData.user.id,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    });

    // 6. Notify admin of new signup (fire and forget)
    fetch('/api/notify-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_name: restaurantName,
        email,
        locale: currentLocale,
      }),
    }).catch(() => {}); // non-blocking

    // 7. Check if there's a plan parameter for Stripe Checkout
    if (plan) {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId: plan,
            restaurantId: profileData.id,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (e) {
        console.error("Payment redirect failed:", e);
      }
    }

    // 8. Redirect to dashboard as a fallback or if no plan is selected
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background noise-bg flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-jakarta font-bold text-foreground tracking-tighter">{t("signup_title")}</h1>
        <p className="text-muted-foreground font-outfit mt-2">{t("signup_subtitle")}</p>
      </div>

      <Card className="w-full max-w-sm rounded-[2rem] border-border/50 shadow-xl shadow-black/5">
        <CardHeader className="text-center p-6 pb-2">
          <CardTitle className="font-jakarta font-bold">{t("signup_card_title")}</CardTitle>
          <CardDescription className="font-outfit">{t("signup_card_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium font-outfit text-foreground/70 mb-1">
                {t("label_name")}
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder={t("placeholder_name")}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium font-outfit text-foreground/70 mb-1">
                {t("label_email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder_email")}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium font-outfit text-foreground/70 mb-1">
                {t("label_password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                disabled={loading}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium font-outfit">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-[#b84d2d] text-accent-foreground rounded-xl"
              disabled={loading}
            >
              {loading ? t("btn_loading_signup") : t("btn_signup")}
            </Button>
            <div className="text-xs text-center text-muted-foreground font-outfit mt-4">
              {t("terms_agreement")}{" "}
              <Link href="/cgu" className="underline hover:text-foreground">
                {t("terms_link")}
              </Link>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground font-outfit mt-4">
            {t("has_account")}{" "}
            <button
              onClick={() => router.push(`/login${plan ? `?plan=${plan}` : ""}`)}
              className="text-accent hover:underline font-medium"
            >
              {t("link_login")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background noise-bg flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
