import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';

export const maxDuration = 60; // Allow enough time for LLM

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const { prep_list_id, context } = body;

    if (!prep_list_id) {
      return NextResponse.json({ error: 'Missing prep_list_id' }, { status: 400 });
    }

    // 1. Fetch the prep list and items from DB
    const { data: prepList, error: prepError } = await auth.supabase
      .from('prep_lists')
      .select('*, prep_list_items(*), restaurants(name)')
      .eq('id', prep_list_id)
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (prepError || !prepList) {
      return NextResponse.json({ error: 'Prep list not found' }, { status: 404 });
    }

    // 2. Format Context for LLM
    const itemsContext = prepList.prep_list_items.map((i: any) => ({
      id: i.id,
      name: i.menu_item_name,
      base_prediction: i.predicted_portions,
      priority: i.priority,
      historical_confidence: i.confidence_modifier
    }));

    const systemPrompt = `Tu es un Sous-Chef Exécutif expert en prédiction de production (Food Prep).
Ton objectif est d'analyser une liste de préparation standard et d'ajuster les quantités en fonction du contexte.
Tu dois retourner un objet JSON structuré (AI_SUGGESTIONS) avec l'id de l'item, la quantité suggérée (int), et un raisonnement très court de 15 mots max (ex: "Augmenté via météo").

IMPORTANT: Ne réponds rien d'autre que du JSON valide, commençant avec { "predictions": [...] }.`;

    const userPrompt = `
Date de prep: ${prepList.target_date}
Service: ${prepList.service_period}
Couverts attendus: ${prepList.estimated_covers}
Contexte additionnel: ${context || 'Journée classique'}

Voici les items à préparer (avec leur base statique calculée):
${JSON.stringify(itemsContext, null, 2)}

Produis le JSON pour ajuster ces quantités.
`;

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
        max_tokens: 2000,
        temperature: 0.2, // Low temperature for deterministic output
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error('Claude API Error:', errText);
        return NextResponse.json({ error: 'AI provider error' }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const aiText = aiData.content[0].text;
    
    // Extract JSON
    let parsedJson = null;
    try {
        const match = aiText.match(/\{[\s\S]*\}/);
        if (match) {
            parsedJson = JSON.parse(match[0]);
        }
    } catch (e) {
        console.error("Failed to parse AI output:", aiText);
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    if (!parsedJson || !parsedJson.predictions) {
        return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

    // 4. Save to DB
    const updates = parsedJson.predictions.map(async (p: any) => {
        if (!p.id || p.quantite === undefined) return;
        return auth.supabase
            .from('prep_list_items')
            .update({
                ai_suggestion_quantity: p.quantite,
                ai_reasoning: p.raison
            })
            .eq('id', p.id);
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true, predictions: parsedJson.predictions });

  } catch (error: any) {
    console.error('[PrepList AI API] Error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 });
  }
}
