// src/lib/integrations/types.ts

// The standardized Reservation object we want all providers to return
export interface ProviderReservation {
  externalId: string;
  guestCount: number;
  reservationTime: string; // ISO String
  status: 'booked' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  customerNotes?: string;
  rawPayload: any;
}

export interface ProviderCredentials {
  apiKey?: string;
  oauthToken?: string;
  refreshToken?: string;
}

export interface ReservationProviderService {
  /**
   * Used to pull reservations matching a specific date range.
   * Useful for initial sync or background CRON jobs.
   */
  syncReservations(
    credentials: ProviderCredentials,
    restaurantId: string, 
    fromDate: Date, 
    toDate: Date
  ): Promise<ProviderReservation[]>;

  /**
   * Action to update a reservation status if the native API allows it.
   */
  updateReservationStatus(
    credentials: ProviderCredentials,
    externalId: string, 
    status: string
  ): Promise<boolean>;

  /**
   * Action to push an internal Rive note to the native provider dashboard.
   */
  addGuestNote?(
    credentials: ProviderCredentials,
    externalId: string, 
    note: string
  ): Promise<boolean>;
}
