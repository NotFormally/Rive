"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function CheckoutSuccessPage() {
  const t = useTranslations('Dashboard'); // Using a general translation or we can hardcode for now if we don't have it
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Optional: We could verify the session_id with our backend here, 
    // but the Stripe webhook handles the actual subscription fulfillment so it's safe to just show success.
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-2xl bg-[#E8E4DD]/50 backdrop-blur-md rounded-[2rem] overflow-hidden">
        <div className="bg-[#2E4036] p-8 text-center text-[#F2F0E9]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F2F0E9]/10 mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#CC5833]" />
          </div>
          <h1 className="font-jakarta font-bold text-3xl mb-3">Paiement Réussi</h1>
          <p className="font-outfit text-[#F2F0E9]/80 text-lg">
            Merci pour votre confiance. Votre abonnement a bien été activé.
          </p>
        </div>
        
        <CardContent className="p-8 space-y-8 bg-[#F2F0E9]">
          <div className="space-y-4 text-center">
            <p className="font-outfit text-slate-600">
              Vos nouveaux modules sont maintenant débloqués et prêts à être utilisés. Vous pouvez les retrouver dans votre barre de navigation.
            </p>
          </div>

          <Link href="/dashboard" className="block w-full">
            <button className="w-full flex items-center justify-center gap-2 bg-[#CC5833] hover:bg-[#b84d2d] text-white py-4 rounded-[2rem] font-bold transition-all duration-300 shadow-lg shadow-[#CC5833]/20 hover:scale-[1.02]">
              Aller au tableau de bord
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
