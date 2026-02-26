import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';

// =============================================================================
// Test Webhook Route — Verifies provider webhook configuration
// Endpoint: POST /api/reservations/test-webhook
//
// Sends a synthetic test payload to the universal webhook endpoint to verify
// that a provider's webhook_token is valid and the pipeline works end-to-end.
// Useful during onboarding: restaurant owner sets up a provider, clicks "Test",
// and sees immediate confirmation that data flows correctly.
// =============================================================================

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const body = await req.json();
    const { provider_id } = body;

    if (!provider_id) {
      return NextResponse.json({ error: 'Missing provider_id' }, { status: 400 });
    }

    // 1. Fetch the provider to get its webhook_token and provider_name
    const { data: provider, error: fetchError } = await auth.supabase
      .from('reservation_providers')
      .select('id, webhook_token, provider_name, status')
      .eq('id', provider_id)
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (fetchError || !provider) {
      return NextResponse.json(
        { error: 'Provider not found or access denied' },
        { status: 404 }
      );
    }

    // 2. Build a synthetic test payload matching the provider's expected format
    const testPayload = buildTestPayload(provider.provider_name || 'generic');

    // 3. Send the test webhook to our own universal webhook endpoint
    const baseUrl = getBaseUrl(req);
    const webhookUrl = `${baseUrl}/api/webhooks/reservations?token=${provider.webhook_token}`;

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const webhookResult = await webhookResponse.json();

    // 4. Return the result with diagnostic info
    if (webhookResponse.ok && webhookResult.success) {
      return NextResponse.json({
        success: true,
        message: `Test webhook successful for ${provider.provider_name || 'generic'} provider`,
        provider_id: provider.id,
        webhook_status: webhookResponse.status,
        detected_provider: webhookResult.provider,
        test_external_id: testPayload._test_external_id, // So the frontend can show/clean it up
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Webhook endpoint returned an error',
        provider_id: provider.id,
        webhook_status: webhookResponse.status,
        webhook_error: webhookResult.error || 'Unknown error',
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error('[TestWebhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helper: Build synthetic test payloads mimicking each provider's format
// ---------------------------------------------------------------------------

function buildTestPayload(providerName: string): any {
  const testId = `test_${Date.now()}`;
  const testTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

  const base = { _test_external_id: testId };

  switch (providerName) {
    case 'libro':
      return {
        ...base,
        action: 'created',
        reservation: {
          id: testId,
          party_size: 4,
          date_time: testTime,
          status: 'confirmed',
          guest_name: 'Test Libro Guest',
          guest_email: 'test@libro.example.com',
          guest_phone: '+1-555-TEST-LIB',
          notes: '🧪 Test webhook — safe to delete',
        },
      };

    case 'resy':
      return {
        ...base,
        event_type: 'reservation_created',
        reservation: {
          id: testId,
          party_size: 2,
          day: testTime.split('T')[0],
          time_slot: '19:30',
          status: 'booked',
          client: {
            first_name: 'Test',
            last_name: 'Resy Guest',
            email_address: 'test@resy.example.com',
            phone_number: '+1-555-TEST-RES',
            notes: '🧪 Test webhook — safe to delete',
          },
        },
      };

    case 'zenchef':
      return {
        ...base,
        event: 'booking.created',
        data: {
          id: testId,
          nb_guests: 3,
          date: testTime.split('T')[0],
          time: '20:00',
          status: 'confirmed',
          client_name: 'Test Zenchef Guest',
          client_email: 'test@zenchef.example.com',
          client_phone: '+1-555-TEST-ZEN',
          comment: '🧪 Test webhook — safe to delete',
        },
      };

    default:
      // Generic format that the universal webhook can parse
      return {
        ...base,
        reservation: {
          id: testId,
          party_size: 2,
          date_time: testTime,
          status: 'booked',
          guest_name: 'Test Generic Guest',
          guest_email: 'test@example.com',
          notes: '🧪 Test webhook — safe to delete',
        },
      };
  }
}

// ---------------------------------------------------------------------------
// Helper: Determine base URL from the request
// ---------------------------------------------------------------------------
function getBaseUrl(req: Request): string {
  const url = new URL(req.url);
  // In production, use the canonical host. In dev, use the request origin.
  return `${url.protocol}//${url.host}`;
}
