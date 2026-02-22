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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4">
        <div>
          <h1 className="text-xl font-bold">Food Cost</h1>
          <p className="text-sm text-slate-500">Analyse de rentabilité et marges brutes</p>
        </div>
      </header>

      <div className="p-8 max-w-7xl">
        <FoodCostDashboard />
      </div>
    </>
  );
}
