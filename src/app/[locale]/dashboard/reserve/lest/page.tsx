"use client";

import { useAuth } from "@/components/AuthProvider";
import { DepositsDashboard } from "@/components/DepositsDashboard";
import { useTranslations } from "next-intl";

export default function DepositsPage() {
  const { settings } = useAuth();
  const t = useTranslations("Reserve");
  const tc = useTranslations("Common");

  if (!settings?.module_deposits) {
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
          <h1 className="text-xl font-bold">{t("trackerTitle")}</h1>
          <p className="text-sm text-slate-500">{t("trackerSubtitle")}</p>
        </div>
        <div className="px-4 sm:px-8 flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <a href="/dashboard/deposits" className="py-3 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">{t("tabDashboard")}</a>
          <a href="/dashboard/deposits/history" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t("tabReturnHistory")}</a>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-7xl">
        <DepositsDashboard />
      </div>
    </>
  );
}
