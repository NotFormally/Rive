"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Check, X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

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
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  yield_portions?: number;
};

export default function RecipesPage() {
  const { profile, settings } = useAuth();
  const t = useTranslations("Reserve");
  const tc = useTranslations("Common");

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
          prep_time_minutes,
          cook_time_minutes,
          yield_portions,
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
        prep_time_minutes: existing.prep_time_minutes,
        cook_time_minutes: existing.cook_time_minutes,
        yield_portions: existing.yield_portions,
      });
    } else {
      setEditingRecipe({
        menu_item_id: menuItemId,
        recipe_ingredients: [],
        yield_portions: 1,
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
      setError(t("validation_error"));
      return;
    }

    try {
      let recipeId = editingRecipe.id;

      const recipeFields = {
        prep_time_minutes: editingRecipe.prep_time_minutes || null,
        cook_time_minutes: editingRecipe.cook_time_minutes || null,
        yield_portions: editingRecipe.yield_portions || 1,
      };

      if (!recipeId) {
        // Insert new recipe
        const { data: newRecipe, error: insErr } = await supabase
          .from("recipes")
          .insert({
            restaurant_id: profile!.id,
            menu_item_id: editingRecipe.menu_item_id,
            ...recipeFields,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        recipeId = newRecipe.id;
      } else {
        // Update recipe fields + delete old ingredients
        await supabase
          .from("recipes")
          .update(recipeFields)
          .eq("id", recipeId);
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
        {tc("module_disabled")}
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
            <h1 className="text-xl font-bold text-slate-900">{t("food_cost_title")}</h1>
            <p className="text-sm text-slate-500">{t("food_cost_desc")}</p>
          </div>
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard/food-cost" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">{t("tab_overview")}</a>
          <a href="/dashboard/food-cost/ingredients" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">{t("tab_ingredients")}</a>
          <a href="/dashboard/food-cost/recipes" className="py-3 border-b-2 border-indigo-600 text-indigo-600">{t("tab_recipes")}</a>
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
            <div className="p-8 text-center text-slate-500">{tc("loading")}</div>
          ) : menuItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>{t("no_items_found")}</p>
              <p className="text-sm mt-2">{t("add_items_hint")}</p>
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
                            ? t("recipe_summary", { count: currentRecipe.recipe_ingredients.length, cost: getRecipeCost(currentRecipe) })
                            : t("no_recipe")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {hasRecipe ? (
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{t("configured")}</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">{t("to_configure")}</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {isExpanded && editingRecipe && (
                      <div className="px-6 pb-6 bg-slate-50 border-t border-slate-100">
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">{t("recipe_ingredients_label")}</label>
                          <div className="space-y-3">
                            {editingRecipe.recipe_ingredients.map((ri, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <select
                                  value={ri.ingredient_id}
                                  onChange={(e) => handleUpdateIngredientRow(idx, 'ingredient_id', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                >
                                  <option value="" disabled>{t("select_ingredient")}</option>
                                  {ingredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit_cost}$ / {ing.unit})</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  placeholder={t("qty_placeholder")}
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
                            {t("add_ingredient")}
                          </button>
                        </div>

                        {/* Time & Yield Fields */}
                        <div className="mt-6 border-t border-slate-200 pt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-3">{t("time_yield")}</label>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">{t("prep_time")}</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={editingRecipe.prep_time_minutes ?? ""}
                                  onChange={(e) => setEditingRecipe({ ...editingRecipe, prep_time_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                                  placeholder="30"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                                <span className="text-xs text-slate-400 shrink-0">{/* i18n-ignore */}min</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">{t("cook_time")}</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={editingRecipe.cook_time_minutes ?? ""}
                                  onChange={(e) => setEditingRecipe({ ...editingRecipe, cook_time_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                                  placeholder="45"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                                <span className="text-xs text-slate-400 shrink-0">{/* i18n-ignore */}min</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">{t("yield_portions")}</label>
                              <input
                                type="number"
                                min="1"
                                value={editingRecipe.yield_portions ?? 1}
                                onChange={(e) => setEditingRecipe({ ...editingRecipe, yield_portions: e.target.value ? parseInt(e.target.value) : 1 })}
                                placeholder="1"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">{t("prep_time_help")}</p>
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
                            {tc("cancel")}
                          </button>
                          <button
                            onClick={handleSaveRecipe}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            {t("save_recipe")}
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
