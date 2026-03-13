"use client";

import { useAuth } from "@/components/AuthProvider";
import { ProductionDashboard } from "@/components/ProductionDashboard";
import { useTranslations } from "next-intl";

export default function ProductionPage() {
  const { settings } = useAuth();
  const t = useTranslations("Production");
  const tc = useTranslations("Common");

  if (!settings?.module_production) {
    return (
      <div className="p-8 text-center text-slate-500">
        {tc("module_disabled")}
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 sm:px-8 py-4">
          <h1 className="text-xl font-bold">{t("brewingTitle")}</h1>
          <p className="text-sm text-slate-500">{t("brewingSubtitle")}</p>
        </div>
        <div className="px-4 sm:px-8 flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <a href="/dashboard/production" className="py-3 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">{t("tabActiveBatches")}</a>
          <a href="/dashboard/production/recipes" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t("tabRecipes")}</a>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-[1600px] w-full mx-auto">
        <ProductionDashboard />
      </div>
    </>
  );
}
