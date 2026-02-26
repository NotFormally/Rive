import { requireAuth, unauthorized } from '@/lib/auth';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase'; // Note: server edge needs to use auth.supabase instead of top-level client if using RLS, but here we can just pass the auth.supabase

export const maxDuration = 60; // Allow 60s for API fetches

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // 1. Fetch Stripe API Key from restaurant integrations
    const { data: integration, error: intError } = await auth.supabase
      .from('restaurant_integrations')
      .select('access_token')
      .eq('restaurant_id', auth.restaurantId)
      .eq('provider', 'stripe')
      .eq('is_active', true)
      .single();

    if (intError || !integration || !integration.access_token) {
      return new Response(JSON.stringify({ error: 'Stripe integration not found or inactive' }), { status: 400 });
    }

    // Initialize Stripe with user's specific API key
    const stripe = new Stripe(integration.access_token, {
      apiVersion: '2025-02-24.acacia' as any, // specify the latest or compatible version type
    });

    // 2. Fetch Menu Items to map names/pos_item_id
    const { data: menuItems, error: menuErr } = await auth.supabase
      .from('menu_items')
      .select('id, name, pos_item_id')
      .eq('restaurant_id', auth.restaurantId);

    if (menuErr) throw menuErr;

    // 3. Fetch Stripe Checkout Sessions from the past 7 days
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    
    // Auto-pagination over checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100, // Maximum allowed by Stripe
      created: { gte: sevenDaysAgo },
    });

    // We need to aggregate the quantity sold for each item.
    // In Stripe, we have to look up the line_items for each session.
    // Since this could be a lot of API calls, we use Promise.all with chunks or just standard async/await.
    const productQuantities: Record<string, number> = {};
    const productNameQuantities: Record<string, number> = {};

    for (const session of sessions.data) {
      // Only count completed paid sessions
      if (session.payment_status === 'paid') {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
        for (const item of lineItems.data) {
          const qty = item.quantity || 1;
          const productId = typeof item.price?.product === 'string' ? item.price.product : item.price?.product?.id;
          const description = item.description || 'Unknown'; // Fallback if no product ID but we have description

          if (productId) {
            productQuantities[productId] = (productQuantities[productId] || 0) + qty;
          }
          // We also track by name to do fuzzy matching if POS IDs aren't mapped
          productNameQuantities[description.toLowerCase()] = (productNameQuantities[description.toLowerCase()] || 0) + qty;
        }
      }
    }

    // Alternatively, if the restaurant uses Stripe Payment Intents directly without Checkout,
    // we would need to check Charges or Invoices. This targets standard Checkout flows.

    // 4. Match with our internal database and upsert pos_sales
    const upsertSalesData: any[] = [];
    const missingMappings: string[] = [];

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
      // Clean previous 7 days data for items updated to avoid duplicates
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
      message: `${upsertSalesData.length} articles synchronisés depuis Stripe pour les 7 derniers jours.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error syncing with Stripe:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
