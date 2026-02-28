"use client";

import { useState, Suspense } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

function LoginForm() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(t("error_auth"));
      setLoading(false);
    } else {
      if (plan && authData?.user) {
        const { data: memberData } = await supabase
          .from("restaurant_members")
          .select("restaurant_id")
          .eq("user_id", authData.user.id)
          .single();

        if (memberData?.restaurant_id) {
          try {
            const res = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                priceId: plan,
                restaurantId: memberData.restaurant_id,
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
      }
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-jakarta font-bold text-foreground tracking-tighter">{t("login_title")}</h1>
        <p className="text-muted-foreground font-outfit mt-2">{t("login_subtitle")}</p>
      </div>

      <Card className="w-full max-w-sm rounded-[2rem] border-border/50 shadow-xl shadow-black/5">
        <CardHeader className="text-center p-6 pb-2">
          <CardTitle className="font-jakarta font-bold">{t("login_card_title")}</CardTitle>
          <CardDescription className="font-outfit">{t("login_card_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full bg-primary hover:bg-[#3A4F43] text-primary-foreground rounded-xl"
              disabled={loading}
            >
              {loading ? t("btn_loading_login") : t("btn_login")}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground font-outfit mt-4">
            {t("no_account")}{" "}
            <button
              onClick={() => router.push(`/signup${plan ? `?plan=${plan}` : ""}`)}
              className="text-accent hover:underline font-medium"
            >
              {t("link_signup")}
            </button>
            <div className="text-xs text-center mt-6">
               <Link href="/cgu" className="underline hover:text-foreground text-muted-foreground">
                 {t("terms_link")}
               </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background noise-bg flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
