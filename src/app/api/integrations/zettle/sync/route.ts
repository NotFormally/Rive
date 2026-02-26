import { requireAuth, unauthorized } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data: integration, error: intErr } = await auth.supabase
      .from('restaurant_integrations')
      .select('access_token')
      .eq('restaurant_id', auth.restaurantId)
      .eq('provider', 'zettle')
      .eq('is_active', true)
      .single();

    if (intErr || !integration?.access_token) {
      return new Response(JSON.stringify({ error: 'Zettle (iZettle) integration not active or missing API token.' }), { status: 400 });
    }

    // Last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // https://github.com/iZettle/api-documentation/blob/master/purchases.adoc
    const response = await fetch(`https://purchase.izettle.com/purchases/v2?startDate=${startStr}&endDate=${endStr}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zettle API Error:', response.status, errorText);
      if (response.status === 401 || response.status === 403) {
         return new Response(JSON.stringify({ 
           error: 'Clé d\'API Zettle invalide ou expirée.',
           matchedItems: 0
         }), { status: 401 });
      }
      throw new Error(`Zettle API responded with status: ${response.status}`);
    }

    const zettleData = await response.json();
    const purchases = zettleData.purchases || [];

    const itemSales: Record<string, number> = {};

    for (const purchase of purchases) {
        if (purchase.products) {
            for (const product of purchase.products) {
                const name = product.name;
                const qty = product.quantity ? parseInt(product.quantity, 10) : 1;
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
      message: `${matchedCount} articles synchronisés via Zettle.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error syncing with Zettle:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
