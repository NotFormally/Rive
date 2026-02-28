import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data, error } = await auth.supabase
      .from('variance_logs')
      .select('*, ingredients(name, category, unit)')
      .eq('restaurant_id', auth.restaurantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[variance GET] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data || []);
  } catch (error) {
    console.error('[variance GET] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();

    const { data, error } = await auth.supabase
      .from('variance_logs')
      .insert({
        restaurant_id: auth.restaurantId,
        ingredient_id: body.ingredient_id,
        period_start: body.period_start,
        period_end: body.period_end,
        theoretical_usage: body.theoretical_usage,
        actual_usage: body.actual_usage,
        variance_amount: body.variance_amount,
        variance_cost: body.variance_cost,
      })
      .select('*, ingredients(name, category, unit)')
      .single();

    if (error) {
      console.error('[variance POST] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('[variance POST] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
