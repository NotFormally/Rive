"use client";

import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SpoilageFormPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center gap-4">
          <a href="/dashboard/variance" className="text-slate-500 hover:text-slate-900">← Retour</a>
          <div>
            <h1 className="text-xl font-bold">Déclarer une Perte</h1>
            <p className="text-sm text-slate-500">Enregistrer un produit renversé, périmé ou offert (Comp)</p>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Détails de la perte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="ingredient">Produit / Ingrédient</Label>
                <select id="ingredient" className="w-full border-slate-200 rounded-md p-2 text-sm bg-white border">
                  <option value="">Sélectionnez un produit...</option>
                  <option value="tequila">Tequila Casamigos Reposado</option>
                  <option value="fût">Fût IPA Locale 50L</option>
                  <option value="verre">Verre à vin (Casse)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantité Perdue</Label>
                  <Input id="qty" type="number" step="0.5" placeholder="Ex: 1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité</Label>
                  <select id="unit" className="w-full border-slate-200 rounded-md p-2 text-sm bg-white border">
                    <option value="oz">oz</option>
                    <option value="L">Litres (L)</option>
                    <option value="ml">ml</option>
                    <option value="verre">Verre</option>
                    <option value="unit">Unité</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Raison</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 border-slate-200">
                    <input type="radio" name="reason" value="spill" className="mr-3" required />
                    Renversé (Spill / Casse)
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 border-slate-200">
                    <input type="radio" name="reason" value="comp" className="mr-3" required />
                    Offert au client (Comp)
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 border-slate-200">
                    <input type="radio" name="reason" value="spoil" className="mr-3" required />
                    Périmé / Mauvais goût (Spoil)
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 border-slate-200">
                    <input type="radio" name="reason" value="staff" className="mr-3" required />
                    Erreur Staff / Consommation
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note Additionnelle (Optionnelle)</Label>
                <Input id="note" placeholder="Ex: Client n'aimait pas le cocktail..." />
              </div>
            </CardContent>
            
            <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-between rounded-b-lg">
              <Button type="button" variant="ghost">Annuler</Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Enregistrement..." : "Enregistrer la perte"}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {success && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md animate-in fade-in slide-in-from-bottom-2 text-sm font-medium">
            ✅ La perte a bien été enregistrée et déduite de l'inventaire.
          </div>
        )}
      </div>
    </>
  );
}
