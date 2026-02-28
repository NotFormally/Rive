import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';

export const maxDuration = 60; // Allow enough time for LLM

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

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
      .select('estimated_covers, status, alerts')
      .eq('restaurant_id', auth.restaurantId)
      .eq('target_date', today)
      .maybeSingle();

    // Fetch quick stats (example: recent revenue) to make it smart
    const { data: recentSales } = await auth.supabase
      .from('pos_sales')
      .select('total_amount, sale_date')
      .eq('restaurant_id', auth.restaurantId)
      .order('sale_date', { ascending: false })
      .limit(5);

    const salesContext = recentSales ? recentSales.map(s => `${s.sale_date}: $${s.total_amount}`).join(', ') : 'Aucune donnée récente';
    const coversContext = prepList ? `${prepList.estimated_covers} couverts estimés` : 'Non calculé';
    const alertsContext = prepList?.alerts && prepList.alerts.length > 0 ? JSON.stringify(prepList.alerts) : 'Aucune alerte critique en cours';

    const systemPrompt = `Tu es Rive, le Sous-Chef Exécutif Virtuel d'un logiciel de gestion de restaurant haut de gamme.
Ton but est d'aider le restaurateur ou le Chef à analyser ses données, prendre des décisions, ou répondre à des questions sur la gestion (Food Cost, Menu Engineering, RH, Opérations).

Voici le contexte actuel du restaurant pour l'aider :
- Date d'aujourd'hui : ${today}
- Prévisions du jour : ${coversContext}
- Alertes opérationnelles : ${alertsContext}
- Historique récent des ventes (5 derniers jours) : ${salesContext}

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
