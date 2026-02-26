"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";

type Ingredient = {
  id: string;
  name: string;
  unit_cost: number;
  unit: string;
};

export default function IngredientsPage() {
  const { profile, settings } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", unit_cost: "", unit: "" });

  useEffect(() => {
    if (profile) {
      loadIngredients();
    }
  }, [profile]);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name, unit_cost, unit")
        .eq("restaurant_id", profile!.id)
        .order("name");

      if (error) throw error;
      setIngredients(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.unit_cost || !formData.unit) {
      setError("Tous les champs sont requis.");
      return;
    }

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("ingredients")
          .update({
            name: formData.name,
            unit_cost: parseFloat(formData.unit_cost),
            unit: formData.unit,
          })
          .eq("id", editingId)
          .eq("restaurant_id", profile!.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("ingredients")
          .insert({
            restaurant_id: profile!.id,
            name: formData.name,
            unit_cost: parseFloat(formData.unit_cost),
            unit: formData.unit,
          });

        if (error) throw error;
      }

      // Reset form and reload
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: "", unit_cost: "", unit: "" });
      setError(null);
      loadIngredients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet ingrédient ?")) return;

    try {
      const { error } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", profile!.id);

      if (error) throw error;
      loadIngredients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEditing = (ing: Ingredient) => {
    setEditingId(ing.id);
    setFormData({
      name: ing.name,
      unit_cost: ing.unit_cost.toString(),
      unit: ing.unit,
    });
    setIsAdding(false);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: "", unit_cost: "", unit: "" });
    setError(null);
  };

  if (!settings?.module_food_cost) {
    return (
      <div className="p-8 text-center text-slate-500">
        Ce module est désactivé. Vous pouvez l'activer dans les Paramètres.
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Food Cost</h1>
            <p className="text-sm text-slate-500">Catalogue des Ingrédients</p>
          </div>
          {!isAdding && !editingId && (
            <button
              onClick={() => {
                setIsAdding(true);
                setFormData({ name: "", unit_cost: "", unit: "" });
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          )}
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard/food-cost" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Vue Globale</a>
          <a href="/dashboard/food-cost/ingredients" className="py-3 border-b-2 border-indigo-600 text-indigo-600">Ingrédients</a>
          <a href="/dashboard/food-cost/recipes" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Recettes</a>
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
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Nom de l'ingrédient</th>
                <th className="px-6 py-4">Coût</th>
                <th className="px-6 py-4">Unité</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isAdding && (
                <tr className="bg-indigo-50/30">
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      placeholder="Ex: Saumon frais"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="38.00"
                      value={formData.unit_cost}
                      onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                      className="w-full max-w-[120px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      placeholder="kg, L, unité..."
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full max-w-[120px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Chargement...</td>
                </tr>
              ) : ingredients.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-slate-500 mb-4">Aucun ingrédient configuré.</p>
                  </td>
                </tr>
              ) : (
                ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-slate-50 transition-colors">
                    {editingId === ing.id ? (
                      <>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.unit_cost}
                            onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                            className="w-full max-w-[120px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            className="w-full max-w-[120px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium text-slate-900">{ing.name}</td>
                        <td className="px-6 py-4 text-slate-600">{Number(ing.unit_cost).toFixed(2)}$</td>
                        <td className="px-6 py-4 text-slate-500">{ing.unit}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                            <button onClick={() => startEditing(ing)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(ing.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
