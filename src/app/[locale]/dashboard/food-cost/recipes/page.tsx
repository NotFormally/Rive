"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Check, X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
};

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
};

type RecipeIngredient = {
  ingredient_id: string;
  quantity: number;
  unit: string;
};

type Recipe = {
  id?: string;
  menu_item_id: string;
  recipe_ingredients: RecipeIngredient[];
};

export default function RecipesPage() {
  const { profile, settings } = useAuth();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch menu items manually added by user in standard table
      const { data: menuData, error: menuErr } = await supabase
        .from("menu_items")
        .select("id, name")
        .eq("restaurant_id", profile!.id)
        .order("name");
      if (menuErr) throw menuErr;

      // Fetch ingredients
      const { data: ingData, error: ingErr } = await supabase
        .from("ingredients")
        .select("id, name, unit, unit_cost")
        .eq("restaurant_id", profile!.id)
        .order("name");
      if (ingErr) throw ingErr;

      // Fetch recipes
      const { data: recipeData, error: recipeErr } = await supabase
        .from("recipes")
        .select(`
          id,
          menu_item_id,
          recipe_ingredients (
            ingredient_id,
            quantity,
            unit
          )
        `)
        .eq("restaurant_id", profile!.id);
      if (recipeErr) throw recipeErr;

      const recipeMap: Record<string, Recipe> = {};
      for (const r of recipeData || []) {
        recipeMap[r.menu_item_id] = r;
      }

      setMenuItems(menuData || []);
      setIngredients(ingData || []);
      setRecipes(recipeMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecipe = (menuItemId: string) => {
    const existing = recipes[menuItemId];
    if (existing) {
      setEditingRecipe({
        id: existing.id,
        menu_item_id: menuItemId,
        recipe_ingredients: existing.recipe_ingredients.map(ri => ({ ...ri })),
      });
    } else {
      setEditingRecipe({
        menu_item_id: menuItemId,
        recipe_ingredients: [],
      });
    }
    setExpandedItemId(menuItemId);
    setError(null);
  };

  const handleAddIngredientRow = () => {
    if (!editingRecipe) return;
    setEditingRecipe({
      ...editingRecipe,
      recipe_ingredients: [
        ...editingRecipe.recipe_ingredients,
        { ingredient_id: "", quantity: 0, unit: "" }
      ]
    });
  };

  const handleUpdateIngredientRow = (index: number, field: keyof RecipeIngredient, value: any) => {
    if (!editingRecipe) return;
    const newItems = [...editingRecipe.recipe_ingredients];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill unit if ingredient selected
    if (field === "ingredient_id") {
      const selectedIng = ingredients.find(i => i.id === value);
      if (selectedIng) {
        newItems[index].unit = selectedIng.unit;
      }
    }

    setEditingRecipe({ ...editingRecipe, recipe_ingredients: newItems });
  };

  const handleRemoveIngredientRow = (index: number) => {
    if (!editingRecipe) return;
    const newItems = [...editingRecipe.recipe_ingredients];
    newItems.splice(index, 1);
    setEditingRecipe({ ...editingRecipe, recipe_ingredients: newItems });
  };

  const handleSaveRecipe = async () => {
    if (!editingRecipe) return;

    // Validation
    const invalidRows = editingRecipe.recipe_ingredients.filter(ri => !ri.ingredient_id || ri.quantity <= 0);
    if (invalidRows.length > 0) {
      setError("Veuillez sélectionner un ingrédient et définir une quantité valide pour chaque ligne.");
      return;
    }

    try {
      let recipeId = editingRecipe.id;

      if (!recipeId) {
        // Insert new recipe
        const { data: newRecipe, error: insErr } = await supabase
          .from("recipes")
          .insert({
            restaurant_id: profile!.id,
            menu_item_id: editingRecipe.menu_item_id
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        recipeId = newRecipe.id;
      } else {
        // Delete old ingredients
        await supabase
          .from("recipe_ingredients")
          .delete()
          .eq("recipe_id", recipeId);
      }

      // Insert new ingredients
      if (editingRecipe.recipe_ingredients.length > 0 && recipeId) {
        const payload = editingRecipe.recipe_ingredients.map(ri => ({
          recipe_id: recipeId,
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          unit: ri.unit
        }));

        const { error: riErr } = await supabase
          .from("recipe_ingredients")
          .insert(payload);
        
        if (riErr) throw riErr;
      }

      setEditingRecipe(null);
      setExpandedItemId(null);
      setError(null);
      loadData();

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!settings?.module_food_cost) {
    return (
      <div className="p-8 text-center text-slate-500">
        Ce module est désactivé. Vous pouvez l'activer dans les Paramètres.
      </div>
    );
  }

  // Helper to calculate total cost of a recipe
  const getRecipeCost = (recipe: Recipe) => {
    let cost = 0;
    for (const ri of recipe.recipe_ingredients) {
      const ing = ingredients.find(i => i.id === ri.ingredient_id);
      if (ing) cost += ing.unit_cost * ri.quantity;
    }
    return cost.toFixed(2);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Food Cost</h1>
            <p className="text-sm text-slate-500">Associations Menu / Ingrédients</p>
          </div>
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard/food-cost" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Vue Globale</a>
          <a href="/dashboard/food-cost/ingredients" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Ingrédients</a>
          <a href="/dashboard/food-cost/recipes" className="py-3 border-b-2 border-indigo-600 text-indigo-600">Recettes</a>
        </div>
      </header>

      <div className="p-8 max-w-4xl">
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Chargement...</div>
          ) : menuItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>Aucun plat trouvé dans le menu.</p>
              <p className="text-sm mt-2">Ajoutez des plats via l'éditeur de menu (ou attendez la synchro POS) pour configurer leurs recettes.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {menuItems.map(item => {
                const isExpanded = expandedItemId === item.id;
                const hasRecipe = !!recipes[item.id];
                const currentRecipe = recipes[item.id];

                return (
                  <div key={item.id} className="flex flex-col">
                    {/* Header Row */}
                    <div 
                      className={`flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                      onClick={() => !isExpanded ? handleEditRecipe(item.id) : setExpandedItemId(null)}
                    >
                      <div>
                        <h3 className="font-medium text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {hasRecipe 
                            ? `${currentRecipe.recipe_ingredients.length} ingrédient(s) — Coût estimé : ${getRecipeCost(currentRecipe)}$`
                            : "Pas de recette configurée"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {hasRecipe ? (
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Configuré</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">À configurer</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {isExpanded && editingRecipe && (
                      <div className="px-6 pb-6 bg-slate-50 border-t border-slate-100">
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Ingrédients de la recette</label>
                          <div className="space-y-3">
                            {editingRecipe.recipe_ingredients.map((ri, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <select
                                  value={ri.ingredient_id}
                                  onChange={(e) => handleUpdateIngredientRow(idx, 'ingredient_id', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                >
                                  <option value="" disabled>Sélectionner un ingrédient...</option>
                                  {ingredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit_cost}$ / {ing.unit})</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  placeholder="Qté"
                                  step="0.01"
                                  value={ri.quantity || ""}
                                  onChange={(e) => handleUpdateIngredientRow(idx, 'quantity', parseFloat(e.target.value))}
                                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                                <span className="text-sm text-slate-500 w-12">{ri.unit || "-"}</span>
                                <button
                                  onClick={() => handleRemoveIngredientRow(idx)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <button
                            onClick={handleAddIngredientRow}
                            className="mt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter un ingrédient
                          </button>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setExpandedItemId(null);
                              setEditingRecipe(null);
                              setError(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleSaveRecipe}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Sauvegarder la recette
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
