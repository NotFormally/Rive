import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

const ADMIN_EMAIL = 'dock@rivehub.com';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { chat_log, error_details } = await req.json();

    if (!chat_log || !Array.isArray(chat_log)) {
      return NextResponse.json({ error: 'Missing chat_log' }, { status: 400 });
    }

    // Get restaurant name for the email
    const { data: profile } = await auth.supabase
      .from('restaurant_profiles')
      .select('restaurant_name')
      .eq('id', auth.restaurantId)
      .maybeSingle();

    // Get user email
    const { data: { user } } = await auth.supabase.auth.getUser();
    const userEmail = user?.email || 'unknown';

    // Save to database
    const { error: insertError } = await auth.supabase
      .from('support_reports')
      .insert({
        restaurant_id: auth.restaurantId,
        user_email: userEmail,
        chat_log,
        error_details: error_details || null,
      });

    if (insertError) {
      console.error('[support-report] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }

    // Send email notification (fire and forget)
    sendEmail({
      type: 'support_report',
      to: ADMIN_EMAIL,
      restaurantName: profile?.restaurant_name || 'Unknown',
      email: userEmail,
      errorDetails: error_details || '',
      messageCount: chat_log.length,
    }).catch((err) => console.error('[email] support report notification failed:', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[support-report] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
