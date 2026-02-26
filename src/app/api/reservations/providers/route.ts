import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { randomBytes } from 'crypto';

// =============================================================================
// Reservation Providers API
// GET  — List all providers for the authenticated restaurant
// POST — Create a new provider (generates a unique webhook token)
// DELETE — Remove a provider by id (via searchParams)
// =============================================================================

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  const { data, error } = await auth.supabase
    .from('reservation_providers')
    .select('*')
    .eq('restaurant_id', auth.restaurantId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ providers: data || [] });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const providerName = body.provider_name || null; // Optional: 'libro', 'resy', 'zenchef'

  // Generate a unique, secure webhook token
  const tokenSuffix = randomBytes(24).toString('hex');
  const webhookToken = `RIVE_SEC_${tokenSuffix}`;

  const { data, error } = await auth.supabase
    .from('reservation_providers')
    .insert({
      restaurant_id: auth.restaurantId,
      provider_name: providerName,
      webhook_token: webhookToken,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider: data }, { status: 201 });
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('id');

  if (!providerId) {
    return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('reservation_providers')
    .delete()
    .eq('id', providerId)
    .eq('restaurant_id', auth.restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

