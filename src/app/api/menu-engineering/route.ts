import { RECIPES, calculateItemFoodCost, FoodCostResult } from '@/lib/food-cost';
import { loadMenuFromSupabase } from '@/lib/menu-store';
import { fetchWeeklySales } from '@/lib/pos-integration';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { MODEL_CREATE } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

export const maxDuration = 60; // Allow 60 seconds since we are making Anthropic API calls

export type MenuEngineeringItem = {
  menuItemId: string;
  menuItemName: string;
  category: 'phare' | 'ancre' | 'derive' | 'ecueil';
  weeklyOrders: number;
  sellingPrice: number;
  marginPercent: number;
  marginAmount: number;
  weeklyProfit: number;
  recommendation: string; // This will now come from Claude AI
};

export async function GET(req: Request) {
  try {
    // Auth check
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Rate limit check
    const rateLimit = await checkRateLimit(auth.restaurantId, 'menu-engineering');
    if (!rateLimit.allowed) return tooManyRequests();

    // 1. Fetch menu data from Supabase
    const { items: menuItems } = await loadMenuFromSupabase();
    const activeMenuItemIds = menuItems.filter(i => i.available).map(i => i.id);

    // 2. Fetch mock POS sales data
    const posSales = await fetchWeeklySales('mock', activeMenuItemIds);

    // 3. Calculate food cost for all available items
    const costResults: FoodCostResult[] = RECIPES.map(recipe => {
      const menuItem = menuItems.find(item => item.id === recipe.menuItemId);
      if (!menuItem) return null;
      return calculateItemFoodCost(recipe, menuItem.price, menuItem.name);
    }).filter(Boolean) as FoodCostResult[];

    // 4. Determine medians for classification
    const margins = costResults.map(r => r.margin).sort((a, b) => a - b);
    const orders = posSales.map(s => s.quantitySoldWeekly).sort((a, b) => a - b);
    
    const medianMargin = margins[Math.floor(margins.length / 2)] || 0;
    const medianOrders = orders[Math.floor(orders.length / 2)] || 0;

    // 5. Build base items with BCG classification Data
    const baseItems: Omit<MenuEngineeringItem, 'recommendation'>[] = costResults.map(cost => {
      const salesRecord = posSales.find(s => s.menuItemId === cost.menuItemId);
      const weeklyOrders = salesRecord ? salesRecord.quantitySoldWeekly : 0;
      
      const isHighMargin = cost.margin >= medianMargin;
      const isPopular = weeklyOrders >= medianOrders;

      let category: MenuEngineeringItem['category'];

      if (isHighMargin && isPopular) category = 'phare';
      else if (!isHighMargin && isPopular) category = 'ancre';
      else if (isHighMargin && !isPopular) category = 'derive';
      else category = 'ecueil';

      return {
        menuItemId: cost.menuItemId,
        menuItemName: cost.menuItemName,
        category,
        weeklyOrders,
        sellingPrice: cost.sellingPrice,
        marginPercent: cost.margin,
        marginAmount: cost.marginAmount,
        weeklyProfit: Math.round(cost.marginAmount * weeklyOrders * 100) / 100,
      };
    });

    // Sort by weekly profit descending
    baseItems.sort((a, b) => b.weeklyProfit - a.weeklyProfit);

    // 6. Generate AI Insights via Claude (Batch processing to save time)
    // Create a structured prompt containing all crossed data
    const aiPromptContext = baseItems.map(item => {
      const fullMenuData = menuItems.find(m => m.id === item.menuItemId);
      return `
      ID: ${item.menuItemId}
      Plat: ${item.menuItemName}
      Description Menu: ${fullMenuData?.description || 'N/A'}
      Prix: ${item.sellingPrice}$
      Marge: ${item.marginPercent}%
      Ventes Hédo (POS): ${item.weeklyOrders}
      Statut Matrice BCG: ${item.category}
      Profit Hebdo: ${item.weeklyProfit}$
      `;
    }).join('\n---\n');

    let aiRecommendations: Record<string, string> = {};

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { text } = await generateText({
          model: anthropic(MODEL_CREATE),
          system: "Vous êtes le cerveau analytique d'une application de gestion de restaurant nommée Rive. Vos prédictions croisent les descriptions de menu, les coûts (Food Cost), et les ventes réelles (POS). Générez exactement UN conseil hyper-spécifique (max 2 phrases ultra courtes) pour CHAQUE ID fourni, basé sur le profil marin (Phare, Écueil, Dérive, Ancre). Le conseil doit se concentrer sur l'ingénierie de menu (prix, visibilité, ingrédients, reformulation). Répondez UNIQUEMENT avec un objet JSON : { \"[ID]\": \"Votre recommandation\" }.",
          prompt: aiPromptContext,
          temperature: 0.3,
        });

        // Basic cleaning if Claude wraps in markdown json payload
        const jsonStr = text.replace(/```json\n|```/g, '');
        aiRecommendations = JSON.parse(jsonStr);
      } catch (aiError) {
        console.error("Erreur avec l'API Anthropic :", JSON.stringify(aiError, null, 2));
      }
    }

    // 7. Merge AI recommendations
    const items: MenuEngineeringItem[] = baseItems.map(item => {
      // Fallback strategies if AI fails or key is missing
      const genericFallback = {
        phare: 'Mettre en avant sur le menu QR. Maintenir la qualité.',
        ancre: 'Populaire mais marge faible. Augmenter le prix ou réduire le coût.',
        derive: 'Rentable mais peu commandé. Améliorer la description.',
        ecueil: 'Envisager un retrait ou une refonte totale.'
      };

      return {
        ...item,
        recommendation: aiRecommendations[item.menuItemId] || genericFallback[item.category]
      };
    });

    const categoryCounts = {
      phare: items.filter(i => i.category === 'phare').length,
      ancre: items.filter(i => i.category === 'ancre').length,
      derive: items.filter(i => i.category === 'derive').length,
      ecueil: items.filter(i => i.category === 'ecueil').length,
    };

    return new Response(JSON.stringify({
      items,
      medianMargin: Math.round(medianMargin * 10) / 10,
      medianOrders,
      categoryCounts,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in menu engineering:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
