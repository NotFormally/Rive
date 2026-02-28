"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Package, Beer, ArrowLeft, Search } from "lucide-react";

type ReturnRecord = {
  id: string;
  item_type: string;
  supplier_name: string;
  deposit_amount: number;
  returned_at: string;
  credit_applied: boolean;
};

const mockReturns: ReturnRecord[] = [
  { id: "1", item_type: "Fût 50L (Molson)", supplier_name: "Molson Coors", deposit_amount: 50.00, returned_at: "2026-02-20T10:00:00Z", credit_applied: true },
  { id: "2", item_type: "Caisse 24 (Verre)", supplier_name: "Distributeur QC", deposit_amount: 2.40, returned_at: "2026-02-18T14:30:00Z", credit_applied: true },
  { id: "3", item_type: "Fût 30L (Moosehead)", supplier_name: "Moosehead", deposit_amount: 30.00, returned_at: "2026-02-15T09:00:00Z", credit_applied: false },
  { id: "4", item_type: "Fût 50L (Molson)", supplier_name: "Molson Coors", deposit_amount: 50.00, returned_at: "2026-02-10T11:00:00Z", credit_applied: true },
  { id: "5", item_type: "Caisse 24 (Verre)", supplier_name: "Distributeur QC", deposit_amount: 2.40, returned_at: "2026-02-05T16:00:00Z", credit_applied: true },
];

export default function DepositsHistoryPage() {
  const { settings } = useAuth();
  const [returns] = useState<ReturnRecord[]>(mockReturns);

  const totalReturned = returns.reduce((sum, r) => sum + r.deposit_amount, 0);
  const totalCredited = returns.filter(r => r.credit_applied).reduce((sum, r) => sum + r.deposit_amount, 0);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 sm:px-8 py-4">
          <h1 className="text-xl font-bold">Tracker de Consignes</h1>
          <p className="text-sm text-slate-500">Suivi des fûts, bouteilles et argent immobilisé</p>
        </div>
        <div className="px-4 sm:px-8 flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <a href="/dashboard/deposits" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Tableau de Bord</a>
          <a href="/dashboard/deposits/history" className="py-3 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">Historique des Retours</a>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Total Retourné</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">${totalReturned.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Crédits Appliqués</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">${totalCredited.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Retours Récents</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {returns.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    {item.item_type.includes("Fût") ? <Beer className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{item.item_type}</p>
                    <p className="text-xs text-slate-500">{item.supplier_name} &middot; {new Date(item.returned_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">${item.deposit_amount.toFixed(2)}</p>
                  <span className={`text-xs font-medium ${item.credit_applied ? "text-emerald-600" : "text-amber-600"}`}>
                    {item.credit_applied ? "Crédité" : "En attente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
