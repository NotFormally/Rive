import { requireAuth, unauthorized } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // 1. Get Toast Credentials
    const { data: integration, error: intErr } = await auth.supabase
      .from('restaurant_integrations')
      .select('access_token')
      .eq('restaurant_id', auth.restaurantId)
      .eq('provider', 'toast')
      .eq('is_active', true)
      .single();

    if (intErr || !integration?.access_token) {
      return new Response(JSON.stringify({ error: 'Toast integration not active or missing API token.' }), { status: 400 });
    }

    // Determine the date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    // Toast uses specific date formatting usually ISO8601
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // 2. Fetch Orders from Toast API
    // Note: Toast API usually requires a restaurantGuid in the URL.
    // In a generic MVP setup, the user might provide their token as 'restaurantGuid:clientSecret'
    // For this implementation, we assume a standard authorization header or that token holds the necessary auth.
    // See Toast Developer docs for exact endpoints, usually: https://ws-api.toasttab.com/orders/v2/orders
    
    // We are simulating the network call structure here as it requires a live M2M Toast token to return a 200.
    const response = await fetch(`https://ws-api.toasttab.com/orders/v2/orders?startDate=${startDateStr}&endDate=${endDateStr}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Toast API Error:', response.status, errorText);
      // Don't fail the whole sync process if credentials are just invalid/test ones, instead notify the user
      if (response.status === 401 || response.status === 403) {
         return new Response(JSON.stringify({ 
           error: 'Invalid Toast API Credentials. Please check your settings.',
           matchedItems: 0
         }), { status: 401 });
      }
      throw new Error(`Toast API responded with status: ${response.status}`);
    }

    const toastData = await response.json();
    const orders = toastData || [];

    // 3. Aggregate Item Quantities
    const itemSales: Record<string, number> = {};

    for (const order of orders) {
      if (order.checks) {
         for (const check of order.checks) {
             if (check.selections) {
                 for (const selection of check.selections) {
                     // Toast item names are usually deep down
                     const itemName = selection.item?.name || selection.name;
                     const quantity = selection.quantity || 1;
                     
                     if (itemName) {
                         itemSales[itemName] = (itemSales[itemName] || 0) + quantity;
                     }
                 }
             }
         }
      }
    }

    // 4. Fetch Rive menu items
    const { data: menuItems, error: menuErr } = await auth.supabase
      .from('menu_items')
      .select('id, name, pos_item_id')
      .eq('restaurant_id', auth.restaurantId);

    if (menuErr) throw menuErr;

    // Normalize strings for naive matching
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();

    // 5. Match and Build Upsert Data
    const upsertData = [];
    let matchedCount = 0;

    for (const item of menuItems || []) {
      let soldQty = 0;

      // Match by exact pos_item_id first
      if (item.pos_item_id && itemSales[item.pos_item_id]) {
        soldQty = itemSales[item.pos_item_id];
      } else {
        // Fallback: Fuzzy match by name
        const normalizedRiveName = normalize(item.name);
        for (const [toastName, qty] of Object.entries(itemSales)) {
          if (normalize(toastName).includes(normalizedRiveName) || normalizedRiveName.includes(normalize(toastName))) {
            soldQty += qty;
          }
        }
      }

      if (soldQty > 0) {
        upsertData.push({
          restaurant_id: auth.restaurantId,
          menu_item_id: item.id,
          quantity_sold_weekly: soldQty,
          recorded_at: new Date().toISOString()
        });
        matchedCount++;
      }
    }

    // 6. Save to Supabase
    if (upsertData.length > 0) {
      // First delete old POS sales for these matched items to avoid duplicates
      await auth.supabase
        .from('pos_sales')
        .delete()
        .eq('restaurant_id', auth.restaurantId)
        .in('menu_item_id', upsertData.map(u => u.menu_item_id));

      const { error: upsertErr } = await auth.supabase
        .from('pos_sales')
        .insert(upsertData);

      if (upsertErr) throw upsertErr;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      matchedItems: matchedCount,
      message: `${matchedCount} articles synchronisés via Toast.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error syncing with Toast:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
