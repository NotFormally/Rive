"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beaker, Settings, CheckCircle, Clock } from "lucide-react";

type ProductionBatch = {
  id: string;
  name: string;
  recipe_name: string;
  start_date: string;
  expected_yield: number;
  yield_unit: string;
  status: "fermenting" | "kegged" | "canned";
};

const mockBatches: ProductionBatch[] = [
  { id: "1", name: "Brassage #042", recipe_name: "IPA Côte Ouest", start_date: "2026-02-10T08:00:00Z", expected_yield: 500, yield_unit: "L", status: "fermenting" },
  { id: "2", name: "Brassage #043", recipe_name: "Stout Impériale", start_date: "2026-02-18T09:30:00Z", expected_yield: 300, yield_unit: "L", status: "fermenting" },
  { id: "3", name: "Brassage #040", recipe_name: "Blonde Lager", start_date: "2026-01-25T10:00:00Z", expected_yield: 1000, yield_unit: "L", status: "kegged" },
  { id: "4", name: "Brassage #041", recipe_name: "Sour Framboise", start_date: "2026-02-05T14:00:00Z", expected_yield: 400, yield_unit: "L", status: "canned" },
];

export function ProductionDashboard() {
  const [batches, setBatches] = useState<ProductionBatch[]>(mockBatches);

  const getDaysElapsed = (startDate: string) => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 3600 * 24));
  };

  const columns = [
    { title: "En Fermentation (Cuve)", status: "fermenting", icon: <Beaker className="w-5 h-5 text-amber-500" /> },
    { title: "Enfûtage (Kegs)", status: "kegged", icon: <Settings className="w-5 h-5 text-indigo-500" /> },
    { title: "Cannage / Bouteilles", status: "canned", icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Suivi des Brassins</h2>
        <Button className="bg-indigo-600 hover:bg-indigo-700">Démarrer une Production</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col.status} className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-sm min-h-[500px]">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
              {col.icon}
              <h3 className="font-medium text-slate-700">{col.title}</h3>
              <Badge variant="secondary" className="ml-auto bg-slate-200 text-slate-700">
                {batches.filter(b => b.status === col.status).length}
              </Badge>
            </div>

            <div className="space-y-4">
              {batches.filter(b => b.status === col.status).map((batch) => (
                <Card key={batch.id} className="cursor-pointer hover:border-indigo-300 transition-colors shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">{batch.name}</div>
                        <div className="font-bold text-slate-900 mt-1">{batch.recipe_name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                        <Beaker className="w-3.5 h-3.5" />
                        {batch.expected_yield} {batch.yield_unit}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {getDaysElapsed(batch.start_date)} jours
                      </div>
                    </div>

                    {col.status === "fermenting" && (
                      <Button variant="outline" size="sm" className="w-full mt-4 text-xs h-8">
                        Transférer en Fût
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {batches.filter(b => b.status === col.status).length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm mt-4">
                  Aucun lot dans cette étape
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
