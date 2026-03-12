"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { validateRestaurantName, isHoneypotFilled } from "@/lib/validation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

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

  // Honeypot — invisible to humans, bots auto-fill it
  const honeypotRef = useRef("");
  // Turnstile
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"; // test key fallback

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check — silently reject bots
    if (isHoneypotFilled(honeypotRef.current)) {
      setLoading(true);
      // Fake success to not tip off the bot
      setTimeout(() => setError(t("error_confirm")), 1500);
      return;
    }

    if (!restaurantName.trim() || !email.trim() || password.length < 6) {
      setError(t("error_empty"));
      return;
    }

    // Validate restaurant name isn't gibberish
    const nameError = validateRestaurantName(restaurantName);
    if (nameError) {
      setError(t(nameError));
      return;
    }

    setLoading(true);
    setError("");

    // Verify Turnstile token server-side
    if (turnstileToken) {
      try {
        const tsRes = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const tsData = await tsRes.json();
        if (!tsData.success) {
          setError(t("error_turnstile"));
          setLoading(false);
          turnstileRef.current?.reset();
          setTurnstileToken(null);
          return;
        }
      } catch {
        // Fail open — don't block signup if verification service is down
        console.warn("[turnstile] Verification request failed, proceeding");
      }
    }

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

    // 4. Create default module settings — all modules enabled, quotas limit AI usage
    await supabase.from("restaurant_settings").insert({
      restaurant_id: profileData.id,
      module_logbook: true,
      module_menu_editor: true,
      module_food_cost: true,
      module_menu_engineering: true,
      module_instagram: true,
      module_receipt_scanner: true,
      module_reservations: true,
      module_smart_prep: true,
      module_deposits: true,
      module_variance: true,
      module_production: true,
      subscription_tier: 'free',
    });

    // 5. Create owner membership — links user to restaurant
    await supabase.from("restaurant_members").insert({
      restaurant_id: profileData.id,
      user_id: authData.user.id,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    });

    // 6. Detect country from timezone and notify admin (fire and forget)
    let country = '';
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Extract region from timezone (e.g., "America/Montreal" → "CA", "Europe/Paris" → "FR")
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const regionCode = new Intl.Locale(navigator.language).region;
      country = regionCode ? `${regionNames.of(regionCode)} (${regionCode})` : tz;
    } catch { /* fallback: empty */ }

    fetch('/api/notify-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_name: restaurantName,
        email,
        locale: currentLocale,
        country,
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

            {/* Honeypot — hidden from humans via CSS, bots auto-fill it */}
            <div className="absolute opacity-0 top-0 left-0 h-0 w-0 -z-10" aria-hidden="true">
              <label htmlFor="website">{t("honeypot_website")}</label>
              <input
                type="text"
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                onChange={(e) => { honeypotRef.current = e.target.value; }}
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

            {/* Cloudflare Turnstile — invisible/managed widget */}
            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={setTurnstileToken}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{
                  theme: "auto",
                  size: "compact",
                }}
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

function LoadingFallback() {
  const t = useTranslations("Common");
  return <div className="min-h-screen bg-background noise-bg flex items-center justify-center">{t("loading")}</div>;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupForm />
    </Suspense>
  );
}
