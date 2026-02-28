import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { loadFoodCostData, calculateItemFoodCost } from '@/lib/food-cost';
import { loadMenuFromSupabase } from '@/lib/menu-store';

export const maxDuration = 60; // Allow enough time for LLM

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { items: menuItems } = await loadMenuFromSupabase();
    const { ingredients, recipes } = await loadFoodCostData(auth.supabase, auth.restaurantId);

    // 1. Identify recipes that are in 'critical' status (margin < 60%)
    const criticalRecipes = [];
    
    for (const recipe of recipes) {
      const menuItem = menuItems.find(item => item.id === recipe.menuItemId);
      if (!menuItem) continue;
      
      const costInfo = calculateItemFoodCost(recipe, menuItem.price, menuItem.name, ingredients);
      
      if (costInfo.status === 'critical') {
        criticalRecipes.push({
          recipe,
          menuItem,
          costInfo
        });
      }
    }

    if (criticalRecipes.length === 0) {
      return NextResponse.json({ message: 'Aucun problème de rentabilité détecté.' });
    }

    // 2. Fetch existing active alerts to avoid spamming the same recipe
    const { data: existingAlerts } = await auth.supabase
      .from('food_cost_alerts')
      .select('recipe_id')
      .eq('restaurant_id', auth.restaurantId)
      .eq('status', 'unread');
      
    const existingRecipeIds = new Set(existingAlerts?.map(a => a.recipe_id));
    
    const recipesToAlert = criticalRecipes.filter(cr => !existingRecipeIds.has(cr.recipe.id));

    if (recipesToAlert.length === 0) {
      return NextResponse.json({ message: 'Problèmes détectés, mais les alertes ont déjà été générées.' });
    }

    // 3. Prepare the AI Prompt
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'AI integration not configured' }, { status: 503 });
    }

    const reportData = recipesToAlert.map(cr => {
        // Find the most expensive ingredient
        let topIngredient = null;
        let maxCost = 0;
        
        for (const ri of cr.recipe.ingredients) {
            const ingr = ingredients[ri.ingredientId];
            if (ingr) {
                const cost = ingr.unitCost * ri.quantity;
                if (cost > maxCost) {
                    maxCost = cost;
                    topIngredient = ingr;
                }
            }
        }

        return {
            recipeId: cr.recipe.id,
            name: cr.menuItem.name,
            sellingPrice: cr.costInfo.sellingPrice,
            totalCost: cr.costInfo.ingredientCost,
            margin: cr.costInfo.margin,
            topIngredient: topIngredient ? { id: topIngredient.id, name: topIngredient.name, costContribution: maxCost } : null
        };
    });

    const systemPrompt = `Tu es un consultant expert en rentabilité pour les restaurants (Food & Beverage Controller).
On te fournit une liste de plats dont le "Food Cost" (coût matière) a explosé et dont la marge brute est devenue critique (< 60%).
Pour chaque plat, on t'indique le prix de vente, le coût de revient, la marge actuelle, et l'ingrédient principal qui coûte le plus cher dans la recette.

Ta mission :
Retourne un objet JSON strict ("alert_recommendations") contenant un tableau d'objets avec :
- "recipeId" : l'identifiant exact de la recette
- "recommendation" : Une courte phrase très pragmatique et actionnable pour corriger la marge (ex: "Augmentez le prix de 2$ ou réduisez la portion de l'ingrédient principal de 15%").
Ne donne que le JSON, aucun commentaire additionnel.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-latest',
        max_tokens: 1500,
        temperature: 0.2, // Be deterministic for JSON
        system: systemPrompt,
        messages: [{
            role: 'user', 
            content: "Analyse ces plats :\n" + JSON.stringify(reportData, null, 2)
        }]
      })
    });

    if (!aiRes.ok) {
        console.error('Claude API Error:', await aiRes.text());
        return NextResponse.json({ error: 'AI provider error' }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const responseText = aiData.content[0].text;
    
    // Parse the JSON blocks out of markdown response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    const parseableText = jsonMatch ? jsonMatch[1] : responseText;
    
    let recommendations: { alert_recommendations: Array<{ recipeId: string, recommendation: string }> };
    try {
        recommendations = JSON.parse(parseableText);
    } catch (e) {
        console.error('Failed to parse AI response:', parseableText);
        return NextResponse.json({ error: 'Failed to process AI insights' }, { status: 500 });
    }

    // 4. Insert into the database
    const inserts = reportData.map(rd => {
        const aiRec = recommendations.alert_recommendations?.find(r => r.recipeId === rd.recipeId);
        
        return {
            restaurant_id: auth.restaurantId,
            recipe_id: rd.recipeId,
            trigger_ingredient_id: rd.topIngredient?.id,
            previous_cost: rd.sellingPrice * 0.35, // Mock historical cost based on an ideal 35% food cost
            new_cost: rd.totalCost,
            ai_recommendation: aiRec ? aiRec.recommendation : 'Vérifiez la fluctuation des prix des ingrédients récents.',
            status: 'unread'
        };
    });

    if (inserts.length > 0) {
        const { error: insertErr } = await auth.supabase
            .from('food_cost_alerts')
            .insert(inserts as any); // Cast as any because type wasn't generated yet

        if (insertErr) {
            console.error('Failed to insert alerts:', insertErr);
            throw insertErr;
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Analyse terminée', 
        generatedAlerts: inserts.length 
    });

  } catch (error: any) {
    console.error('[Food Cost Analyze API] Error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 });
  }
}
