// src/lib/integrations/zenchef.ts

import { ProviderCredentials, ProviderReservation, ReservationProviderService } from './types';

/**
 * Zenchef integration service based on API polling / REST actions.
 */
export class ZenchefService implements ReservationProviderService {
  async syncReservations(
    credentials: ProviderCredentials,
    restaurantId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<ProviderReservation[]> {
    if (!credentials.apiKey && (!credentials.oauthToken || !credentials.refreshToken)) {
      throw new Error('Zenchef authentication requires an API key or OAuth tokens');
    }

    console.log(`[Zenchef] Syncing reservations for ${restaurantId} from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
    
    // Real API Call Implementation for Zenchef
    // Documentation usually provided directly to the restaurant after request
    const response = await fetch(`https://api.zenchef.com/v1/restaurants/${restaurantId}/reservations?date_start=${fromDate.toISOString()}&date_end=${toDate.toISOString()}`, {
      method: 'GET',
      headers: {
        'x-zenchef-api-key': credentials.apiKey || '',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
       console.error(`[Zenchef] API Error: ${response.statusText}`);
       throw new Error(`Zenchef API returned ${response.status}`);
    }

    const data = await response.json();
    const reservations: any[] = data.reservations || [];

    return reservations.map((res: any) => ({
      externalId: res.id?.toString() || new Date().getTime().toString(),
      guestCount: res.guests_count || res.pax || 2,
      reservationTime: res.date || res.reservation_time,
      status: res.status === 'cancelled' ? 'cancelled' : 'booked',
      customerNotes: res.customer_notes || '',
      rawPayload: res
    }));
  }

  async updateReservationStatus(credentials: ProviderCredentials, externalId: string, status: string): Promise<boolean> {
    console.log(`[Zenchef] Updating status to ${status} for ${externalId}`);
    return true; // Simulate success
  }

  async addGuestNote(credentials: ProviderCredentials, externalId: string, note: string): Promise<boolean> {
    console.log(`[Zenchef] Adding note to ${externalId}: ${note}`);
    return true; // Simulate success
  }
}
