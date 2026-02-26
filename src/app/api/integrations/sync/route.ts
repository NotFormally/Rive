import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LibroService } from '@/lib/integrations/libro';
import { ResyService } from '@/lib/integrations/resy';
import { ZenchefService } from '@/lib/integrations/zenchef';
import { ProviderCredentials, ReservationProviderService, ProviderReservation } from '@/lib/integrations/types';

// Used for CRON Job (e.g., Vercel Cron)
// GET /api/integrations/sync
export async function GET(req: Request) {
  try {
    // 1. Verify cron secret to prevent unauthorized syncs
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[Integrations/Sync] Starting background synchronization...');

    // 2. Fetch all active providers
    const { data: providers, error: fetchError } = await (supabaseAdmin() as any)
      .from('reservation_providers')
      .select('id, restaurant_id, provider_name, api_key, oauth_token, refresh_token')
      .eq('status', 'active');

    if (fetchError || !providers) {
      console.error('[Integrations/Sync] Error fetching providers:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    const today = new Date();
    // Fetch from yesterday (to catch late changes) to 30 days in advance
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 1);
    
    const toDate = new Date(today);
    toDate.setDate(toDate.getDate() + 30);

    const results = {
      total: providers.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // 3. Iterate through active providers and sync
    for (const provider of providers) {
      try {
        let service: ReservationProviderService | null = null;
        
        switch (provider.provider_name) {
          case 'libro': service = new LibroService(); break;
          case 'resy': service = new ResyService(); break;
          case 'zenchef': service = new ZenchefService(); break;
        }

        if (!service) {
           console.warn(`[Integrations/Sync] Unknown provider type: ${provider.provider_name}`);
           continue;
        }

        const credentials: ProviderCredentials = {
          apiKey: provider.api_key,
          oauthToken: provider.oauth_token,
          refreshToken: provider.refresh_token
        };

        // Call the service generic interface
        const pulledReservations: ProviderReservation[] = await service.syncReservations(
          credentials,
          provider.restaurant_id,
          fromDate,
          toDate
        );

        // Map generic format to Supabase insert format
        const upsertPayload = pulledReservations.map(res => ({
          restaurant_id: provider.restaurant_id,
          provider_id: provider.id,
          external_id: res.externalId,
          guest_count: res.guestCount,
          reservation_time: res.reservationTime,
          status: res.status,
          customer_notes: res.customerNotes || null,
          raw_payload: res.rawPayload,
          updated_at: new Date().toISOString()
        }));

        if (upsertPayload.length > 0) {
          const { error: upsertError } = await (supabaseAdmin() as any)
            .from('reservations')
            .upsert(upsertPayload, {
              onConflict: 'restaurant_id, external_id'
            });

          if (upsertError) throw upsertError;
        }

        // Update last sync time
        await (supabaseAdmin() as any)
            .from('reservation_providers')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', provider.id);

        results.success++;
      } catch (err: any) {
        console.error(`[Integrations/Sync] Error syncing provider ${provider.id}:`, err);
        results.failed++;
        results.errors.push(`Provider ${provider.id} (${provider.provider_name}): ${err.message}`);
      }
    }

    return NextResponse.json({
      message: 'Synchronization completed',
      results
    });

  } catch (error: any) {
    console.error('[Integrations/Sync] Fatal Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
