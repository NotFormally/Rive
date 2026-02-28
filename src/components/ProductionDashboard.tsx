"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beaker, Settings, CheckCircle, Clock, RefreshCw } from "lucide-react";

type ProductionBatch = {
  id: string;
  name: string;
  recipe_name: string;
  recipe_id?: string;
  start_date: string;
  end_date?: string;
  expected_yield: number;
  actual_yield?: number;
  yield_unit: string;
  status: "fermenting" | "kegged" | "canned";
};

export function ProductionDashboard() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { profile } = useAuth();

  const loadBatches = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const res = await fetch('/api/production');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const mapped: ProductionBatch[] = data.map((b: Record<string, unknown>) => ({
        id: b.id as string,
        name: b.name as string,
        recipe_name: (b.recipes as Record<string, string>)?.name || 'Recette inconnue',
        recipe_id: b.recipe_id as string,
        start_date: b.start_date as string,
        end_date: b.end_date as string | undefined,
        expected_yield: b.expected_yield as number,
        actual_yield: b.actual_yield as number | undefined,
        yield_unit: (b.yield_unit as string) || 'L',
        status: b.status as ProductionBatch['status'],
      }));
      setBatches(mapped);
    } catch (error) {
      console.error('Failed to load production batches:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const updateStatus = async (id: string, newStatus: 'kegged' | 'canned') => {
    setUpdating(id);
    try {
      const res = await fetch('/api/production', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setBatches(prev => prev.map(b => b.id === id ? { ...b, status: newStatus, end_date: new Date().toISOString() } : b));
      }
    } catch (error) {
      console.error('Failed to update batch:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getDaysElapsed = (startDate: string) => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 3600 * 24));
  };

  const columns = [
    { title: "En Fermentation (Cuve)", status: "fermenting" as const, icon: <Beaker className="w-5 h-5 text-amber-500" /> },
    { title: "Enfûtage (Kegs)", status: "kegged" as const, icon: <Settings className="w-5 h-5 text-indigo-500" /> },
    { title: "Cannage / Bouteilles", status: "canned" as const, icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p>Chargement des productions...</p>
        </div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
          <Beaker className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucune production enregistrée</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Commencez par créer une recette de brassage dans l'éditeur de recettes, puis lancez votre première production ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Suivi des Brassins</h2>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{batches.length} production{batches.length > 1 ? 's' : ''} au total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {columns.map((col) => (
          <div key={col.status} className="bg-slate-50/50 rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm min-h-[200px] lg:min-h-[500px]">
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 text-xs h-8"
                        onClick={() => updateStatus(batch.id, 'kegged')}
                        disabled={updating === batch.id}
                      >
                        {updating === batch.id ? 'Transfert...' : 'Transférer en Fût'}
                      </Button>
                    )}
                    {col.status === "kegged" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 text-xs h-8"
                        onClick={() => updateStatus(batch.id, 'canned')}
                        disabled={updating === batch.id}
                      >
                        {updating === batch.id ? 'Transfert...' : 'Mettre en cannette'}
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
