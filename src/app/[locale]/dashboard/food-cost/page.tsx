"use client";

import { useAuth } from "@/components/AuthProvider";
import { FoodCostDashboard } from "@/components/FoodCostDashboard";

export default function FoodCostPage() {
  const { settings } = useAuth();
  
  if (!settings?.module_food_cost) {
    return (
      <div className="p-8 text-center text-slate-500">
        Ce module est désactivé. Vous pouvez l'activer dans les Paramètres.
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-4">
          <h1 className="text-xl font-bold">Food Cost</h1>
          <p className="text-sm text-slate-500">Analyse de rentabilité et marges brutes</p>
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard/food-cost" className="py-3 border-b-2 border-indigo-600 text-indigo-600">Vue Globale</a>
          <a href="/dashboard/food-cost/ingredients" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Ingrédients</a>
          <a href="/dashboard/food-cost/recipes" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Recettes</a>
        </div>
      </header>

      <div className="p-8 max-w-7xl">
        <FoodCostDashboard />
      </div>
    </>
  );
}
