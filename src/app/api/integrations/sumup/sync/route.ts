import { requireAuth, unauthorized } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data: integration, error: intErr } = await auth.supabase
      .from('restaurant_integrations')
      .select('access_token')
      .eq('restaurant_id', auth.restaurantId)
      .eq('provider', 'sumup')
      .eq('is_active', true)
      .single();

    if (intErr || !integration?.access_token) {
      return new Response(JSON.stringify({ error: 'SumUp integration not active or missing API token.' }), { status: 400 });
    }

    // Last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    // SumUp expects RFC3339 format
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // https://developer.sumup.com/docs/api/transactions/
    const response = await fetch(`https://api.sumup.com/v0.1/me/transactions/history?changes_since=${startStr}&changes_until=${endStr}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SumUp API Error:', response.status, errorText);
      if (response.status === 401 || response.status === 403) {
         return new Response(JSON.stringify({ 
           error: 'Clé SumUp invalide ou expirée.',
           matchedItems: 0
         }), { status: 401 });
      }
      throw new Error(`SumUp API responded with status: ${response.status}`);
    }

    const sumupData = await response.json();
    const transactions = sumupData.items || [];

    const itemSales: Record<string, number> = {};

    // SumUp line items are usually inside a 'products' array on a detailed transaction fetch.
    // If they aren't in the list view, an extra fetch per transaction might be needed, 
    // but we assume standard checkout products are embedded for this MVP logic.
    for (const trx of transactions) {
        if (trx.status !== 'SUCCESSFUL' && trx.status !== 'PAID') continue;

        if (trx.products) {
            for (const product of trx.products) {
                const name = product.name;
                const qty = product.quantity || 1;
                if (name) {
                    itemSales[name] = (itemSales[name] || 0) + qty;
                }
            }
        }
    }

    // Rive Menu
    const { data: menuItems, error: menuErr } = await auth.supabase
      .from('menu_items')
      .select('id, name, pos_item_id')
      .eq('restaurant_id', auth.restaurantId);

    if (menuErr) throw menuErr;
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();

    const upsertData = [];
    let matchedCount = 0;

    for (const item of menuItems || []) {
      let soldQty = 0;

      if (item.pos_item_id && itemSales[item.pos_item_id]) {
        soldQty = itemSales[item.pos_item_id];
      } else {
        const normalizedRiveName = normalize(item.name);
        for (const [posName, qty] of Object.entries(itemSales)) {
          if (normalize(posName).includes(normalizedRiveName) || normalizedRiveName.includes(normalize(posName))) {
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

    if (upsertData.length > 0) {
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
      message: `${matchedCount} articles synchronisés via SumUp.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error syncing with SumUp:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
