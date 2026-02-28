import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

export const maxDuration = 60; // Allow enough time for LLM

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const rl = await checkRateLimit(auth.restaurantId, 'assistant');
    if (!rl.allowed) return tooManyRequests();

    const body = await req.json();
    const { messages }: { messages: Message[] } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 });
    }

    // 1. Fetch relevant restaurant context for the prompt
    // For a real Sous-Chef, we want to give it access to the restaurant's current state.
    // Fetching basic info and today's prep list as initial context.
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch Prep List
    const { data: prepList } = await auth.supabase
      .from('prep_lists')
      .select('id, estimated_covers, status, alerts')
      .eq('restaurant_id', auth.restaurantId)
      .eq('target_date', today)
      .maybeSingle();

    // Fetch Prep List Items with AI suggestions
    let prepListItems: any[] = [];
    if (prepList) {
      const { data } = await auth.supabase
        .from('prep_list_items')
        .select(`
          ai_suggestion_quantity, ai_reasoning,
          recipes(name)
        `)
        .eq('prep_list_id', prepList.id as string)
        .not('ai_suggestion_quantity', 'is', null);
      
      if (data) prepListItems = data;
    }

    // Fetch Food Cost Alerts
    const { data: foodCostAlerts } = await auth.supabase
      .from('food_cost_alerts')
      .select(`
        status, new_cost, previous_cost, ai_recommendation,
        recipes(name),
        ingredients(name)
      `)
      .eq('restaurant_id', auth.restaurantId)
      .eq('status', 'unread');

    // Fetch quick stats
    const { data: recentSales } = await auth.supabase
      .from('pos_sales')
      .select('total_amount, sale_date')
      .eq('restaurant_id', auth.restaurantId)
      .order('sale_date', { ascending: false })
      .limit(5);

    const salesContext = recentSales ? recentSales.map(s => `${s.sale_date}: $${s.total_amount}`).join(', ') : 'Aucune donnée récente';
    const coversContext = prepList ? `${prepList.estimated_covers} couverts estimés` : 'Non calculé';
    
    // Format Alerts
    let ecosystemContext = "";
    if (foodCostAlerts && foodCostAlerts.length > 0) {
        ecosystemContext += `\n[ALERTE FOOD COST] ${foodCostAlerts.length} plats en marge critique :\n`;
        foodCostAlerts.forEach((a: any) => {
           ecosystemContext += `- Recette: ${a.recipes?.name || 'Inconnue'} | Ingrédient Fautif: ${a.ingredients?.name || 'Inconnu'} | Sugg.: ${a.ai_recommendation}\n`; 
        });
    }

    // Format Prep Items
    if (prepListItems && prepListItems.length > 0) {
        ecosystemContext += `\n[SMART PREP DU JOUR] Suggestions IA demandées :\n`;
        prepListItems.forEach((i: any) => {
           ecosystemContext += `- ${i.recipes?.name}: Suggéré ${i.ai_suggestion_quantity} portions (${i.ai_reasoning})\n`; 
        });
    }

    if (!ecosystemContext) {
        ecosystemContext = "Aucune alerte ou conseil IA spécifique en cours dans l'écosystème.";
    }

    const systemPrompt = `Tu es Rive, le Sous-Chef Exécutif Virtuel d'un logiciel de gestion de restaurant haut de gamme.
Ton but est d'aider le restaurateur ou le Chef à analyser ses données, prendre des décisions, ou répondre à des questions sur la gestion (Food Cost, Menu Engineering, RH, Opérations).

Voici le contexte actuel du restaurant pour l'aider :
- Date d'aujourd'hui : ${today}
- Prévisions du jour : ${coversContext}
- Historique récent des ventes (5 derniers jours) : ${salesContext}
- Alertes et Données de l'Écosystème Rive IA : ${ecosystemContext}

Règles de comportement :
1. Sois professionnel, concis mais amical (ton de Chef respectueux).
2. Va droit au but. Les restaurateurs n'ont pas le temps.
3. Si on te pose une question générale sur la restauration (ex: "comment calculer le food cost ?"), réponds avec des formules précises.
4. Si le contexte fourni ne permet pas de répondre à une question spécifique sur LEUR restaurant, dis-le poliment et suggère d'utiliser les modules dédiés dans Rive.
5. Ne fais jamais de mise en forme complexe (Markdown simple autorisé: gras, listes).`;

    // 3. Call Anthropic (Claude)
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'AI integration not configured' }, { status: 503 });
    }

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
        temperature: 0.7, // A bit of creativity for conversation
        system: systemPrompt,
        messages: messages
      })
    });

    if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error('Claude API Error:', errText);
        return NextResponse.json({ error: 'AI provider error' }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const reply = aiData.content[0].text;
    
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('[Virtual Sous-Chef API] Error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 });
  }
}
