import { loadFoodCostData, calculateItemFoodCost, FoodCostResult } from '@/lib/food-cost';
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

    // 2. Fetch POS sales data from Supabase
    let posSales = await fetchWeeklySales('supabase', activeMenuItemIds, auth.supabase, auth.restaurantId);
    
    // Fallback to mock data if the database is empty (for demo purposes)
    if (posSales.length === 0) {
      posSales = await fetchWeeklySales('mock', activeMenuItemIds);
    }

    // 3. Calculate food cost for all available recipes
    const { ingredients, recipes } = await loadFoodCostData(auth.supabase, auth.restaurantId);

    const costResults: FoodCostResult[] = recipes.map(recipe => {
      const menuItem = menuItems.find(item => item.id === recipe.menuItemId);
      if (!menuItem) return null;
      return calculateItemFoodCost(recipe, menuItem.price, menuItem.name, ingredients);
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
    // Fetch cached recommendations first
    const { data: cachedRecommendations } = await auth.supabase
      .from('menu_item_recommendations')
      .select('menu_item_id, recommendation, category, calculated_at')
      .eq('restaurant_id', auth.restaurantId)
      .in('menu_item_id', activeMenuItemIds);

    const cacheMap = new Map((cachedRecommendations || []).map(r => [r.menu_item_id, r]));

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    // Determine which items need a fresh AI generation
    const itemsToProcess = baseItems.filter(item => {
      const cached = cacheMap.get(item.menuItemId);
      if (!cached) return true;
      if (cached.category !== item.category) return true;
      
      const calcDate = new Date(cached.calculated_at).getTime();
      if (now - calcDate > SEVEN_DAYS) return true;
      
      return false;
    });

    let aiRecommendations: Record<string, string> = {};

    if (itemsToProcess.length > 0 && process.env.ANTHROPIC_API_KEY) {
      const aiPromptContext = itemsToProcess.map(item => {
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

      try {
        const { text } = await generateText({
          model: anthropic(MODEL_CREATE),
          system: "Vous êtes le cerveau analytique d'une application de gestion de restaurant nommée Rive. Vos prédictions croisent les descriptions de menu, les coûts (Food Cost), et les ventes réelles (POS). Générez exactement UN conseil hyper-spécifique (max 2 phrases ultra courtes) pour CHAQUE ID fourni, basé sur le profil marin (Phare, Écueil, Dérive, Ancre). Le conseil doit se concentrer sur l'ingénierie de menu (prix, visibilité, ingrédients, reformulation). Répondez UNIQUEMENT avec un objet JSON : { \"[ID]\": \"Votre recommandation\" }.",
          prompt: aiPromptContext,
          temperature: 0.3,
        });

        // Basic cleaning
        const jsonStr = text.replace(/```json\n|```/g, '');
        aiRecommendations = JSON.parse(jsonStr);

        // Upsert newly generated recommendations to Supabase
        const upsertData = itemsToProcess.map(item => ({
          restaurant_id: auth.restaurantId,
          menu_item_id: item.menuItemId,
          recommendation: aiRecommendations[item.menuItemId] || '',
          category: item.category,
          calculated_at: new Date().toISOString()
        })).filter(u => u.recommendation);

        if (upsertData.length > 0) {
          const { error: upsertError } = await auth.supabase
            .from('menu_item_recommendations')
            .upsert(upsertData, { onConflict: 'restaurant_id,menu_item_id' });
            
          if (upsertError) console.error('Failed to upsert recommendations:', upsertError);
        }

      } catch (aiError) {
        console.error("Erreur avec l'API Anthropic :", aiError);
      }
    }

    // 7. Merge AI recommendations
    const items: MenuEngineeringItem[] = baseItems.map(item => {
      const cached = cacheMap.get(item.menuItemId);
      const newlyGenerated = aiRecommendations[item.menuItemId];
      
      let recommendation = '';
      if (newlyGenerated) {
        recommendation = newlyGenerated;
      } else if (cached && cached.category === item.category) {
        recommendation = cached.recommendation;
      } else {
        const genericFallback: Record<string, string> = {
          phare: 'Mettre en avant sur le menu QR. Maintenir la qualité.',
          ancre: 'Populaire mais marge faible. Augmenter le prix ou réduire le coût.',
          derive: 'Rentable mais peu commandé. Améliorer la description.',
          ecueil: 'Envisager un retrait ou une refonte totale.'
        };
        recommendation = genericFallback[item.category];
      }

      return {
        ...item,
        recommendation
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
