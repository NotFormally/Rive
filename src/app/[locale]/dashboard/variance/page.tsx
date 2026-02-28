"use client";

import { useAuth } from "@/components/AuthProvider";
import { VarianceDashboard } from "@/components/VarianceDashboard";

export default function VariancePage() {
  const { settings } = useAuth();
  
  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-4">
          <h1 className="text-xl font-bold">Pertes & Coulage (Variance)</h1>
          <p className="text-sm text-slate-500">Comparez vos ventes théoriques (POS) à votre utilisation réelle (Inventaire)</p>
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard/variance" className="py-3 border-b-2 border-indigo-600 text-indigo-600">Rapport de Variance</a>
          <a href="/dashboard/variance/spoilage" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Déclarer une Perte (Spill/Comp)</a>
        </div>
      </header>

      <div className="p-8 max-w-7xl">
        <VarianceDashboard />
      </div>
    </>
  );
}
