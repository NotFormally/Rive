import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data, error } = await auth.supabase
      .from('spoilage_reports')
      .select('*, ingredients(name, category, unit)')
      .eq('restaurant_id', auth.restaurantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[spoilage GET] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data || []);
  } catch (error) {
    console.error('[spoilage GET] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();

    if (!body.ingredient_id || !body.quantity || !body.reason) {
      return Response.json({ error: 'Missing required fields: ingredient_id, quantity, reason' }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from('spoilage_reports')
      .insert({
        restaurant_id: auth.restaurantId,
        ingredient_id: body.ingredient_id,
        quantity: body.quantity,
        unit: body.unit,
        reason: body.reason,
        logged_by: body.logged_by || null,
      })
      .select('*, ingredients(name, category, unit)')
      .single();

    if (error) {
      console.error('[spoilage POST] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('[spoilage POST] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
