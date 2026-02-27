"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-2xl bg-secondary/50 backdrop-blur-md rounded-[2rem] overflow-hidden">
        <div className="bg-primary p-8 text-center text-primary-foreground">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-foreground/10 mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-jakarta font-bold text-3xl mb-3">Paiement Réussi</h1>
          <p className="font-outfit text-primary-foreground/80 text-lg">
            Merci pour votre confiance. Votre abonnement a bien été activé.
          </p>
        </div>

        <CardContent className="p-8 space-y-8 bg-background">
          <div className="space-y-4 text-center">
            <p className="font-outfit text-muted-foreground">
              Vos nouveaux modules sont maintenant débloqués et prêts à être utilisés. Vous pouvez les retrouver dans votre barre de navigation.
            </p>
          </div>

          <Link href="/dashboard" className="block w-full">
            <button className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-[#b84d2d] text-accent-foreground py-4 rounded-[2rem] font-bold transition-all duration-300 shadow-lg shadow-accent/20 hover:scale-[1.02]">
              Aller au tableau de bord
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
