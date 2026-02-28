import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data, error } = await auth.supabase
      .from('deposits_ledger')
      .select('*, invoices(supplier_name)')
      .eq('restaurant_id', auth.restaurantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[deposits GET] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data || []);
  } catch (error) {
    console.error('[deposits GET] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();

    const { data, error } = await auth.supabase
      .from('deposits_ledger')
      .insert({
        restaurant_id: auth.restaurantId,
        item_type: body.item_type,
        deposit_amount: body.deposit_amount,
        status: body.status || 'held',
        invoice_id: body.invoice_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[deposits POST] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('[deposits POST] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return Response.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'returned') {
      updateData.returned_date = new Date().toISOString();
    }

    const { data, error } = await auth.supabase
      .from('deposits_ledger')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', auth.restaurantId)
      .select()
      .single();

    if (error) {
      console.error('[deposits PATCH] Error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[deposits PATCH] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
