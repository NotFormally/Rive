"use client";

import { useAuth } from "@/components/AuthProvider";
import { FoodCostDashboard } from "@/components/FoodCostDashboard";
import { useTranslations } from "next-intl";

export default function FoodCostPage() {
  const { settings } = useAuth();
  const t = useTranslations("Reserve");
  const tc = useTranslations("Common");
  
  if (!settings?.module_food_cost) {
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
          <h1 className="text-xl font-bold">{t("food_cost_title")}</h1>
          <p className="text-sm text-slate-500">{t("food_cost_desc")}</p>
        </div>
        <div className="px-4 sm:px-8 flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <a href="/dashboard/food-cost" className="py-3 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">{t("tab_overview")}</a>
          <a href="/dashboard/food-cost/ingredients" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t("tab_ingredients")}</a>
          <a href="/dashboard/food-cost/recipes" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t("tab_recipes")}</a>
          <a href="/dashboard/food-cost/invoices" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t("tab_invoices")}</a>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-7xl">
        <FoodCostDashboard />
      </div>
    </>
  );
}
