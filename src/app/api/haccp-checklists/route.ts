import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Fetch checklists with their items, today's completions, and the regulatory profile in parallel
    const [checklistsRes, completionsRes, regulatoryRes] = await Promise.all([
      auth.supabase
        .from('haccp_checklists')
        .select(`
          *,
          checklist_items (*)
        `)
        .eq('restaurant_id', auth.restaurantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),

      auth.supabase
        .from('checklist_completions')
        .select('*')
        .eq('restaurant_id', auth.restaurantId)
        .gte('completed_at', todayISO)
        .order('completed_at', { ascending: false }),

      auth.supabase
        .from('regulatory_profiles')
        .select('*')
        .limit(1)
        .maybeSingle(),
    ]);

    if (checklistsRes.error) {
      if (checklistsRes.error.message?.includes('schema cache') || checklistsRes.error.code === '42P01') {
        return new Response(JSON.stringify({ checklists: [], completions: [], regulatoryProfile: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('[haccp-checklists GET] Checklists error:', checklistsRes.error.message);
      return new Response(JSON.stringify({ error: checklistsRes.error.message }), { status: 500 });
    }

    // Sort checklist_items by sort_order within each checklist
    const checklists = (checklistsRes.data || []).map((cl: Record<string, unknown>) => ({
      ...cl,
      checklist_items: Array.isArray(cl.checklist_items)
        ? (cl.checklist_items as Record<string, unknown>[]).sort(
            (a: Record<string, unknown>, b: Record<string, unknown>) =>
              ((a.sort_order as number) || 0) - ((b.sort_order as number) || 0)
          )
        : [],
    }));

    // Calculate compliance streak: count consecutive days (going back from yesterday) where all checklists were completed
    let streak = 0;
    const activeChecklistIds = checklists.map((c: Record<string, unknown>) => c.id as string);

    if (activeChecklistIds.length > 0) {
      // Check today first
      const todayCompletedIds = new Set(
        (completionsRes.data || []).map((c: Record<string, unknown>) => c.checklist_id as string)
      );
      const todayAllDone = activeChecklistIds.every((id: string) => todayCompletedIds.has(id));
      if (todayAllDone) streak++;

      // Check previous 30 days max for streak
      const { data: historicalCompletions } = await auth.supabase
        .from('checklist_completions')
        .select('checklist_id, completed_at')
        .eq('restaurant_id', auth.restaurantId)
        .lt('completed_at', todayISO)
        .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false });

      if (historicalCompletions && historicalCompletions.length > 0) {
        // Group completions by day
        const byDay = new Map<string, Set<string>>();
        for (const comp of historicalCompletions) {
          const day = (comp.completed_at as string).substring(0, 10);
          if (!byDay.has(day)) byDay.set(day, new Set());
          byDay.get(day)!.add(comp.checklist_id as string);
        }

        // Walk backwards from yesterday
        const checkDate = new Date(todayStart);
        for (let i = 0; i < 30; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const dayStr = checkDate.toISOString().substring(0, 10);
          const dayCompletions = byDay.get(dayStr);
          if (dayCompletions && activeChecklistIds.every((id: string) => dayCompletions.has(id))) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        checklists,
        completions: completionsRes.data || [],
        regulatoryProfile: regulatoryRes.data || null,
        streak,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[haccp-checklists GET] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const {
      checklist_id,
      responses,
      total_items,
      passed_items,
      failed_items,
      compliance_score,
      has_deviations,
      deviation_count,
      corrective_actions_required,
      signature_data,
      signature_hash,
      started_at,
      completed_at,
      duration_seconds,
    } = body;

    if (!checklist_id || !responses) {
      return new Response(JSON.stringify({ error: 'Missing required fields: checklist_id, responses' }), {
        status: 400,
      });
    }

    const { data, error } = await auth.supabase
      .from('checklist_completions')
      .insert({
        restaurant_id: auth.restaurantId,
        checklist_id,
        completed_by: auth.user.id,
        responses,
        total_items: total_items || 0,
        passed_items: passed_items || 0,
        failed_items: failed_items || 0,
        compliance_score: compliance_score || 0,
        has_deviations: has_deviations || false,
        deviation_count: deviation_count || 0,
        corrective_actions_required: corrective_actions_required || 0,
        signature_data: signature_data || null,
        signature_hash: signature_hash || null,
        started_at: started_at || new Date().toISOString(),
        completed_at: completed_at || new Date().toISOString(),
        duration_seconds: duration_seconds || 0,
      })
      .select('id, completed_at, compliance_score')
      .single();

    if (error) {
      console.error('[haccp-checklists POST] Error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[haccp-checklists POST] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
