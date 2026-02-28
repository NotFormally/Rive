"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, TrendingDown, GlassWater, AlertTriangle, ArrowRight } from "lucide-react";

type VarianceItem = {
  id: string;
  name: string;
  category: string;
  theoretical_usage: number; // e.g. from POS sales
  actual_usage: number;      // e.g. from inventory counts
  unit: string;
  variance_amount: number;
  variance_cost: number;
};

// Mock Data
const mockVariances: VarianceItem[] = [
  { id: "1", name: "Tequila Casamigos Reposado", category: "Spiritueux", theoretical_usage: 45.5, actual_usage: 56.0, unit: "oz", variance_amount: 10.5, variance_cost: 31.50 },
  { id: "2", name: "Fût IPA Locale 50L", category: "Bière Fût", theoretical_usage: 40.0, actual_usage: 42.0, unit: "L", variance_amount: 2.0, variance_cost: 12.00 },
  { id: "3", name: "Sirop Simple Maison", category: "Prep", theoretical_usage: 300, actual_usage: 320, unit: "ml", variance_amount: 20, variance_cost: 0.80 },
  { id: "4", name: "Vodka Grey Goose", category: "Spiritueux", theoretical_usage: 25.0, actual_usage: 26.0, unit: "oz", variance_amount: 1.0, variance_cost: 3.50 },
  { id: "5", name: "Vin Rouge Pinot Noir (Verre)", category: "Vin", theoretical_usage: 15, actual_usage: 22, unit: "verres (5oz)", variance_amount: 7, variance_cost: 24.50 },
];

export function VarianceDashboard() {
  const [variances, setVariances] = useState<VarianceItem[]>(mockVariances);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => setLoading(false), 800);
  }, []);

  const totalLostCost = variances.reduce((sum, item) => sum + item.variance_cost, 0);
  const itemsWithHighVariance = variances.filter(v => v.variance_cost > 20);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p>Croisement POS et Inventaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-red-100 rounded-full transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-red-800">Coût Total du Coulage</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-red-700">${totalLostCost.toFixed(2)}</div>
            <p className="text-xs text-red-600 mt-1">Perte nette de la dernière période</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-100 rounded-full transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-amber-800">Alertes Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-amber-900">{itemsWithHighVariance.length} produits</div>
            <p className="text-xs text-amber-700 mt-1">Pertes de plus de 20$ / item</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm flex flex-col justify-center items-center relative overflow-hidden">
          <CardContent className="pt-6 relative z-10 text-center space-y-2 w-full">
            <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full items-center justify-center flex mb-2">
              <GlassWater className="h-6 w-6" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              Déclarer Périmé / Renversé
            </Button>
            <p className="text-xs text-slate-500 mt-2">Justifiez vos pertes ("Spill" ou "Comp")</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Rapport Théorique vs Réel</CardTitle>
            <p className="text-sm text-slate-500">Comparaison entre ce que le POS dit avoir vendu et ce qu'il manque vraiment dans l'inventaire.</p>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Produit</th>
                <th className="px-6 py-4 font-medium text-right">Vente Pos (Théorique)</th>
                <th className="px-6 py-4 font-medium text-right">Utilisation Réelle</th>
                <th className="px-6 py-4 font-medium text-right">Écart (Variance)</th>
                <th className="px-6 py-4 font-medium text-right text-red-600">Perte Financière</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variances.sort((a,b) => b.variance_cost - a.variance_cost).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-slate-600">
                    {item.theoretical_usage} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-slate-900 font-medium tracking-tight">
                    {item.actual_usage} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-medium tabular-nums">
                      <AlertCircle className="w-3.5 h-3.5" />
                      +{item.variance_amount.toFixed(1)} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600 tabular-nums">
                    -${item.variance_cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  );
}
