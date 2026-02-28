"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, AlertCircle, Search, RefreshCw, Beer, DollarSign, Plus } from "lucide-react";

type DepositItem = {
  id: string;
  item_type: string;
  supplier_name?: string;
  deposit_amount: number;
  status: "held" | "returned" | "lost";
  created_at: string;
  returned_date?: string;
  invoice_id?: string;
  invoices?: { supplier_name: string } | null;
};

export function DepositsDashboard() {
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { profile } = useAuth();

  const loadDeposits = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const res = await fetch('/api/deposits');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setDeposits(data.map((d: DepositItem) => ({
        ...d,
        supplier_name: d.invoices?.supplier_name || 'Fournisseur inconnu',
      })));
    } catch (error) {
      console.error('Failed to load deposits:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  const markReturned = async (id: string) => {
    setUpdating(id);
    try {
      const res = await fetch('/api/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'returned' }),
      });
      if (res.ok) {
        setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'returned' as const, returned_date: new Date().toISOString() } : d));
      }
    } catch (error) {
      console.error('Failed to update deposit:', error);
    } finally {
      setUpdating(null);
    }
  };

  const markLost = async (id: string) => {
    setUpdating(id);
    try {
      const res = await fetch('/api/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'lost' }),
      });
      if (res.ok) {
        setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'lost' as const } : d));
      }
    } catch (error) {
      console.error('Failed to update deposit:', error);
    } finally {
      setUpdating(null);
    }
  };

  const filteredDeposits = filterStatus === "all" ? deposits : deposits.filter(d => d.status === filterStatus);
  const totalHeld = deposits.filter(d => d.status === "held").reduce((acc, curr) => acc + curr.deposit_amount, 0);
  const totalReturned = deposits.filter(d => d.status === "returned").reduce((acc, curr) => acc + curr.deposit_amount, 0);
  const heldCount = deposits.filter(d => d.status === "held").length;

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

  if (deposits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucun dépôt enregistré</h3>
        <p className="text-sm text-slate-500 max-w-md">
          Les consignes apparaîtront ici automatiquement lorsque vous scannerez une facture contenant des lignes de dépôt (fûts, caisses, etc.).
        </p>
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
            <p className="text-xs text-slate-500 mt-1">{heldCount} consigne{heldCount > 1 ? 's' : ''} en attente de retour</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-50 rounded-full transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-500">Retourné (Total)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-slate-900">${totalReturned.toFixed(2)}</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Consignes récupérées
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-50 rounded-full transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-500">En Possession</CardTitle>
            <Beer className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-slate-900">{heldCount}</div>
            <p className="text-xs text-slate-500 mt-1">{heldCount > 0 ? 'À retourner pour récupérer le crédit' : 'Tout est retourné'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column (Main Table) */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Inventaire des Consignes</CardTitle>
                <p className="text-sm text-slate-500">Consignes extraites de vos factures scannées</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm rounded-lg border border-slate-200 px-3 py-1.5 bg-white"
                >
                  <option value="all">Tous ({deposits.length})</option>
                  <option value="held">En possession ({deposits.filter(d => d.status === 'held').length})</option>
                  <option value="returned">Retournés ({deposits.filter(d => d.status === 'returned').length})</option>
                  <option value="lost">Perdus ({deposits.filter(d => d.status === 'lost').length})</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {filteredDeposits.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        {item.item_type.toLowerCase().includes("fût") || item.item_type.toLowerCase().includes("keg") ? <Beer className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.item_type}</p>
                        <p className="text-sm text-slate-500">{item.supplier_name} &bull; {new Date(item.created_at).toLocaleDateString('fr-CA')}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pl-14 md:pl-0">
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
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="text-xs sm:text-sm"
                            onClick={() => markReturned(item.id)}
                            disabled={updating === item.id}
                          >
                            {updating === item.id ? '...' : 'Retourné'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => markLost(item.id)}
                            disabled={updating === item.id}
                          >
                            Perdu
                          </Button>
                        </div>
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
          {heldCount > 0 && (
            <Card className="bg-indigo-900 text-white shadow-md border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-100">
                  <AlertCircle className="h-5 w-5" />
                  Action Requise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-200">
                  Vous avez <span className="font-bold text-white">${totalHeld.toFixed(2)}</span> de consignes en attente.
                  Retournez-les pour récupérer le crédit sur votre prochaine commande.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Mécanique OCR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Rive extrait automatiquement les lignes &ldquo;Deposit&rdquo; ou &ldquo;Consigne&rdquo; de vos factures scannées pour isoler ce montant de votre véritable indicateur Food Cost / Pour Cost.
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
