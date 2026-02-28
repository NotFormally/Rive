"use client";

import { useAuth } from "@/components/AuthProvider";
import { DepositsDashboard } from "@/components/DepositsDashboard";

export default function DepositsPage() {
  const { settings } = useAuth();
  
  // We can eventually add a permission check here similar to food_cost, but for now we'll just show it.

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-4">
          <h1 className="text-xl font-bold">Tracker de Consignes</h1>
          <p className="text-sm text-slate-500">Suivi des fûts, bouteilles et argent immobilisé</p>
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard/deposits" className="py-3 border-b-2 border-indigo-600 text-indigo-600">Tableau de Bord</a>
          <a href="/dashboard/deposits/history" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Historique des Retours</a>
        </div>
      </header>

      <div className="p-8 max-w-7xl">
        <DepositsDashboard />
      </div>
    </>
  );
}
