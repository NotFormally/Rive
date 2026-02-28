"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { IntelligenceGauge } from "@/components/IntelligenceGauge";
import VirtualSousChef from "@/components/VirtualSousChef";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, subscription, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    // Freemium: when trial expires, users keep access with limited features
    // No redirect to pricing — they can browse the dashboard with freemium modules
  }, [user, subscription, authLoading, router, pathname]);

  if (authLoading) return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background noise-bg text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-[#CC5833]/20 border-t-[#CC5833] rounded-full animate-spin"></div>
        <p className="font-plex-mono text-xs md:text-sm tracking-widest uppercase opacity-70 animate-pulse text-[#CC5833]">
          Génération de l'espace...
        </p>
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="flex min-h-[100dvh] bg-background noise-bg text-foreground selection:bg-[--accent]/30">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col pt-20 md:pt-0 relative">
        <IntelligenceGauge />
        <div className="flex-1 p-4 md:p-10">
          {children}
        </div>
        <VirtualSousChef />
      </main>
    </div>
  );
}
