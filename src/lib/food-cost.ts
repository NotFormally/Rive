import { SupabaseClient } from '@supabase/supabase-js';

// Recipe & Ingredient Cost data model
export type Ingredient = {
  id: string;
  name: string;
  unitCost: number;     // cost per unit (e.g., per kg, per L, per unit)
  unit: string;         // kg, L, unité, botte
};

export type RecipeIngredient = {
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  id: string;
  menuItemId: string;
  ingredients: RecipeIngredient[];
};

export type FoodCostResult = {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  ingredientCost: number;
  margin: number;          // percentage
  marginAmount: number;    // dollar amount
  status: 'healthy' | 'warning' | 'critical';
};

// Calculate food cost for a single recipe
export function calculateItemFoodCost(recipe: Recipe, sellingPrice: number, menuItemName: string, ingredientMap: Record<string, Ingredient>): FoodCostResult {
  let totalCost = 0;

  for (const ri of recipe.ingredients) {
    const ingredient = ingredientMap[ri.ingredientId];
    if (ingredient) {
      // Pour l'instant, on suppose que l'unité de recette correspond à l'unité de tarification de l'ingrédient
      totalCost += ingredient.unitCost * ri.quantity;
    }
  }

  const marginAmount = sellingPrice - totalCost;
  const margin = sellingPrice > 0 ? ((marginAmount / sellingPrice) * 100) : 0;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (margin < 60) status = 'critical';
  else if (margin < 70) status = 'warning';

  return {
    menuItemId: recipe.menuItemId,
    menuItemName,
    sellingPrice,
    ingredientCost: Math.round(totalCost * 100) / 100,
    margin: Math.round(margin * 10) / 10,
    marginAmount: Math.round(marginAmount * 100) / 100,
    status,
  };
}

export async function loadFoodCostData(supabase: SupabaseClient, restaurantId: string): Promise<{
  ingredients: Record<string, Ingredient>;
  recipes: Recipe[];
}> {
  try {
    const [ingRes, recRes] = await Promise.all([
      supabase.from('ingredients').select('*').eq('restaurant_id', restaurantId),
      supabase.from('recipes').select(`
        id,
        menu_item_id,
        recipe_ingredients (
          ingredient_id,
          quantity,
          unit,
          ingredients (
            name
          )
        )
      `).eq('restaurant_id', restaurantId)
    ]);

    if (ingRes.error) throw ingRes.error;
    if (recRes.error) throw recRes.error;

    const ingredients: Record<string, Ingredient> = {};
    for (const row of ingRes.data || []) {
      ingredients[row.id] = {
        id: row.id,
        name: row.name,
        unitCost: Number(row.unit_cost),
        unit: row.unit
      };
    }

    const recipes: Recipe[] = (recRes.data || []).map((row: any) => ({
      id: row.id,
      menuItemId: row.menu_item_id,
      ingredients: (row.recipe_ingredients || []).map((ri: any) => ({
        ingredientId: ri.ingredient_id,
        ingredientName: ri.ingredients?.name,
        quantity: Number(ri.quantity),
        unit: ri.unit
      }))
    }));

    return { ingredients, recipes };
  } catch (error) {
    console.error('Failed to load food cost data from Supabase:', error);
    return { ingredients: {}, recipes: [] };
  }
}
