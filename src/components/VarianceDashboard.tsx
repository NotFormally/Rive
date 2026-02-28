"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, TrendingDown, GlassWater, AlertTriangle, ArrowRight } from "lucide-react";

type VarianceItem = {
  id: string;
  name: string;
  category: string;
  theoretical_usage: number;
  actual_usage: number;
  unit: string;
  variance_amount: number;
  variance_cost: number;
  period_start?: string;
  period_end?: string;
};

type SpoilageForm = {
  quantity: string;
  unit: string;
  reason: string;
  logged_by: string;
};

export function VarianceDashboard() {
  const [variances, setVariances] = useState<VarianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSpoilageForm, setShowSpoilageForm] = useState(false);
  const [spoilageForm, setSpoilageForm] = useState<SpoilageForm>({ quantity: '', unit: 'oz', reason: 'spill', logged_by: '' });
  const [submittingSpoilage, setSubmittingSpoilage] = useState(false);
  const { profile } = useAuth();

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const res = await fetch('/api/variance');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const mapped: VarianceItem[] = data.map((v: Record<string, unknown>) => ({
        id: v.id as string,
        name: (v.ingredients as Record<string, string>)?.name || 'Produit inconnu',
        category: (v.ingredients as Record<string, string>)?.category || '',
        theoretical_usage: v.theoretical_usage as number,
        actual_usage: v.actual_usage as number,
        unit: (v.ingredients as Record<string, string>)?.unit || '',
        variance_amount: v.variance_amount as number,
        variance_cost: v.variance_cost as number,
        period_start: v.period_start as string,
        period_end: v.period_end as string,
      }));
      setVariances(mapped);
    } catch (error) {
      console.error('Failed to load variances:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitSpoilage = async () => {
    if (!spoilageForm.quantity) return;
    setSubmittingSpoilage(true);
    try {
      const res = await fetch('/api/spoilage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseFloat(spoilageForm.quantity),
          unit: spoilageForm.unit,
          reason: spoilageForm.reason,
          logged_by: spoilageForm.logged_by || null,
        }),
      });
      if (res.ok) {
        setShowSpoilageForm(false);
        setSpoilageForm({ quantity: '', unit: 'oz', reason: 'spill', logged_by: '' });
      }
    } catch (error) {
      console.error('Failed to submit spoilage:', error);
    } finally {
      setSubmittingSpoilage(false);
    }
  };

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

  if (variances.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucune variance détectée</h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Les données de variance apparaîtront automatiquement après vos premiers dépôts et ventes POS. Rive croisera vos ventes théoriques avec votre inventaire réel.
          </p>
          <Button
            onClick={() => setShowSpoilageForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <GlassWater className="w-4 h-4 mr-2" />
            Déclarer une perte
          </Button>
        </div>
        {showSpoilageForm && (
          <Card className="shadow-sm border-slate-200 max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-base">Déclarer une perte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Quantité</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={spoilageForm.quantity}
                    onChange={(e) => setSpoilageForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Ex: 2.5"
                  />
                  <select
                    value={spoilageForm.unit}
                    onChange={(e) => setSpoilageForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="oz">oz</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="unit">unité</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Raison</label>
                <select
                  value={spoilageForm.reason}
                  onChange={(e) => setSpoilageForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="spill">Renversé (Spill)</option>
                  <option value="spoil">Périmé (Spoil)</option>
                  <option value="comp">Offert (Comp)</option>
                  <option value="staff">Consommation personnel</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Déclaré par (optionnel)</label>
                <input
                  type="text"
                  value={spoilageForm.logged_by}
                  onChange={(e) => setSpoilageForm(prev => ({ ...prev, logged_by: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Nom du membre d'équipe"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={submitSpoilage}
                  disabled={submittingSpoilage || !spoilageForm.quantity}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {submittingSpoilage ? 'Envoi...' : 'Enregistrer'}
                </Button>
                <Button variant="outline" onClick={() => setShowSpoilageForm(false)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* KPIs */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
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
            <div className="text-3xl font-bold text-amber-900">{itemsWithHighVariance.length} produit{itemsWithHighVariance.length > 1 ? 's' : ''}</div>
            <p className="text-xs text-amber-700 mt-1">Pertes de plus de 20$ / item</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm flex flex-col justify-center items-center relative overflow-hidden">
          <CardContent className="pt-6 relative z-10 text-center space-y-2 w-full">
            <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full items-center justify-center flex mb-2">
              <GlassWater className="h-6 w-6" />
            </div>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              onClick={() => setShowSpoilageForm(!showSpoilageForm)}
            >
              Déclarer Périmé / Renversé
            </Button>
            <p className="text-xs text-slate-500 mt-2">Justifiez vos pertes (&ldquo;Spill&rdquo; ou &ldquo;Comp&rdquo;)</p>
          </CardContent>
        </Card>
      </div>

      {showSpoilageForm && (
        <Card className="shadow-sm border-slate-200 max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-base">Déclarer une perte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Quantité</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={spoilageForm.quantity}
                  onChange={(e) => setSpoilageForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Ex: 2.5"
                />
                <select
                  value={spoilageForm.unit}
                  onChange={(e) => setSpoilageForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="oz">oz</option>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="unit">unité</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Raison</label>
              <select
                value={spoilageForm.reason}
                onChange={(e) => setSpoilageForm(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="spill">Renversé (Spill)</option>
                <option value="spoil">Périmé (Spoil)</option>
                <option value="comp">Offert (Comp)</option>
                <option value="staff">Consommation personnel</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Déclaré par (optionnel)</label>
              <input
                type="text"
                value={spoilageForm.logged_by}
                onChange={(e) => setSpoilageForm(prev => ({ ...prev, logged_by: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Nom du membre d'équipe"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={submitSpoilage}
                disabled={submittingSpoilage || !spoilageForm.quantity}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {submittingSpoilage ? 'Envoi...' : 'Enregistrer'}
              </Button>
              <Button variant="outline" onClick={() => setShowSpoilageForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 px-4 sm:px-6">
          <div>
            <CardTitle className="text-base sm:text-lg">Rapport Théorique vs Réel</CardTitle>
            <p className="text-xs sm:text-sm text-slate-500">Comparaison POS vs inventaire réel.</p>
          </div>
        </CardHeader>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Produit</th>
                <th className="px-6 py-4 font-medium text-right">POS (Théorique)</th>
                <th className="px-6 py-4 font-medium text-right">Réel</th>
                <th className="px-6 py-4 font-medium text-right">Écart</th>
                <th className="px-6 py-4 font-medium text-right text-red-600">Perte</th>
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
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {variances.sort((a,b) => b.variance_cost - a.variance_cost).map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <span className="text-sm font-bold text-red-600 tabular-nums">-${item.variance_cost.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>POS: {item.theoretical_usage} {item.unit}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-medium text-slate-900">{item.actual_usage} {item.unit}</span>
                <span className="text-red-600 font-medium">+{item.variance_amount.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
