import { RECIPES, calculateItemFoodCost } from '@/lib/food-cost';
import { loadMenuFromSupabase } from '@/lib/menu-store';

export async function GET() {
  try {
    const { items: menuItems } = await loadMenuFromSupabase();

    const results = RECIPES.map(recipe => {
      const menuItem = menuItems.find(item => item.id === recipe.menuItemId);
      if (!menuItem) return null;
      return calculateItemFoodCost(recipe, menuItem.price, menuItem.name);
    }).filter(Boolean);

    // Calculate overall stats
    const totalCost = results.reduce((sum, r) => sum + (r?.ingredientCost || 0), 0);
    const totalRevenue = results.reduce((sum, r) => sum + (r?.sellingPrice || 0), 0);
    const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;
    const criticalItems = results.filter(r => r?.status === 'critical').length;
    const warningItems = results.filter(r => r?.status === 'warning').length;

    return new Response(JSON.stringify({
      items: results,
      summary: {
        avgMargin: Math.round(avgMargin * 10) / 10,
        totalMenuCost: Math.round(totalCost * 100) / 100,
        totalMenuRevenue: Math.round(totalRevenue * 100) / 100,
        criticalItems,
        warningItems,
        healthyItems: results.length - criticalItems - warningItems,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating food cost:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
