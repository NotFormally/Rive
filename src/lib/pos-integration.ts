import { SupabaseClient } from '@supabase/supabase-js';

// Simulated POS Integration (Lightspeed / Square / Toast)

export type POSProvider = 'mock' | 'lightspeed' | 'square' | 'supabase';

export type SalesData = {
  menuItemId: string;
  quantitySoldWeekly: number;
  revenueWeekly: number;
};

/**
 * Fetch weekly sales data from the POS system.
 * In a real application, this would use the provider's API 
 * (e.g., Lightspeed Retail API, Square Catalog API) to match Supabase UUIDs with POS Item IDs.
 */
export async function fetchWeeklySales(
  provider: POSProvider, 
  activeMenuItemIds: string[],
  supabase?: SupabaseClient,
  restaurantId?: string
): Promise<SalesData[]> {
  
  if (provider === 'supabase' && supabase && restaurantId) {
    const { data, error } = await supabase
      .from('pos_sales')
      .select('menu_item_id, quantity_sold_weekly')
      .eq('restaurant_id', restaurantId)
      .in('menu_item_id', activeMenuItemIds);

    if (error) {
      console.error('Failed to fetch POS sales from Supabase:', error);
      return [];
    }

    return (data || []).map(row => ({
      menuItemId: row.menu_item_id,
      quantitySoldWeekly: row.quantity_sold_weekly,
      revenueWeekly: 0,
    }));
  }

  if (provider === 'mock') {
    return generateMockSalesData(activeMenuItemIds);
  }

  // Abstract interfaces for future real integrations:
  if (provider === 'lightspeed') {
    throw new Error('Lightspeed API integration not yet configured.');
  }

  if (provider === 'square') {
    throw new Error('Square API integration not yet configured.');
  }

  return [];
}

/**
 * Generates realistic but deterministic mock sales data for demonstration.
 * It uses the UUID string to create a consistent "random" number of orders 
 * so the dashboard doesn't flicker on every reload, while ensuring that
 * items stay in consistent BCG categories (Star, Dog, etc).
 */
function generateMockSalesData(itemIds: string[]): SalesData[] {
  return itemIds.map(id => {
    // Generate a pseudo-random number of weekly orders (between 10 and 150) based on the UUID characters
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    
    // Use the absolute hash value to deterministically pick a quantity sold
    const quantitySoldWeekly = 10 + (Math.abs(hash) % 140);
    
    return {
      menuItemId: id,
      quantitySoldWeekly,
      revenueWeekly: 0, // Revenue is calculated dynamically later using the Supabase price
    };
  });
}
