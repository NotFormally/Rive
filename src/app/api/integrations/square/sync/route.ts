import { requireAuth, unauthorized } from '@/lib/auth';
import { SquareClient, SquareEnvironment } from 'square';

export const maxDuration = 60; // Allow 60s for API fetches

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // 1. Fetch Square API Key from restaurant integrations
    const { data: integration, error: intError } = await auth.supabase
      .from('restaurant_integrations')
      .select('access_token')
      .eq('restaurant_id', auth.restaurantId)
      .eq('provider', 'square')
      .eq('is_active', true)
      .single();

    if (intError || !integration || !integration.access_token) {
      return new Response(JSON.stringify({ error: 'Square integration not found or inactive' }), { status: 400 });
    }

    // Initialize Square Client
    // Important: Determine environment based on token prefix if needed, default to PRODUCTION
    const isSandbox = integration.access_token.startsWith('EAAA'); // Typical sandbox prefix is EAAAE
    const client = new SquareClient({
      token: integration.access_token,
      environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    });

    // 2. Fetch Menu Items to map names/pos_item_id
    const { data: menuItems, error: menuErr } = await auth.supabase
      .from('menu_items')
      .select('id, name, pos_item_id')
      .eq('restaurant_id', auth.restaurantId);

    if (menuErr) throw menuErr;

    // 3. Search Orders from the past 7 days
    // Calculate 7 days ago in RFC 3339 format
    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const sevenDaysAgo = sevenDaysAgoDate.toISOString();

    // We need location IDs to search orders. Fetch locations first:
    const locationsResponse = await client.locations.list();
    const locationIds = (locationsResponse.locations?.map(l => l.id).filter(Boolean) as string[]) || [];

    if (locationIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No locations found for this Square account' }), { status: 400 });
    }

    const ordersResponse = await client.orders.search({
      locationIds,
      query: {
        filter: {
          stateFilter: {
            states: ['COMPLETED']
          },
          dateTimeFilter: {
            createdAt: {
              startAt: sevenDaysAgo
            }
          }
        }
      }
    });

    const orders = ordersResponse.orders || [];

    const productQuantities: Record<string, number> = {};
    const productNameQuantities: Record<string, number> = {};

    for (const order of orders) {
      if (!order.lineItems) continue;
      
      for (const item of order.lineItems) {
        const qty = parseInt(item.quantity) || 1;
        
        // Square has catalogObjectId, variationName, and plain name.
        const productId = item.catalogObjectId;
        const itemName = item.name || 'Unknown';

        if (productId) {
          productQuantities[productId] = (productQuantities[productId] || 0) + qty;
        }
        productNameQuantities[itemName.toLowerCase()] = (productNameQuantities[itemName.toLowerCase()] || 0) + qty;
      }
    }

    // 4. Match with our internal database and upsert pos_sales
    const upsertSalesData: any[] = [];
    
    for (const item of menuItems || []) {
      const dbProductId = item.pos_item_id;
      const dbProductName = item.name.toLowerCase();

      let soldQty = 0;

      // Try exact ID match first
      if (dbProductId && productQuantities[dbProductId]) {
        soldQty = productQuantities[dbProductId];
      }
      // Try fuzzy name match
      else if (productNameQuantities[dbProductName]) {
        soldQty = productNameQuantities[dbProductName];
      }

      if (soldQty > 0) {
        upsertSalesData.push({
          restaurant_id: auth.restaurantId,
          menu_item_id: item.id,
          quantity_sold_weekly: soldQty,
          recorded_at: new Date().toISOString()
        });
      }
    }

    // 5. Update DB
    if (upsertSalesData.length > 0) {
      await auth.supabase
        .from('pos_sales')
        .delete()
        .eq('restaurant_id', auth.restaurantId)
        .in('menu_item_id', upsertSalesData.map(u => u.menu_item_id));

      const { error: insertErr } = await auth.supabase
        .from('pos_sales')
        .insert(upsertSalesData);
        
      if (insertErr) {
        console.error("Error inserting sales data:", insertErr);
        throw insertErr;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      matchedItems: upsertSalesData.length,
      message: `${upsertSalesData.length} articles synchronisés depuis Square pour les 7 derniers jours.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error syncing with Square:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
