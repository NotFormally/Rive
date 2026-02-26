// src/lib/integrations/resy.ts

import { ProviderCredentials, ProviderReservation, ReservationProviderService } from './types';

/**
 * Resy integration service based on API polling / REST actions.
 */
export class ResyService implements ReservationProviderService {
  async syncReservations(
    credentials: ProviderCredentials,
    restaurantId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<ProviderReservation[]> {
    if (!credentials.apiKey) {
      throw new Error('Resy authentication requires an API key');
    }

    console.log(`[Resy] Syncing reservations for ${restaurantId} from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
    
    // Real API Call Implementation for Resy (Reverse Engineered)
    // Requires both the API Key and the User Auth token
    const [apiKey, authToken] = credentials.apiKey ? credentials.apiKey.split('|') : ['', ''];

    if (!apiKey || !authToken) {
      throw new Error('Resy requires an API key and Auth Token separated by a pipe (|)');
    }

    const response = await fetch(`https://api.resy.com/3/details?day=${fromDate.toISOString().split('T')[0]}&venue_id=${restaurantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `ResyAPI api_key="${apiKey}"`,
        'X-Resy-Auth-Token': authToken,
        'X-Resy-Universal-Auth': authToken,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
       console.error(`[Resy] API Error: ${response.statusText}`);
       throw new Error(`Resy API returned ${response.status}`);
    }

    const data = await response.json();
    const reservations: any[] = data.reservations || [];

    return reservations.map((res: any) => ({
      externalId: res.reservation_id?.toString() || new Date().getTime().toString(),
      guestCount: res.party_size || 2,
      reservationTime: res.time || res.reservation_time,
      status: res.state === 'cancelled' ? 'cancelled' : 'booked',
      customerNotes: res.notes || '',
      rawPayload: res
    }));
  }

  async updateReservationStatus(credentials: ProviderCredentials, externalId: string, status: string): Promise<boolean> {
    console.log(`[Resy] Updating status to ${status} for ${externalId}`);
    return true; // Simulate success
  }

  async addGuestNote(credentials: ProviderCredentials, externalId: string, note: string): Promise<boolean> {
    console.log(`[Resy] Adding note to ${externalId}: ${note}`);
    return true; // Simulate success
  }
}
