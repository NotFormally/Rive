"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { supabase } from "@/lib/supabase";

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const locale = useLocale();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "login_needed">("loading");
  const [message, setMessage] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien d'invitation invalide.");
      return;
    }

    const acceptInvite = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus("login_needed");
        setMessage("Veuillez vous connecter pour accepter l'invitation.");
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
          setMessage(data.message || "Invitation acceptée !");
          setRestaurantId(data.restaurantId);
        } else {
          setStatus("error");
          setMessage(data.error || "Erreur lors de l'acceptation.");
        }
      } catch {
        setStatus("error");
        setMessage("Erreur réseau. Réessayez plus tard.");
      }
    };

    acceptInvite();
  }, [token]);

  return (
    <div className="min-h-screen bg-background noise-bg flex items-center justify-center p-4">
      <div className="bg-card rounded-[2rem] shadow-2xl shadow-black/10 border border-border/50 p-8 md:p-10 max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="text-3xl font-jakarta font-bold text-foreground tracking-tighter">Rive</div>

        {status === "loading" && (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto" />
            <p className="text-sm font-outfit text-muted-foreground">Traitement de votre invitation...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-lg font-jakarta font-bold text-foreground">{message}</p>
            <p className="text-sm font-outfit text-muted-foreground">
              Vous avez maintenant accès au tableau de bord du restaurant.
            </p>
            <Link
              href="/dashboard"
              className="block w-full bg-primary hover:bg-[#3A4F43] text-primary-foreground py-3 px-6 rounded-2xl font-bold font-outfit transition-all duration-300 hover:scale-[1.02]"
            >
              Accéder au dashboard
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
              Retour à l&apos;accueil
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
              Connectez-vous ou créez un compte, puis revenez sur ce lien.
            </p>
            <div className="space-y-3">
              <a
                href={`/${locale}/login?redirect=/${locale}/invite?token=${token}`}
                className="block w-full bg-primary hover:bg-[#3A4F43] text-primary-foreground py-3 px-6 rounded-2xl font-bold font-outfit transition-all duration-300 text-center"
              >
                Se connecter
              </a>
              <a
                href={`/${locale}/signup?redirect=/${locale}/invite?token=${token}`}
                className="block w-full bg-secondary hover:bg-secondary/80 text-foreground py-3 px-6 rounded-2xl font-bold font-outfit transition-all duration-300 text-center"
              >
                Créer un compte
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
