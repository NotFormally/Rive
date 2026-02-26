import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// =============================================================================
// Universal Reservation Webhook — Libro, Resy, Zenchef (+ fallback générique)
// Endpoint: POST /api/webhooks/reservations?token=RIVE_SEC_XXXXXXXX
// =============================================================================

// Types for normalized reservation data
type NormalizedReservation = {
  external_id: string;
  guest_count: number;
  reservation_time: string;
  status: 'booked' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_notes: string | null;
  detected_provider: string;
};

// ---------------------------------------------------------------------------
// Provider-specific parsers
// Each function takes a raw payload and returns a NormalizedReservation
// ---------------------------------------------------------------------------

function parseLibro(payload: any): NormalizedReservation {
  const r = payload.reservation || payload.booking || payload;
  const statusMap: Record<string, NormalizedReservation['status']> = {
    created: 'booked', confirmed: 'booked', cancelled: 'cancelled',
    seated: 'seated', completed: 'completed', no_show: 'no_show',
  };
  const rawStatus = payload.action || r.status || 'created';

  return {
    external_id: String(r.id || r.booking_id || `libro_${Date.now()}`),
    guest_count: r.party_size || r.covers || r.guest_count || 2,
    reservation_time: r.date_time || r.time || r.start_time || new Date().toISOString(),
    status: statusMap[rawStatus] || 'booked',
    customer_name: r.guest_name || r.customer?.name || r.first_name ? `${r.first_name || ''} ${r.last_name || ''}`.trim() : null,
    customer_email: r.guest_email || r.customer?.email || r.email || null,
    customer_phone: r.guest_phone || r.customer?.phone || r.phone || null,
    customer_notes: r.notes || r.special_requests || null,
    detected_provider: 'libro',
  };
}

function parseResy(payload: any): NormalizedReservation {
  const r = payload.reservation || payload.booking || payload;
  const statusMap: Record<string, NormalizedReservation['status']> = {
    reservation_created: 'booked', reservation_confirmed: 'booked',
    reservation_cancelled: 'cancelled', reservation_seated: 'seated',
    reservation_completed: 'completed', reservation_no_show: 'no_show',
  };
  const eventType = payload.event_type || '';

  return {
    external_id: String(r.id || r.resy_token || `resy_${Date.now()}`),
    guest_count: r.party_size || r.num_seats || r.covers || 2,
    reservation_time: r.time || r.date?.start || r.day ? `${r.day}T${r.time_slot || '19:00'}` : new Date().toISOString(),
    status: statusMap[eventType] || 'booked',
    customer_name: r.client?.first_name ? `${r.client.first_name} ${r.client.last_name || ''}`.trim() : null,
    customer_email: r.client?.email_address || r.client?.email || null,
    customer_phone: r.client?.phone_number || r.client?.mobile || null,
    customer_notes: r.client?.notes || r.special_request || null,
    detected_provider: 'resy',
  };
}

function parseZenchef(payload: any): NormalizedReservation {
  // Zenchef sends webhooks with a top-level 'event' type and 'data' object.
  // Events: booking.created, booking.updated, booking.cancelled, booking.seated, etc.
  const event = payload.event || payload.type || '';
  const d = payload.data || payload.booking || payload;

  const statusMap: Record<string, NormalizedReservation['status']> = {
    'booking.created': 'booked', 'booking.confirmed': 'booked',
    'booking.updated': 'booked', 'booking.cancelled': 'cancelled',
    'booking.seated': 'seated', 'booking.completed': 'completed',
    'booking.noshow': 'no_show', 'booking.no_show': 'no_show',
  };

  // Zenchef date format is typically ISO or 'YYYY-MM-DD HH:mm'
  let reservationTime = d.date_time || d.datetime || d.date || new Date().toISOString();
  if (d.date && d.time && !d.date_time) {
    reservationTime = `${d.date}T${d.time}`;
  }

  return {
    external_id: String(d.id || d.booking_id || d.reservation_id || `zenchef_${Date.now()}`),
    guest_count: d.nb_guests || d.party_size || d.covers || d.pax || 2,
    reservation_time: reservationTime,
    status: statusMap[event] || (d.status === 'cancelled' ? 'cancelled' : 'booked'),
    customer_name: d.client_name || d.customer?.name || (d.customer?.first_name ? `${d.customer.first_name} ${d.customer.last_name || ''}`.trim() : null),
    customer_email: d.client_email || d.customer?.email || null,
    customer_phone: d.client_phone || d.customer?.phone || null,
    customer_notes: d.comment || d.notes || d.special_requests || null,
    detected_provider: 'zenchef',
  };
}

