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
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  yieldPortions?: number;
};

export type FoodCostResult = {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  ingredientCost: number;
  margin: number;          // percentage (ingredient-only)
  marginAmount: number;    // dollar amount (ingredient-only)
  laborCostPerUnit: number;
  totalCost: number;       // ingredientCost + laborCostPerUnit
  realMargin: number;      // percentage including labor
  realMarginAmount: number;
  status: 'healthy' | 'warning' | 'critical';
};

// Calculate food cost for a single recipe
export function calculateItemFoodCost(recipe: Recipe, sellingPrice: number, menuItemName: string, ingredientMap: Record<string, Ingredient>, hourlyLaborCost?: number): FoodCostResult {
  let ingredientCost = 0;

  for (const ri of recipe.ingredients) {
    const ingredient = ingredientMap[ri.ingredientId];
    if (ingredient) {
      ingredientCost += ingredient.unitCost * ri.quantity;
    }
  }

  // Labor cost per unit: (prep_time / 60) * hourly_rate / yield_portions
  let laborCostPerUnit = 0;
  if (hourlyLaborCost && recipe.prepTimeMinutes) {
    const totalLaborCost = (recipe.prepTimeMinutes / 60) * hourlyLaborCost;
    laborCostPerUnit = totalLaborCost / (recipe.yieldPortions || 1);
  }

  const totalCost = ingredientCost + laborCostPerUnit;

  // Ingredient-only margin
  const marginAmount = sellingPrice - ingredientCost;
  const margin = sellingPrice > 0 ? ((marginAmount / sellingPrice) * 100) : 0;

  // Real margin (ingredients + labor)
  const realMarginAmount = sellingPrice - totalCost;
  const realMargin = sellingPrice > 0 ? ((realMarginAmount / sellingPrice) * 100) : 0;

  // Status based on real margin when labor data is available, otherwise ingredient margin
  const statusMargin = laborCostPerUnit > 0 ? realMargin : margin;
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (statusMargin < 60) status = 'critical';
  else if (statusMargin < 70) status = 'warning';

  return {
    menuItemId: recipe.menuItemId,
    menuItemName,
    sellingPrice,
    ingredientCost: Math.round(ingredientCost * 100) / 100,
    margin: Math.round(margin * 10) / 10,
    marginAmount: Math.round(marginAmount * 100) / 100,
    laborCostPerUnit: Math.round(laborCostPerUnit * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    realMargin: Math.round(realMargin * 10) / 10,
    realMarginAmount: Math.round(realMarginAmount * 100) / 100,
    status,
  };
}

export async function loadFoodCostData(supabase: SupabaseClient, restaurantId: string): Promise<{
  ingredients: Record<string, Ingredient>;
  recipes: Recipe[];
  hourlyLaborCost?: number;
}> {
  try {
    const [ingRes, recRes, profileRes] = await Promise.all([
      supabase.from('ingredients').select('*').eq('restaurant_id', restaurantId),
      supabase.from('recipes').select(`
        id,
        menu_item_id,
        prep_time_minutes,
        cook_time_minutes,
        yield_portions,
        recipe_ingredients (
          ingredient_id,
          quantity,
          unit,
          ingredients (
            name
          )
        )
      `).eq('restaurant_id', restaurantId),
      supabase.from('restaurant_profiles').select('hourly_labor_cost').eq('id', restaurantId).single()
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
      prepTimeMinutes: row.prep_time_minutes ? Number(row.prep_time_minutes) : undefined,
      cookTimeMinutes: row.cook_time_minutes ? Number(row.cook_time_minutes) : undefined,
      yieldPortions: row.yield_portions ? Number(row.yield_portions) : undefined,
      ingredients: (row.recipe_ingredients || []).map((ri: any) => ({
        ingredientId: ri.ingredient_id,
        ingredientName: ri.ingredients?.name,
        quantity: Number(ri.quantity),
        unit: ri.unit
      }))
    }));

    const hourlyLaborCost = profileRes.data?.hourly_labor_cost
      ? Number(profileRes.data.hourly_labor_cost)
      : undefined;

    return { ingredients, recipes, hourlyLaborCost };
  } catch (error) {
    console.error('Failed to load food cost data from Supabase:', error);
    return { ingredients: {}, recipes: [] };
  }
}
