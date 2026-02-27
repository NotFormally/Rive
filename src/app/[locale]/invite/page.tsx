"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      // Check if user is logged in
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="text-3xl font-bold text-slate-900">Rive</div>

        {status === "loading" && (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-slate-500">Traitement de votre invitation...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl">✅</div>
            <p className="text-lg font-semibold text-slate-900">{message}</p>
            <p className="text-sm text-slate-500">
              Vous avez maintenant accès au tableau de bord du restaurant.
            </p>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-colors"
            >
              Accéder au dashboard →
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-5xl">❌</div>
            <p className="text-lg font-semibold text-red-600">{message}</p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-xl font-medium transition-colors"
            >
              Retour à l&apos;accueil
            </button>
          </>
        )}

        {status === "login_needed" && (
          <>
            <div className="text-5xl">🔐</div>
            <p className="text-lg font-semibold text-slate-900">{message}</p>
            <p className="text-sm text-slate-500">
              Connectez-vous ou créez un compte, puis revenez sur ce lien.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/${locale}/login?redirect=/${locale}/invite?token=${token}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push(`/${locale}/signup?redirect=/${locale}/invite?token=${token}`)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 px-6 rounded-xl font-medium transition-colors"
              >
                Créer un compte
              </button>
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <InviteAcceptContent />
    </Suspense>
  );
}
