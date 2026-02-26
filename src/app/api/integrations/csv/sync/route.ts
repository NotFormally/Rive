import { requireAuth, unauthorized } from '@/lib/auth';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { MODEL_EXTRACT } from '@/lib/ai-models';

export const maxDuration = 60; // Allow 60s for API fetches/AI processing

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { csvData } = await req.json();

    if (!csvData || typeof csvData !== 'string') {
      return new Response(JSON.stringify({ error: 'CSV data is required' }), { status: 400 });
    }

    // Protection: Let's limit the CSV string size passed to the AI to prevent massive token usage
    // Taking the first 50,000 characters (approx 10,000 tokens) should cover ~500 rows easily.
    const truncatedCsv = csvData.substring(0, 50000);

    // 1. Fetch existing menu items for mapping
    const { data: menuItems, error: menuErr } = await auth.supabase
      .from('menu_items')
      .select('id, name')
      .eq('restaurant_id', auth.restaurantId);

    if (menuErr) throw menuErr;
    
    // We create a strict list of allowed item names to help the AI map directly
    const menuItemNames = (menuItems || []).map(m => m.name);

    // 2. Use AI to extract quantities for known menu items from the CSV chaos
    // We ask Claude to find columns that look like "Item Name" and "Quantity Sold",
    // and extract the totals.
    
    let extractedSales;
    try {
      const { object } = await generateObject({
        model: anthropic(MODEL_EXTRACT),
        schema: z.object({
          items: z.array(z.object({
            matchedName: z.string().describe('The name of the item from the provided known menu list that best matches the CSV row.'),
            quantity: z.number().describe('The aggregated total quantity sold for this item.'),
          })).describe('List of extracted and aggregated sales from the CSV.')
        }),
        messages: [
          {
            role: 'user',
            content: `Here is a list of my current restaurant menu items:
${menuItemNames.join('\\n')}

Here is a raw CSV export of sales data from an unknown POS system:
---CSV START---
${truncatedCsv}
---CSV END---

Your task:
1. Identify which column represents the product name and which represents the quantity sold (or count occurrences, depending on the CSV structure).
2. Aggregate the sold quantities for each product.
3. Map the product names found in the CSV to the closest matching item in my "current restaurant menu items" list. Ignore items that are clearly not on my menu (e.g. "Gift Card", "Custom Amount").
4. Return the aggregated quantity for each matched menu item. If the CSV spans multiple days, sum the quantities up.`
          }
        ],
      });
      extractedSales = object.items;
    } catch (aiError) {
      console.error('AI CSV parsing failed:', aiError);
      return new Response(JSON.stringify({ error: 'Le fichier n\'a pas pu être lu. Vérifiez le format du CSV.' }), { status: 400 });
    }

    if (!extractedSales || extractedSales.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        matchedItems: 0, 
        message: 'Aucun produit correspondant trouvé dans le CSV.' 
      }), { status: 200 });
    }

    // 3. Upsert into Supabase pos_sales
    const upsertSalesData: any[] = [];
    
    // Create a map for quick lookup
    const menuItemsMap = new Map(menuItems?.map(m => [m.name, m.id]));

    for (const sale of extractedSales) {
      const itemId = menuItemsMap.get(sale.matchedName);
      if (itemId && sale.quantity > 0) {
        upsertSalesData.push({
          restaurant_id: auth.restaurantId,
          menu_item_id: itemId,
          quantity_sold_weekly: sale.quantity,
          recorded_at: new Date().toISOString()
        });
      }
    }

    // Update DB
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
        throw insertErr;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      matchedItems: upsertSalesData.length,
      message: `${upsertSalesData.length} articles synchronisés via l'import CSV.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error importing CSV:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
