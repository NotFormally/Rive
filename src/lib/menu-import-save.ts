import { SupabaseClient } from '@supabase/supabase-js';
import type { MenuExtractionResult } from '@/app/api/extract-menu/route';

export type MenuImportData = MenuExtractionResult & {
  // Extended with UI edits — categories/items may have been modified by user
};

export type SaveResult = {
  success: boolean;
  counts: {
    categories: number;
    items: number;
    ingredients: number;
    recipes: number;
  };
  error?: string;
};

const normalize = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/**
 * Bulk save extracted menu data to Supabase.
 * Order: categories → menu_items → ingredients → recipes → recipe_ingredients
 */
export async function bulkSaveMenuImport(
  supabase: SupabaseClient,
  restaurantId: string,
  data: MenuImportData
): Promise<SaveResult> {
  const counts = { categories: 0, items: 0, ingredients: 0, recipes: 0 };

  try {
    // 1. Fetch existing categories and ingredients for dedup
    const [existingCatRes, existingIngRes] = await Promise.all([
      supabase.from('menu_categories').select('id, name'),
      supabase.from('ingredients').select('id, name, unit').eq('restaurant_id', restaurantId),
    ]);

    const existingCategories = existingCatRes.data || [];
    const existingIngredients = existingIngRes.data || [];

    const existingCatMap = new Map(existingCategories.map(c => [normalize(c.name), c.id]));
    const existingIngMap = new Map(existingIngredients.map(i => [normalize(i.name), i.id]));

    // 2. Prepare categories — deduplicate against existing
    const categoryMap = new Map<string, string>(); // catName → catId
    const newCategories: { id: string; name: string; sort_order: number; icon: string }[] = [];
    let sortOrder = existingCategories.length;

    for (const cat of data.categories) {
      const normalizedName = normalize(cat.name);
      const existingId = existingCatMap.get(normalizedName);
      if (existingId) {
        categoryMap.set(cat.name, existingId);
      } else {
        const newId = generateId();
        categoryMap.set(cat.name, newId);
        existingCatMap.set(normalizedName, newId); // prevent duplicates within import
        newCategories.push({
          id: newId,
          name: cat.name,
          sort_order: sortOrder++,
          icon: guessCategoryIcon(cat.name),
        });
      }
    }

    if (newCategories.length > 0) {
      const { error } = await supabase.from('menu_categories').insert(newCategories);
      if (error) throw new Error(`Failed to insert categories: ${error.message}`);
      counts.categories = newCategories.length;
    }

    // 3. Prepare and insert menu items
    const menuItemsToInsert: any[] = [];
    const itemIngredientMap: Map<string, { name: string; estimatedQuantity?: string; unit?: string }[]> = new Map();

    for (const cat of data.categories) {
      const catId = categoryMap.get(cat.name)!;
      for (const item of cat.items) {
        const itemId = generateId();
        menuItemsToInsert.push({
          id: itemId,
          name: item.name,
          description: item.description || '',
          price: item.price,
          category_id: catId,
          allergens: item.allergens || [],
          available: true,
          translations: {},
        });

        if (item.inferredIngredients && item.inferredIngredients.length > 0) {
          itemIngredientMap.set(itemId, item.inferredIngredients);
        }
      }
    }

    if (menuItemsToInsert.length > 0) {
      const { error } = await supabase.from('menu_items').insert(menuItemsToInsert);
      if (error) throw new Error(`Failed to insert menu items: ${error.message}`);
      counts.items = menuItemsToInsert.length;
    }

    // 4. Collect unique ingredients from all items, deduplicate against existing
    const allIngredientNames = new Set<string>();
    for (const ingredients of itemIngredientMap.values()) {
      for (const ing of ingredients) {
        allIngredientNames.add(normalize(ing.name));
      }
    }

    const newIngredientsToInsert: { id: string; restaurant_id: string; name: string; unit_cost: number; unit: string }[] = [];
    const ingredientIdMap = new Map<string, string>(); // normalized name → ingredient id

    // Map existing ingredients
    for (const [normalizedName, id] of existingIngMap) {
      ingredientIdMap.set(normalizedName, id);
    }

    // Create new ingredients
    for (const normalizedName of allIngredientNames) {
      if (!ingredientIdMap.has(normalizedName)) {
        const newId = crypto.randomUUID();
        ingredientIdMap.set(normalizedName, newId);
        newIngredientsToInsert.push({
          id: newId,
          restaurant_id: restaurantId,
          name: normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1), // capitalize
          unit_cost: 0, // will be populated when invoices are scanned
          unit: 'unit',
        });
      }
    }

    if (newIngredientsToInsert.length > 0) {
      const { error } = await supabase.from('ingredients').insert(newIngredientsToInsert);
      if (error) throw new Error(`Failed to insert ingredients: ${error.message}`);
      counts.ingredients = newIngredientsToInsert.length;
    }

    // 5. Create recipes (one per menu item that has ingredients)
    const recipesToInsert: { id: string; restaurant_id: string; menu_item_id: string }[] = [];
    const recipeIngToInsert: { recipe_id: string; ingredient_id: string; quantity: number; unit: string }[] = [];

    for (const [menuItemId, ingredients] of itemIngredientMap) {
      const recipeId = crypto.randomUUID();
      recipesToInsert.push({
        id: recipeId,
        restaurant_id: restaurantId,
        menu_item_id: menuItemId,
      });

      for (const ing of ingredients) {
        const ingredientId = ingredientIdMap.get(normalize(ing.name));
        if (ingredientId) {
          recipeIngToInsert.push({
            recipe_id: recipeId,
            ingredient_id: ingredientId,
            quantity: parseQuantity(ing.estimatedQuantity),
            unit: ing.unit || 'unit',
          });
        }
      }
    }

    if (recipesToInsert.length > 0) {
      const { error } = await supabase.from('recipes').insert(recipesToInsert);
      if (error) throw new Error(`Failed to insert recipes: ${error.message}`);
      counts.recipes = recipesToInsert.length;
    }

    if (recipeIngToInsert.length > 0) {
      const { error } = await supabase.from('recipe_ingredients').insert(recipeIngToInsert);
      if (error) console.warn('Some recipe_ingredients failed to insert:', error.message);
    }

    return { success: true, counts };
  } catch (err: any) {
    console.error('Menu import save failed:', err);
    return { success: false, counts, error: err.message };
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function parseQuantity(qty?: string): number {
  if (!qty) return 1;
  const num = parseFloat(qty.replace(/[^0-9.,]/g, '').replace(',', '.'));
  return isNaN(num) ? 1 : num;
}

function guessCategoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (/entr|appetizer|starter|hors/i.test(n)) return '🥗';
  if (/plat|main|entrée|principal/i.test(n)) return '🍽️';
  if (/dessert|sweet|doux/i.test(n)) return '🍰';
  if (/boisson|drink|beverage|cocktail|vin|wine|beer|bière/i.test(n)) return '🥂';
  if (/petit.?déjeuner|breakfast|brunch/i.test(n)) return '🍳';
  if (/salade|salad/i.test(n)) return '🥬';
  if (/soupe|soup/i.test(n)) return '🍲';
  if (/pizza|pasta|pâte/i.test(n)) return '🍕';
  if (/burger|sandwich/i.test(n)) return '🍔';
  if (/sushi|poke|japonais|asian/i.test(n)) return '🍱';
  return '📋';
}
