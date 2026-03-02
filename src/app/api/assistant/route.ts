import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';
import { MODEL_CREATE } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const rl = await checkRateLimit(auth.restaurantId, 'assistant');
    if (!rl.allowed) return tooManyRequests();

    const { messages: uiMessages } = await req.json();
    const messages = await convertToModelMessages(uiMessages);

    // ── Fetch upfront context ─────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];

    const [profileRes, prepRes, alertsRes, salesRes, logbookRes, menuCountRes, resvRes] =
      await Promise.all([
        auth.supabase
          .from('restaurant_profiles')
          .select('name, cuisine_type')
          .eq('id', auth.restaurantId)
          .maybeSingle(),
        auth.supabase
          .from('prep_lists')
          .select('id, estimated_covers, status, alerts')
          .eq('restaurant_id', auth.restaurantId)
          .eq('target_date', today)
          .maybeSingle(),
        auth.supabase
          .from('food_cost_alerts')
          .select('id, status, new_cost, previous_cost, ai_recommendation, recipes(name), ingredients(name)')
          .eq('restaurant_id', auth.restaurantId)
          .eq('status', 'unread'),
        auth.supabase
          .from('pos_sales')
          .select('total_amount, sale_date')
          .eq('restaurant_id', auth.restaurantId)
          .order('sale_date', { ascending: false })
          .limit(7),
        auth.supabase
          .from('smartlogbook_entries')
          .select('text, tags, sentiment, summary, is_urgent, created_at')
          .eq('restaurant_id', auth.restaurantId)
          .order('created_at', { ascending: false })
          .limit(5),
        auth.supabase
          .from('menu_items')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', auth.restaurantId),
        auth.supabase
          .from('reservations')
          .select('guest_count, reservation_time, status, customer_notes')
          .eq('restaurant_id', auth.restaurantId)
          .gte('reservation_time', `${today}T00:00:00`)
          .lte('reservation_time', `${today}T23:59:59`)
          .in('status', ['booked', 'seated']),
      ]);

    const profile = profileRes.data;
    const prepList = prepRes.data;
    const alerts = alertsRes.data || [];
    const sales = salesRes.data || [];
    const logbookEntries = logbookRes.data || [];
    const menuCount = menuCountRes.count || 0;
    const reservations = resvRes.data || [];

    // Prep list items (depends on prepList.id)
    let prepItems: { recipe: string; qty: number; reason: string }[] = [];
    if (prepList?.id) {
      const { data } = await auth.supabase
        .from('prep_list_items')
        .select('ai_suggestion_quantity, ai_reasoning, recipes(name)')
        .eq('prep_list_id', prepList.id)
        .not('ai_suggestion_quantity', 'is', null);
      if (data) {
        prepItems = data.map((i: any) => ({
          recipe: i.recipes?.name || '?',
          qty: i.ai_suggestion_quantity,
          reason: i.ai_reasoning,
        }));
      }
    }

    // Total expected covers from reservations
    const totalCovers = reservations.reduce((sum: number, r: any) => sum + (r.guest_count || 0), 0);

    // ── Build system prompt ───────────────────────────────────────────
    const systemPrompt = `Tu es **Rive**, le Sous-Chef Exécutif Virtuel d'un logiciel de gestion de restaurant haut de gamme.

## Identité
- Tu es un assistant IA intégré à la plateforme Rive. Tu parles comme un chef expérimenté : direct, professionnel, bienveillant.
- Tu tutoies le chef s'il te tutoie, sinon tu le vouvoies.

## Restaurant
- Nom : ${profile?.name || 'Non renseigné'}
- Cuisine : ${profile?.cuisine_type || 'Non renseignée'}
- Date : ${today}

## Données en temps réel
- **Plats au menu** : ${menuCount} items
- **Réservations du jour** : ${reservations.length} réservations, ${totalCovers} couverts attendus
- **Ventes récentes (7j)** : ${sales.length > 0 ? sales.map((s: any) => `${s.sale_date}: ${s.total_amount}$`).join(' | ') : 'Aucune donnée'}
- **Prep list du jour** : ${prepList ? `${prepList.estimated_covers} couverts estimés, statut: ${prepList.status}` : 'Non générée'}
${prepItems.length > 0 ? '- **Suggestions IA prep** :\n' + prepItems.map(i => `  - ${i.recipe}: ${i.qty} portions (${i.reason})`).join('\n') : ''}
- **Alertes food cost** : ${alerts.length > 0 ? alerts.length + ' alertes non lues' : 'Aucune'}
${alerts.length > 0 ? alerts.map((a: any) => `  - ${a.recipes?.name || '?'} — ingrédient: ${a.ingredients?.name || '?'}, suggestion: ${a.ai_recommendation}`).join('\n') : ''}
- **Dernières notes du logbook** :
${logbookEntries.length > 0 ? logbookEntries.map((e: any) => `  - [${e.is_urgent ? 'URGENT' : e.sentiment}] ${e.summary || e.text.substring(0, 80)}`).join('\n') : '  Aucune note récente.'}

## Outils disponibles
Tu disposes d'outils pour **lire et écrire** dans l'application Rive. Utilise-les quand le chef te le demande ou quand c'est pertinent pour répondre précisément. Ne demande pas la permission d'utiliser un outil — utilise-le directement.

## Règles
1. Sois concis et va droit au but. Les restaurateurs n'ont pas le temps.
2. Pour les questions sur LEUR restaurant, utilise le contexte ci-dessus et les outils.
3. Pour les questions générales (ex: "comment calculer le food cost ?"), réponds avec des formules précises.
4. Si tu ne peux pas répondre, dis-le et suggère le module Rive approprié.
5. Formatage simple : gras, listes. Pas de tableaux complexes.
6. Quand tu écris dans le logbook, confirme l'action au chef.`;

    // ── Tools ─────────────────────────────────────────────────────────
    const result = streamText({
      model: anthropic(MODEL_CREATE),
      system: systemPrompt,
      messages,
      maxOutputTokens: 4096,
      temperature: 0.7,
      stopWhen: stepCountIs(5),
      tools: {
        get_menu_items: tool({
          description: "Récupérer les plats du menu avec prix, catégorie et food cost. Utiliser quand le chef pose une question sur le menu, les prix, ou les marges.",
          inputSchema: z.object({
            category: z.string().optional().describe("Filtrer par catégorie (entrée, plat, dessert...)"),
          }),
          execute: async ({ category }) => {
            let query = auth.supabase
              .from('menu_items')
              .select('name, price, category, food_cost_percent, is_active')
              .eq('restaurant_id', auth.restaurantId)
              .order('category');
            if (category) query = query.ilike('category', `%${category}%`);
            const { data } = await query.limit(50);
            return data || [];
          },
        }),

        get_logbook_entries: tool({
          description: "Lire les notes récentes du journal de bord. Utiliser pour consulter l'historique opérationnel, les problèmes signalés, ou les tendances.",
          inputSchema: z.object({
            limit: z.number().optional().describe("Nombre de notes (défaut: 10, max: 30)"),
            urgent_only: z.boolean().optional().describe("Ne retourner que les notes urgentes"),
          }),
          execute: async ({ limit = 10, urgent_only = false }) => {
            let query = auth.supabase
              .from('smartlogbook_entries')
              .select('text, tags, sentiment, summary, is_urgent, created_at')
              .eq('restaurant_id', auth.restaurantId)
              .order('created_at', { ascending: false })
              .limit(Math.min(limit, 30));
            if (urgent_only) query = query.eq('is_urgent', true);
            const { data } = await query;
            return data || [];
          },
        }),

        create_logbook_entry: tool({
          description: "Écrire une nouvelle note dans le journal de bord. Utiliser quand le chef demande de noter quelque chose, ou pour consigner une observation importante.",
          inputSchema: z.object({
            text: z.string().describe("Le contenu de la note à enregistrer"),
            tags: z.array(z.string()).optional().describe("Tags catégorisant la note (ex: ['Équipement', 'Urgent'])"),
            is_urgent: z.boolean().optional().describe("Marquer comme urgent"),
          }),
          execute: async ({ text, tags = ['Sous-Chef IA'], is_urgent = false }) => {
            const { data, error } = await auth.supabase
              .from('smartlogbook_entries')
              .insert({
                restaurant_id: auth.restaurantId,
                text,
                tags: [...tags, 'Sous-Chef IA'],
                sentiment: 'Neutral',
                original_language: 'fr',
                summary: text.length > 100 ? text.substring(0, 97) + '...' : text,
                is_urgent,
              })
              .select('id, created_at')
              .single();
            if (error) return { success: false, error: error.message };
            return { success: true, id: data.id, created_at: data.created_at };
          },
        }),

        get_reservations_today: tool({
          description: "Voir les réservations du jour avec détails (couverts, heure, notes client, statut VIP). Utiliser pour planifier le service.",
          inputSchema: z.object({}),
          execute: async () => {
            const { data } = await auth.supabase
              .from('reservations')
              .select('guest_count, reservation_time, status, customer_notes')
              .eq('restaurant_id', auth.restaurantId)
              .gte('reservation_time', `${today}T00:00:00`)
              .lte('reservation_time', `${today}T23:59:59`)
              .order('reservation_time');
            return {
              count: data?.length || 0,
              total_covers: data?.reduce((sum: number, r: any) => sum + (r.guest_count || 0), 0) || 0,
              reservations: data || [],
            };
          },
        }),

        mark_alert_read: tool({
          description: "Marquer une alerte food cost comme lue/traitée. Utiliser quand le chef confirme avoir pris connaissance d'une alerte.",
          inputSchema: z.object({
            alert_id: z.string().describe("L'ID de l'alerte à marquer comme lue"),
          }),
          execute: async ({ alert_id }) => {
            const { error } = await auth.supabase
              .from('food_cost_alerts')
              .update({ status: 'read' })
              .eq('id', alert_id)
              .eq('restaurant_id', auth.restaurantId);
            if (error) return { success: false, error: error.message };
            return { success: true };
          },
        }),

        get_sales_trend: tool({
          description: "Analyser les tendances de ventes sur une période. Utiliser pour des analyses de chiffre d'affaires.",
          inputSchema: z.object({
            days: z.number().optional().describe("Nombre de jours à analyser (défaut: 14, max: 30)"),
          }),
          execute: async ({ days = 14 }) => {
            const since = new Date();
            since.setDate(since.getDate() - Math.min(days, 30));
            const { data } = await auth.supabase
              .from('pos_sales')
              .select('total_amount, sale_date')
              .eq('restaurant_id', auth.restaurantId)
              .gte('sale_date', since.toISOString().split('T')[0])
              .order('sale_date', { ascending: true });
            if (!data || data.length === 0) return { message: 'Aucune donnée de ventes disponible.' };
            const total = data.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0);
            return {
              period_days: days,
              total_revenue: total,
              average_daily: Math.round(total / data.length),
              data_points: data,
            };
          },
        }),

        get_recent_invoices: tool({
          description: "Consulter les factures fournisseurs récentes. Utiliser pour des questions sur les achats, les fournisseurs ou les coûts.",
          inputSchema: z.object({
            limit: z.number().optional().describe("Nombre de factures (défaut: 5)"),
          }),
          execute: async ({ limit = 5 }) => {
            const { data } = await auth.supabase
              .from('invoices')
              .select('supplier_name, total_amount, invoice_date, status')
              .eq('restaurant_id', auth.restaurantId)
              .order('invoice_date', { ascending: false })
              .limit(Math.min(limit, 20));
            return data || [];
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('[Virtual Sous-Chef API] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
