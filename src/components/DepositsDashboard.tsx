"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, AlertCircle, Search, RefreshCw, Beer, DollarSign } from "lucide-react";

// Types
type DepositItem = {
  id: string;
  item_type: string;
  supplier_name: string;
  deposit_amount: number;
  status: "held" | "returned" | "lost";
  created_at: string;
};

// Mock data (since SQL migration might not have run yet)
const mockDeposits: DepositItem[] = [
  { id: "1", item_type: "Fût 50L (Molson)", supplier_name: "Molson Coors", deposit_amount: 50.00, status: "held", created_at: "2026-02-25T10:00:00Z" },
  { id: "2", item_type: "Fût 30L (Moosehead)", supplier_name: "Moosehead", deposit_amount: 30.00, status: "held", created_at: "2026-02-24T14:30:00Z" },
  { id: "3", item_type: "Fût 50L (Molson)", supplier_name: "Molson Coors", deposit_amount: 50.00, status: "held", created_at: "2026-02-23T09:15:00Z" },
  { id: "4", item_type: "Caisse 24 (Verre)", supplier_name: "Distributeur QC", deposit_amount: 2.40, status: "returned", created_at: "2026-02-20T11:00:00Z" },
  { id: "5", item_type: "Fût 30L (Micro)", supplier_name: "Brasserie Locale", deposit_amount: 40.00, status: "lost", created_at: "2026-02-15T16:20:00Z" },
];

export function DepositsDashboard() {
  const [deposits, setDeposits] = useState<DepositItem[]>(mockDeposits);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch delay
    setTimeout(() => setLoading(false), 800);
  }, []);

  const totalHeld = deposits.filter(d => d.status === "held").reduce((acc, curr) => acc + curr.deposit_amount, 0);
  const totalReturned = deposits.filter(d => d.status === "returned").reduce((acc, curr) => acc + curr.deposit_amount, 0);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p>Chargement des consignes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-50 rounded-full transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-500">Argent Immobilisé</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-slate-900">${totalHeld.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Consignes en attente de retour</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-50 rounded-full transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-500">Retourné (Ce Mois)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-slate-900">${totalReturned.toFixed(2)}</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-50 rounded-full transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-500">Fûts Pleins vs Vides</CardTitle>
            <Beer className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-slate-900">12 / 4</div>
            <p className="text-xs text-slate-500 mt-1">4 fûts prêts à être retournés</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column (Main Table) */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Inventaire des Consignes</CardTitle>
                <p className="text-sm text-slate-500">Toutes les consignes extraites de vos factures GFS/Molson/etc.</p>
              </div>
              <Button size="sm" variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Filtrer
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {deposits.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        {item.item_type.includes("Fût") ? <Beer className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.item_type}</p>
                        <p className="text-sm text-slate-500">{item.supplier_name} • Reçu le {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pl-14 md:pl-0">
                      <div className="text-left md:text-right">
                        <p className="font-medium text-slate-900">${item.deposit_amount.toFixed(2)}</p>
                        <Badge 
                          variant={item.status === "held" ? "outline" : item.status === "returned" ? "secondary" : "destructive"}
                          className={
                            item.status === "held" ? "text-amber-600 border-amber-200 bg-amber-50 mt-1" :
                            item.status === "returned" ? "text-emerald-600 border-emerald-200 bg-emerald-50 mt-1" : "mt-1"
                          }
                        >
                          {item.status === "held" ? "En possession" : item.status === "returned" ? "Retourné" : "Perdu"}
                        </Badge>
                      </div>
                      {item.status === "held" && (
                        <Button size="sm" className="shrink-0 text-xs sm:text-sm">Retourné</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Insights/Actions) */}
        <div className="space-y-6">
          <Card className="bg-indigo-900 text-white shadow-md border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-indigo-100">
                <AlertCircle className="h-5 w-5" />
                Action Requise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-200">
                Vous avez accumulé pour plus de <span className="font-bold text-white">${totalHeld.toFixed(2)}</span> de consignes cette semaine. 
                Pensez à retourner les fûts Molson avant vendredi pour l'ajustement du crédit sur votre prochaine commande.
              </p>
              <Button className="mt-4 w-full bg-white text-indigo-900 hover:bg-slate-100">
                Générer un bon de retour
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Mécanique OCR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Rive extrait automatiquement les lignes "Deposit" ou "Consigne" de vos factures scannées pour isoler ce montant de votre véritable indicateur Food Cost / Pour Cost.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md text-sm font-mono text-slate-500">
                Ligne détectée: <br/>
                <span className="text-slate-800 font-bold">1x FÛT 50L DEP  |  $50.00</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