function parseGeneric(payload: any): NormalizedReservation {
  // Best-effort extraction for unknown providers
  const r = payload.reservation || payload.booking || payload.data || payload;
  return {
    external_id: String(r.id || r.booking_id || `generic_${Date.now()}`),
    guest_count: r.party_size || r.covers || r.guests || r.nb_guests || 2,
    reservation_time: r.date_time || r.time || r.datetime || r.start || new Date().toISOString(),
    status: (r.status === 'cancelled' || payload.event?.includes?.('cancel')) ? 'cancelled' : 'booked',
    customer_name: r.guest_name || r.customer_name || r.name || null,
    customer_email: r.guest_email || r.customer_email || r.email || null,
    customer_phone: r.guest_phone || r.customer_phone || r.phone || null,
    customer_notes: r.notes || r.comment || null,
    detected_provider: 'unknown',
  };
}

// ---------------------------------------------------------------------------
// Provider detection heuristic
// Uses payload shape to identify which platform sent the webhook
// ---------------------------------------------------------------------------
function detectProvider(payload: any): string {
  // Libro: typically has 'action' field + reservation.id
  if (payload.action && (payload.reservation?.id || payload.booking?.id)) return 'libro';
  // Resy: has event_type starting with 'reservation_'
  if (payload.event_type?.startsWith('reservation_')) return 'resy';
  // Zenchef: has 'event' field starting with 'booking.'
  if (payload.event?.startsWith('booking.') || payload.type?.startsWith('booking.')) return 'zenchef';
  // Zenchef alt: has 'data.nb_guests' (Zenchef-specific field name)
  if (payload.data?.nb_guests !== undefined || payload.data?.booking_id) return 'zenchef';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Main POST handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing webhook token' }, { status: 401 });
    }

    // 1. Verify token against the database
    const admin = supabaseAdmin() as any;
    const { data: provider, error: providerError } = await admin
      .from('reservation_providers')
      .select('id, restaurant_id, provider_name, status')
      .eq('webhook_token', token)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
    }

    // 2. Parse payload
    const payload = await req.json();
    console.log(`[Webhook/Reservations] Provider ${provider.id} | Restaurant ${provider.restaurant_id}`);

    // 3. Detect provider and normalize data
    const detected = provider.provider_name || detectProvider(payload);
    let normalized: NormalizedReservation;

    switch (detected) {
      case 'libro':   normalized = parseLibro(payload); break;
      case 'resy':    normalized = parseResy(payload); break;
      case 'zenchef': normalized = parseZenchef(payload); break;
      default:        normalized = parseGeneric(payload); break;
    }

    // 4. Update provider status if needed (activate on first webhook)
    const providerUpdate: Record<string, any> = { last_sync_at: new Date().toISOString() };
    if (provider.provider_name !== normalized.detected_provider || provider.status === 'pending') {
      providerUpdate.provider_name = normalized.detected_provider;
      providerUpdate.status = 'active';
    }
    await admin.from('reservation_providers').update(providerUpdate).eq('id', provider.id);

    // 5. Upsert reservation data
    const { error: upsertError } = await admin
      .from('reservations')
      .upsert({
        restaurant_id: provider.restaurant_id,
        provider_id: provider.id,
        external_id: normalized.external_id,
        guest_count: normalized.guest_count,
        reservation_time: normalized.reservation_time,
        status: normalized.status,
        customer_name: normalized.customer_name,
        customer_email: normalized.customer_email,
        customer_phone: normalized.customer_phone,
        customer_notes: normalized.customer_notes,
        raw_payload: payload,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'restaurant_id, external_id',
      });

    if (upsertError) {
      console.error('[Webhook/Reservations] Upsert error:', upsertError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, provider: normalized.detected_provider }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook/Reservations] Handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Health-check GET (useful for platform verification handshakes)
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'rive-reservations-webhook' });
}

