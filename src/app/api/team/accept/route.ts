import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _admin: SupabaseClient | null = null;
function getAdmin() {
  if (!_admin) {
    _admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _admin;
}

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token manquant.' }, { status: 400 });
    }

    // Find the pending invitation
    const { data: invite, error: findError } = await getAdmin()
      .from('restaurant_members')
      .select('*')
      .eq('invite_token', token)
      .is('accepted_at', null)
      .single();

    if (findError || !invite) {
      return NextResponse.json({ error: 'Invitation invalide ou déjà acceptée.' }, { status: 404 });
    }

    // Get the authenticated user
    const authHeader = req.headers.get('authorization');
    let accessToken: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.slice(7);
    } else {
      const cookieHeader = req.headers.get('cookie') || '';
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').filter(Boolean).map(c => {
          const [key, ...rest] = c.split('=');
          return [key, rest.join('=')];
        })
      );
      const authCookieKey = Object.keys(cookies).find(
        k => k.startsWith('sb-') && k.endsWith('-auth-token')
      );
      if (authCookieKey) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookies[authCookieKey]));
          accessToken = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
          return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });
        }
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });
    }

    // Verify email matches the invitation (if invited_email was set)
    if (invite.invited_email && user.email !== invite.invited_email) {
      return NextResponse.json({
        error: `Cette invitation est destinée à ${invite.invited_email}. Connectez-vous avec ce compte.`,
      }, { status: 403 });
    }

    // Check if user is already a member of this restaurant
    const { data: existingMember } = await getAdmin()
      .from('restaurant_members')
      .select('id')
      .eq('restaurant_id', invite.restaurant_id)
      .eq('user_id', user.id)
      .not('id', 'eq', invite.id)
      .maybeSingle();

    if (existingMember) {
      // Clean up the pending invite and return success
      await getAdmin()
        .from('restaurant_members')
        .delete()
        .eq('id', invite.id);

      return NextResponse.json({ success: true, message: 'Vous êtes déjà membre de ce restaurant.' });
    }

    // Accept the invitation
    const { error: updateError } = await getAdmin()
      .from('restaurant_members')
      .update({
        user_id: user.id,
        accepted_at: new Date().toISOString(),
        invite_token: null, // Clear token after use
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('Accept error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de l\'acceptation.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      restaurantId: invite.restaurant_id,
      role: invite.role,
      message: 'Invitation acceptée ! Vous avez maintenant accès au restaurant.',
    });

  } catch (err) {
    console.error('Accept invite error:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
