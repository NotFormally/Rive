import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!_admin) {
    _admin = createClient(url, key);
  }
  return _admin;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Only owner/admin can invite
    if (!['owner', 'admin'].includes(auth.role)) {
      return NextResponse.json({ error: 'Seuls les propriétaires et administrateurs peuvent inviter des membres.' }, { status: 403 });
    }

    const { email, role = 'editor', locale = 'fr' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
    }

    const validRoles = ['admin', 'editor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
    }

    // Prevent inviting with a higher role than the inviter
    if (role === 'admin' && auth.role !== 'owner') {
      return NextResponse.json({ error: 'Seul le propriétaire peut nommer un administrateur.' }, { status: 403 });
    }

    // Check if user already invited
    const { data: existingMember } = await auth.supabase
      .from('restaurant_members')
      .select('id, accepted_at')
      .eq('restaurant_id', auth.restaurantId)
      .eq('invited_email', email)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: 'Cette personne est déjà invitée ou membre.' }, { status: 409 });
    }

    // Check if the email is already a Supabase auth user (optional, needs admin client)
    const admin = getAdmin();
    let matchedUserId: string | null = null;

    if (admin) {
      const { data: existingUser } = await admin.auth.admin.listUsers();
      const matchedUser = existingUser?.users?.find(u => u.email === email);
      if (matchedUser) {
        // Check if already a member by user_id
        const { data: alreadyMember } = await auth.supabase
          .from('restaurant_members')
          .select('id')
          .eq('restaurant_id', auth.restaurantId)
          .eq('user_id', matchedUser.id)
          .maybeSingle();

        if (alreadyMember) {
          return NextResponse.json({ error: 'Cette personne est déjà membre.' }, { status: 409 });
        }
        matchedUserId = matchedUser.id;
      }
    }

    // Generate invite token
    const invite_token = crypto.randomUUID();

    // Insert pending membership using the user's own client
    // RLS policy allows owners/admins to insert into restaurant_members
    const { data: member, error } = await auth.supabase
      .from('restaurant_members')
      .insert({
        restaurant_id: auth.restaurantId,
        user_id: matchedUserId,
        role,
        invited_by: auth.user.id,
        invited_email: email,
        invite_token,
        accepted_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Invite insert error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'invitation.' }, { status: 500 });
    }

    // Build the accept URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/${locale}/invite?token=${invite_token}`;

    // Get restaurant name for the email
    const { data: profile } = await auth.supabase
      .from('restaurant_profiles')
      .select('restaurant_name')
      .eq('id', auth.restaurantId)
      .single();

    const restaurantName = profile?.restaurant_name || 'Rive';

    // Send email
    await sendEmail({
      type: 'team_invite',
      to: email,
      restaurantName,
      roleName: role === 'owner' ? 'Propriétaire' : role === 'admin' ? 'Administrateur' : 'Éditeur',
      inviteUrl: acceptUrl,
    });

    return NextResponse.json({
      success: true,
      member,
      acceptUrl,
      message: `Invitation envoyée à ${email}. Partagez ce lien : ${acceptUrl}`,
    });

  } catch (err) {
    console.error('Team invite error:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
