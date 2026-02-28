"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const locale = useLocale();
  const t = useTranslations("Invite");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "login_needed">("loading");
  const [message, setMessage] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("error_invalid_link"));
      return;
    }

    const acceptInvite = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus("login_needed");
        setMessage(t("login_needed"));
        return;
      }

      try {
        const res = await fetch("/api/team/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || t("success_default"));
          setRestaurantId(data.restaurantId);
        } else {
          setStatus("error");
          setMessage(data.error || t("error_accept"));
        }
      } catch {
        setStatus("error");
        setMessage(t("error_network"));
      }
    };

    acceptInvite();
  }, [token]);

  return (
    <div className="min-h-screen bg-background noise-bg flex items-center justify-center p-4">
      <div className="bg-card rounded-[2rem] shadow-2xl shadow-black/10 border border-border/50 p-8 md:p-10 max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="text-2xl font-outfit font-semibold text-foreground tracking-[0.3em] uppercase">RIVE</div>

        {status === "loading" && (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto" />
            <p className="text-sm font-outfit text-muted-foreground">{t("processing")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-lg font-jakarta font-bold text-foreground">{message}</p>
            <p className="text-sm font-outfit text-muted-foreground">
              {t("success_access")}
            </p>
            <Link
              href="/dashboard"
              className="block w-full bg-primary hover:bg-[#3A4F43] text-primary-foreground py-3 px-6 rounded-2xl font-bold font-outfit transition-all duration-300 hover:scale-[1.02]"
            >
              {t("btn_dashboard")}
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-3xl text-red-500">✕</span>
            </div>
            <p className="text-lg font-jakarta font-bold text-red-600">{message}</p>
            <Link
              href="/"
              className="block w-full bg-foreground hover:bg-foreground/90 text-background py-3 px-6 rounded-2xl font-bold font-outfit transition-all duration-300"
            >
              {t("btn_home")}
            </Link>
          </>
        )}

        {status === "login_needed" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-3xl text-accent">→</span>
            </div>
            <p className="text-lg font-jakarta font-bold text-foreground">{message}</p>
            <p className="text-sm font-outfit text-muted-foreground">
              {t("login_prompt")}
            </p>
            <div className="space-y-3">
              <a
                href={`/${locale}/login?redirect=/${locale}/invite?token=${token}`}
                className="block w-full bg-primary hover:bg-[#3A4F43] text-primary-foreground py-3 px-6 rounded-2xl font-bold font-outfit transition-all duration-300 text-center"
              >
                {t("btn_login")}
              </a>
              <a
                href={`/${locale}/signup?redirect=/${locale}/invite?token=${token}`}
                className="block w-full bg-secondary hover:bg-secondary/80 text-foreground py-3 px-6 rounded-2xl font-bold font-outfit transition-all duration-300 text-center"
              >
                {t("btn_signup")}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    }>
      <InviteAcceptContent />
    </Suspense>
  );
}
