"use client";

import { useTranslations } from "next-intl";
import { AccountingDashboard } from "@/components/AccountingDashboard";

export default function AccountingPage() {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-jakarta font-bold text-foreground tracking-tighter mb-1 md:mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
            Le Nid
          </h1>
          <p className="text-lg font-outfit text-primary/90 font-medium">
            Intelligence Financière et Modélisation
          </p>
        </div>
      </header>
      
      <AccountingDashboard />
    </div>
  );
}
