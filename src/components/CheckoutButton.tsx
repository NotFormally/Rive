"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type CheckoutButtonProps = {
  priceId?: string;
  cta: string;
  ctaColor: string;
  presentationClasses?: string;
}

export function CheckoutButton({ priceId, cta, ctaColor, presentationClasses = "" }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const handleCheckout = async () => {
    // Si pas l'id du prix, c'est peut-être l'option "Sur-mesure" sans ID 
    if (!priceId) {
      window.location.href = "mailto:dock@rivehub.com";
      return;
    }

    if (authLoading) return;

    if (!profile) {
      // Pas authentifié : on envoie vers le signup
      router.push(`/signup?plan=${priceId}`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: priceId,
          restaurantId: profile.id
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Erreur lors de la redirection vers le paiement.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className={`block w-full text-center py-4 rounded-[2rem] font-bold text-sm transition-all duration-300 hover:scale-[1.03] ${ctaColor} ${presentationClasses}`}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : cta}
    </button>
  );
}
