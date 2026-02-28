"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
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

    if (!authLoading && user && subscription) {
      if (subscription.trialExpired) {
        // Allow access to settings (to manage billing) and success page
        if (!pathname.startsWith('/dashboard/settings') && 
            !pathname.startsWith('/dashboard/success') && 
            pathname !== '/pricing') {
          router.push("/pricing");
        }
      }
    }
  }, [user, subscription, authLoading, router, pathname]);

  if (authLoading) return <div className="p-8 text-center flex-1">Génération de l'espace...</div>;
  if (!user) return null;

  return (
    <div className="flex min-h-[100dvh] bg-background noise-bg text-foreground selection:bg-[--accent]/30">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col pt-20 md:pt-0 relative">
        <div className="flex-1 p-4 md:p-10">
          {children}
        </div>
        <VirtualSousChef />
      </main>
    </div>
  );
}
