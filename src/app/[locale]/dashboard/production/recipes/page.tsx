"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Beaker, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Recipe = {
  id: string;
  name: string;
  style: string;
  og: number;
  fg: number;
  ibu: number;
  abv: number;
  batch_size_L: number;
  last_brewed: string | null;
};

const mockRecipes: Recipe[] = [
  { id: "1", name: "IPA Côte Ouest", style: "West Coast IPA", og: 1.065, fg: 1.012, ibu: 65, abv: 6.9, batch_size_L: 500, last_brewed: "2026-02-10" },
  { id: "2", name: "Stout Impériale", style: "Imperial Stout", og: 1.090, fg: 1.020, ibu: 50, abv: 9.2, batch_size_L: 300, last_brewed: "2026-02-18" },
  { id: "3", name: "Blonde Lager", style: "American Lager", og: 1.045, fg: 1.008, ibu: 18, abv: 4.8, batch_size_L: 1000, last_brewed: "2026-01-25" },
  { id: "4", name: "Sour Framboise", style: "Berliner Weisse", og: 1.038, fg: 1.006, ibu: 5, abv: 4.2, batch_size_L: 400, last_brewed: "2026-02-05" },
  { id: "5", name: "Pilsner Bohème", style: "Czech Pilsner", og: 1.050, fg: 1.010, ibu: 35, abv: 5.2, batch_size_L: 500, last_brewed: null },
];

export default function ProductionRecipesPage() {
  const { settings } = useAuth();
  const [recipes] = useState<Recipe[]>(mockRecipes);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 sm:px-8 py-4">
          <h1 className="text-xl font-bold">Production Brassicole</h1>
          <p className="text-sm text-slate-500">Suivi des brassins de la cuve au fût</p>
        </div>
        <div className="px-4 sm:px-8 flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <a href="/dashboard/production" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Brassins en cours</a>
          <a href="/dashboard/production/recipes" className="py-3 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">Recettes (Malt/Houblon)</a>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-[1600px] w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Catalogue de Recettes</h2>
          <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Recette
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900">{recipe.name}</h3>
                  <p className="text-xs text-slate-500">{recipe.style}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Beaker className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center mb-3">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-500">OG</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{recipe.og.toFixed(3)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-500">FG</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{recipe.fg.toFixed(3)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-500">IBU</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{recipe.ibu}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-500">ABV</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{recipe.abv}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Beaker className="w-3.5 h-3.5" />
                  {recipe.batch_size_L} L / batch
                </span>
                {recipe.last_brewed ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(recipe.last_brewed).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Jamais brassée</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
