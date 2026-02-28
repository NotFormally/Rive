import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data, error } = await auth.supabase
      .from('production_batches')
      .select('*, recipes(name)')
      .eq('restaurant_id', auth.restaurantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[production GET] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data || []);
  } catch (error) {
    console.error('[production GET] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();

    if (!body.name || !body.recipe_id) {
      return Response.json({ error: 'Missing required fields: name, recipe_id' }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from('production_batches')
      .insert({
        restaurant_id: auth.restaurantId,
        recipe_id: body.recipe_id,
        name: body.name,
        start_date: body.start_date || new Date().toISOString(),
        expected_yield: body.expected_yield,
        yield_unit: body.yield_unit || 'L',
        status: 'fermenting',
      })
      .select('*, recipes(name)')
      .single();

    if (error) {
      console.error('[production POST] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('[production POST] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const { id, status, actual_yield } = body;

    if (!id) {
      return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (actual_yield !== undefined) updateData.actual_yield = actual_yield;
    if (status === 'kegged' || status === 'canned') {
      updateData.end_date = new Date().toISOString();
    }

    const { data, error } = await auth.supabase
      .from('production_batches')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', auth.restaurantId)
      .select('*, recipes(name)')
      .single();

    if (error) {
      console.error('[production PATCH] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[production PATCH] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
