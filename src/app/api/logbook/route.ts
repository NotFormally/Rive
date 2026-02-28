import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data, error } = await auth.supabase
      .from('smartlogbook_entries')
      .select('*')
      .eq('restaurant_id', auth.restaurantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[logbook GET] Error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[logbook GET] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();

    const { data, error } = await auth.supabase
      .from('smartlogbook_entries')
      .insert({
        restaurant_id: auth.restaurantId,
        text: body.text,
        tags: body.tags || [],
        sentiment: body.sentiment || 'Neutral',
        original_language: body.originalLanguage || 'unknown',
        summary: body.summary || null,
        is_urgent: body.isUrgent || false,
        translations: body.translations || {},
        receipt_data: body.receiptData || null,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[logbook POST] Error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[logbook POST] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400 });
    }

    const { error } = await auth.supabase
      .from('smartlogbook_entries')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', auth.restaurantId);

    if (error) {
      console.error('[logbook DELETE] Error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[logbook DELETE] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const { id, translations } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    const { error } = await auth.supabase
      .from('smartlogbook_entries')
      .update({ translations, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('restaurant_id', auth.restaurantId);

    if (error) {
      console.error('[logbook PATCH] Error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[logbook PATCH] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
