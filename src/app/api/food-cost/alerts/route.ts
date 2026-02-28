import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data: alerts, error } = await auth.supabase
      .from('food_cost_alerts')
      .select(`
        id,
        restaurant_id,
        recipe_id,
        trigger_ingredient_id,
        previous_cost,
        new_cost,
        ai_recommendation,
        status,
        created_at,
        recipes (
          menu_item_id
        ),
        ingredients (
          name
        )
      `)
      .eq('restaurant_id', auth.restaurantId)
      .eq('status', 'unread')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // We need to fetch menu item names
    if (alerts && alerts.length > 0) {
      const { data: menuItems } = await auth.supabase
        .from('menu_items')
        .select('id, name')
        .in('id', alerts.map((a: any) => a.recipes?.menu_item_id).filter(Boolean));
        
      const menuMap = new Map(menuItems?.map(i => [i.id, i.name]));
      
      const enrichedAlerts = alerts.map((a: any) => ({
          ...a,
          recipe_name: menuMap.get(a.recipes?.menu_item_id) || 'Recette Inconnue',
          ingredient_name: a.ingredients?.name || 'Multiples Ingrédients'
      }));
      
      return NextResponse.json({ alerts: enrichedAlerts });
    }

    return NextResponse.json({ alerts: [] });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { alertId, status } = await req.json();

    if (!alertId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from('food_cost_alerts')
      .update({ status })
      .eq('id', alertId)
      .eq('restaurant_id', auth.restaurantId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
