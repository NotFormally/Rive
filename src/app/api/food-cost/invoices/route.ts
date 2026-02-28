import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { data: invoices, error } = await auth.supabase
      .from('invoices')
      .select(`
        id, 
        supplier_name, 
        total_amount, 
        date, 
        top_items, 
        created_at,
        invoice_items(count)
      `)
      .eq('restaurant_id', auth.restaurantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    
    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
