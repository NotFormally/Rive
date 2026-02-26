import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// =============================================================================
// Reservation Sync Cron Route — Polls Libro, Resy, Zenchef APIs
// Endpoint: GET /api/cron/sync-reservations (called by Vercel Cron or external scheduler)
//
// Architecture:
//   1. Fetch all providers with polling_enabled = true and status = 'active'
//   2. Skip providers where circuit breaker has tripped (sync_errors_count >= 5)
//   3. For each provider, call the appropriate API client
//   4. Normalize & upsert reservations, log results to reservation_sync_log
//
// Security: Protected by CRON_SECRET header (set in Vercel environment)
// =============================================================================

const CRON_SECRET = process.env.CRON_SECRET;
const CIRCUIT_BREAKER_THRESHOLD = 5; // consecutive errors before disabling polling

// ---------------------------------------------------------------------------
// Provider API Clients — Each returns an array of normalized reservations
// ---------------------------------------------------------------------------

type NormalizedReservation = {
  external_id: string;
  guest_count: number;
  reservation_time: string;
  status: 'booked' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_notes: string | null;
};

// --- Libro API Client ---
async function fetchLibroReservations(
  apiKey: string,
  config: Record<string, any>
): Promise<NormalizedReservation[]> {
  // Libro API: GET /api/v2/reservations?location_id=XXX&date_from=YYYY-MM-DD
  const baseUrl = config.api_base_url || 'https://api.libro.app/api/v2';
  const locationId = config.location_id || config.venue_id;
  
  // Fetch today's and tomorrow's reservations
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const response = await fetch(
    `${baseUrl}/reservations?location_id=${locationId}&date_from=${today}&date_to=${tomorrow}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    }
  );

  if (!response.ok) {
    throw new Error(`Libro API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const reservations = data.reservations || data.data || [];

  return reservations.map((r: any) => ({
    external_id: String(r.id || r.booking_id),
    guest_count: r.party_size || r.covers || 2,
    reservation_time: r.date_time || r.time || r.start_time,
    status: mapLibroStatus(r.status),
    customer_name: r.guest_name || (r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : null),
    customer_email: r.guest_email || r.email || null,
    customer_phone: r.guest_phone || r.phone || null,
    customer_notes: r.notes || r.special_requests || null,
  }));
}

function mapLibroStatus(status: string): NormalizedReservation['status'] {
  const map: Record<string, NormalizedReservation['status']> = {
    confirmed: 'booked', created: 'booked', pending: 'booked',
    seated: 'seated', completed: 'completed',
    cancelled: 'cancelled', no_show: 'no_show',
  };
  return map[status] || 'booked';
}

// --- Resy API Client ---
async function fetchResyReservations(
  apiKey: string,
  config: Record<string, any>
): Promise<NormalizedReservation[]> {
  // Resy API: GET /api/v3/venue/reservations?venue_id=XXX
  const baseUrl = config.api_base_url || 'https://api.resy.com/api/v3';
  const venueId = config.venue_id;

  const today = new Date().toISOString().split('T')[0];

  const response = await fetch(
    `${baseUrl}/venue/reservations?venue_id=${venueId}&date=${today}`,
    {
      headers: {
        'Authorization': `ResyAPI api_key="${apiKey}"`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error(`Resy API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const reservations = data.reservations || data.results || [];

  return reservations.map((r: any) => ({
    external_id: String(r.id || r.resy_token),
    guest_count: r.party_size || r.num_seats || 2,
    reservation_time: r.time || (r.day ? `${r.day}T${r.time_slot || '19:00'}` : new Date().toISOString()),
    status: mapResyStatus(r.status),
    customer_name: r.client?.first_name ? `${r.client.first_name} ${r.client.last_name || ''}`.trim() : null,
    customer_email: r.client?.email_address || r.client?.email || null,
    customer_phone: r.client?.phone_number || null,
    customer_notes: r.special_request || r.client?.notes || null,
  }));
}

function mapResyStatus(status: string): NormalizedReservation['status'] {
  const map: Record<string, NormalizedReservation['status']> = {
    booked: 'booked', confirmed: 'booked',
    seated: 'seated', finished: 'completed',
    cancelled: 'cancelled', no_show: 'no_show',
  };
  return map[status] || 'booked';
}

// --- Zenchef API Client ---
async function fetchZenchefReservations(
  apiKey: string,
  config: Record<string, any>
): Promise<NormalizedReservation[]> {
  // Zenchef API: GET /api/v1/bookings?restaurant_id=XXX
  const baseUrl = config.api_base_url || 'https://api.zenchef.com/api/v1';
  const restaurantSlug = config.restaurant_slug || config.restaurant_id;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const response = await fetch(
    `${baseUrl}/bookings?restaurant_id=${restaurantSlug}&from=${today}&to=${tomorrow}`,
    {
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error(`Zenchef API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const bookings = data.bookings || data.data || [];

  return bookings.map((b: any) => ({
    external_id: String(b.id || b.booking_id),
    guest_count: b.nb_guests || b.party_size || b.pax || 2,
    reservation_time: b.date_time || b.datetime || (b.date && b.time ? `${b.date}T${b.time}` : b.date),
    status: mapZenchefStatus(b.status),
    customer_name: b.client_name || (b.customer?.first_name ? `${b.customer.first_name} ${b.customer.last_name || ''}`.trim() : null),
    customer_email: b.client_email || b.customer?.email || null,
    customer_phone: b.client_phone || b.customer?.phone || null,
    customer_notes: b.comment || b.notes || null,
  }));
}

function mapZenchefStatus(status: string): NormalizedReservation['status'] {
  const map: Record<string, NormalizedReservation['status']> = {
    confirmed: 'booked', pending: 'booked', validated: 'booked',
    seated: 'seated', completed: 'completed',
    cancelled: 'cancelled', noshow: 'no_show', no_show: 'no_show',
  };
  return map[status] || 'booked';
}

// ---------------------------------------------------------------------------
// Fetch dispatcher — routes to the correct API client based on provider_name
// ---------------------------------------------------------------------------
async function fetchReservationsForProvider(
  providerName: string,
  apiKey: string,
  config: Record<string, any>
): Promise<NormalizedReservation[]> {
  switch (providerName) {
    case 'libro':   return fetchLibroReservations(apiKey, config);
    case 'resy':    return fetchResyReservations(apiKey, config);
    case 'zenchef': return fetchZenchefReservations(apiKey, config);
    default:
      throw new Error(`Unknown provider: ${providerName}. Polling not supported.`);
  }
}

// ---------------------------------------------------------------------------
// Main GET handler — called by Vercel Cron
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  // 1. Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const results: Array<{ provider_id: string; status: string; detail: string }> = [];

  try {
    // 2. Fetch all active providers with polling enabled
    const { data: providers, error: fetchError } = await (admin as any)
      .from('reservation_providers')
      .select('id, restaurant_id, provider_name, api_key, provider_config, sync_errors_count, polling_interval_minutes, last_poll_at')
      .eq('polling_enabled', true)
      .eq('status', 'active');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!providers || providers.length === 0) {
      return NextResponse.json({ message: 'No providers to poll', results: [] });
    }

    // 3. Process each provider
    for (const provider of providers) {
      const startTime = Date.now();

      // Circuit breaker check: skip providers with too many consecutive errors
      if (provider.sync_errors_count >= CIRCUIT_BREAKER_THRESHOLD) {
        results.push({
          provider_id: provider.id,
          status: 'skipped',
          detail: `Circuit breaker open (${provider.sync_errors_count} consecutive errors)`,
        });
        continue;
      }

      // Respect polling interval: skip if polled too recently
      if (provider.last_poll_at) {
        const intervalMs = (provider.polling_interval_minutes || 15) * 60 * 1000;
        const lastPoll = new Date(provider.last_poll_at).getTime();
        if (Date.now() - lastPoll < intervalMs) {
          results.push({
            provider_id: provider.id,
            status: 'skipped',
            detail: 'Polling interval not yet elapsed',
          });
          continue;
        }
      }

      // No API key? Can't poll.
      if (!provider.api_key) {
        results.push({
          provider_id: provider.id,
          status: 'skipped',
          detail: 'No API key configured',
        });
        continue;
      }

      try {
        // 4. Fetch reservations from the provider API
        const reservations = await fetchReservationsForProvider(
          provider.provider_name,
          provider.api_key,
          provider.provider_config || {}
        );

        // 5. Upsert each reservation
        let created = 0;
        let updated = 0;
        let errors = 0;

        for (const res of reservations) {
          const { error: upsertError } = await (admin as any)
            .from('reservations')
            .upsert({
              restaurant_id: provider.restaurant_id,
              provider_id: provider.id,
              external_id: res.external_id,
              guest_count: res.guest_count,
              reservation_time: res.reservation_time,
              status: res.status,
              customer_name: res.customer_name,
              customer_email: res.customer_email,
              customer_phone: res.customer_phone,
              customer_notes: res.customer_notes,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'restaurant_id, external_id',
            });

          if (upsertError) {
            errors++;
            console.error(`[Sync] Upsert error for ${res.external_id}:`, upsertError.message);
          } else {
            // Note: Supabase upsert doesn't distinguish created vs updated easily
            // We count all as "updated" for simplicity; the sync log tracks the total
            updated++;
          }
        }

        const durationMs = Date.now() - startTime;

        // 6. Log success to reservation_sync_log
        await (admin as any).from('reservation_sync_log').insert({
          provider_id: provider.id,
          restaurant_id: provider.restaurant_id,
          sync_type: 'polling',
          status: errors > 0 ? 'partial' : 'success',
          reservations_created: created,
          reservations_updated: updated,
          errors_count: errors,
          duration_ms: durationMs,
        });

        // 7. Reset circuit breaker and update timestamps
        await (admin as any).from('reservation_providers').update({
          sync_errors_count: 0,
          last_sync_at: new Date().toISOString(),
          last_poll_at: new Date().toISOString(),
        }).eq('id', provider.id);

        results.push({
          provider_id: provider.id,
          status: 'success',
          detail: `Synced ${reservations.length} reservations (${errors} errors) in ${durationMs}ms`,
        });

      } catch (err: any) {
        const durationMs = Date.now() - startTime;

        // Log error to reservation_sync_log
        await (admin as any).from('reservation_sync_log').insert({
          provider_id: provider.id,
          restaurant_id: provider.restaurant_id,
          sync_type: 'polling',
          status: 'error',
          errors_count: 1,
          error_message: err.message,
          error_details: { stack: err.stack?.substring(0, 500) },
          duration_ms: durationMs,
        });

        // Increment circuit breaker counter
        await (admin as any).from('reservation_providers').update({
          sync_errors_count: (provider.sync_errors_count || 0) + 1,
          last_poll_at: new Date().toISOString(),
        }).eq('id', provider.id);

        results.push({
          provider_id: provider.id,
          status: 'error',
          detail: err.message,
        });
      }
    }

    return NextResponse.json({
      message: `Polling complete. ${results.length} providers processed.`,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cron/Sync] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
