import { requireAuth, unauthorized } from '@/lib/auth';

export const maxDuration = 60; // Allow 60s for API fetches

// Constantes d'exemple pour Lightspeed (Retail / Restaurant)
// Lightspeed nécessite souvent un Account ID inclus dans l'URL. Pour un MVP simplifié, nous 
// passerons tout dans le access_token ou présumerons une URL spécifique.
const LIGHTSPEED_BASE_URL = 'https://api.lightspeedapp.com/API/V3'; 

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // 1. Fetch Lightspeed Token from restaurant integrations
    const { data: integration, error: intError } = await auth.supabase
      .from('restaurant_integrations')
      .select('access_token')
      .eq('restaurant_id', auth.restaurantId)
      .eq('provider', 'lightspeed')
      .eq('is_active', true)
      .single();

    if (intError || !integration || !integration.access_token) {
      return new Response(JSON.stringify({ error: 'Lightspeed integration not found or inactive' }), { status: 400 });
    }

    // Example extracting account ID if the user pasted "ACCOUNT_ID:TOKEN"
    const [accountId, token] = integration.access_token.includes(':') 
      ? integration.access_token.split(':') 
      : ['UNKNOWN', integration.access_token];

    if (accountId === 'UNKNOWN') {
       return new Response(JSON.stringify({ error: 'Format invalide. Utilisez ACCOUNT_ID:TOKEN pour Lightspeed' }), { status: 400 });
    }

    // 2. Fetch Menu Items to map names/pos_item_id
    const { data: menuItems, error: menuErr } = await auth.supabase
      .from('menu_items')
      .select('id, name, pos_item_id')
      .eq('restaurant_id', auth.restaurantId);

    if (menuErr) throw menuErr;

    // 3. Fetch Sales from Lightspeed
    // Lightspeed pagination and date formatting. Usually requires YYYY-MM-DDTHH:MM:SS
    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const dateStart = sevenDaysAgoDate.toISOString();

    // Constructing the API Call (Assuming Lightspeed Retail endpoint structure for Sale/SaleLines)
    // Note: Lightspeed Restaurant (K-Series/L-Series) has a different endpoint structure. This is a generic abstraction.
    const response = await fetch(`${LIGHTSPEED_BASE_URL}/Account/${accountId}/Sale.json?timeStamp>=${encodeURIComponent(dateStart)}&load_relations=["SaleLines"]`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Lightspeed Error Response:", errorText);
        throw new Error(`Erreur API Lightspeed: ${response.status} ${response.statusText}`);
    }

    const { Sale: sales = [] } = await response.json();

    const productQuantities: Record<string, number> = {};
    const productNameQuantities: Record<string, number> = {};

    for (const sale of sales) {
      if (!sale.SaleLines?.SaleLine) continue;
      
      const lines = Array.isArray(sale.SaleLines.SaleLine) ? sale.SaleLines.SaleLine : [sale.SaleLines.SaleLine];

      for (const item of lines) {
        const qty = parseInt(item.unitQuantity) || 1;
        
        // ItemID usually links to the master item in Lightspeed
        const productId = item.itemID;
        const itemName = item.Item?.description || 'Unknown'; 

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
      message: `${upsertSalesData.length} articles synchronisés depuis Lightspeed pour les 7 derniers jours.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error syncing with Lightspeed:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
