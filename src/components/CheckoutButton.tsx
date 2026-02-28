"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";

type CheckoutButtonProps = {
  priceId?: string;
  cta: string;
  ctaColor: string;
  presentationClasses?: string;
}

export function CheckoutButton({ priceId, cta, ctaColor, presentationClasses = "" }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { profile, loading: authLoading } = useAuth();
  const tCommon = useTranslations('Common');

  const handleCheckout = async () => {
    if (!priceId) {
      window.location.href = "mailto:dock@rivehub.com";
      return;
    }

    if (authLoading) return;

    if (!profile) {
      window.location.assign(`/signup?plan=${priceId}`);
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
      alert(tCommon('error_payment'));
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className={`block w-full text-center py-4 rounded-[2rem] font-bold text-sm transition-colors duration-300 ${ctaColor} ${presentationClasses}`}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : cta}
    </button>
  );
}
