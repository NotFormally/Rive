"use client";

import { useAuth } from "@/components/AuthProvider";
import { MenuEngineeringDashboard } from "@/components/MenuEngineeringDashboard";

export default function EngineeringPage() {
  const { settings } = useAuth();
  
  if (!settings?.module_menu_engineering) {
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
          <h1 className="text-xl font-bold">Carte Marine</h1>
          <p className="text-sm text-slate-500">Classification BCG et optimisation IA de votre menu</p>
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard/engineering" className="py-3 border-b-2 border-indigo-600 text-indigo-600">Matrice</a>
          <a href="/dashboard/engineering/sales" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Ventes POS</a>
        </div>
      </header>

      <div className="p-8 max-w-7xl">
        <MenuEngineeringDashboard />
      </div>
    </>
  );
}
