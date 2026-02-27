import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient | null {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    _admin = createClient(url, key);
  }
  return _admin;
}

// GET — List all team members for the restaurant
export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Use auth.supabase (user's own client) — RLS allows team members to view their restaurant's members
    const { data: members, error } = await auth.supabase
      .from('restaurant_members')
      .select('id, user_id, role, invited_email, invited_at, accepted_at')
      .eq('restaurant_id', auth.restaurantId)
      .order('accepted_at', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('List members error:', error);
      return NextResponse.json({ error: 'Erreur lors du chargement.' }, { status: 500 });
    }

    // Enrich with user emails for accepted members (only if admin client is available)
    const admin = getAdmin();
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        let email = member.invited_email;
        if (member.user_id && !email && admin) {
          try {
            const { data } = await admin.auth.admin.getUserById(member.user_id);
            email = data?.user?.email || null;
          } catch {
            // admin client not available, skip email enrichment
          }
        }
        return { ...member, email };
      })
    );

    return NextResponse.json({ members: enrichedMembers });

  } catch (err) {
    console.error('Team list error:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

// DELETE — Remove a team member
export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    if (!['owner', 'admin'].includes(auth.role)) {
      return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
    }

    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: 'ID du membre requis.' }, { status: 400 });
    }

    // Verify the member belongs to the same restaurant
    const { data: member } = await auth.supabase
      .from('restaurant_members')
      .select('id, role, user_id, restaurant_id')
      .eq('id', memberId)
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Membre non trouvé.' }, { status: 404 });
    }

    // Can't remove yourself
    if (member.user_id === auth.user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous retirer vous-même.' }, { status: 400 });
    }

    // Only owners can remove admins
    if (member.role === 'admin' && auth.role !== 'owner') {
      return NextResponse.json({ error: 'Seul le propriétaire peut retirer un administrateur.' }, { status: 403 });
    }

    // Can't remove owners
    if (member.role === 'owner') {
      return NextResponse.json({ error: 'Le propriétaire ne peut pas être retiré.' }, { status: 403 });
    }

    const { error } = await auth.supabase
      .from('restaurant_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Delete member error:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Team delete error:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

// PATCH — Change a member's role
export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    if (auth.role !== 'owner') {
      return NextResponse.json({ error: 'Seul le propriétaire peut modifier les rôles.' }, { status: 403 });
    }

    const { memberId, newRole } = await req.json();

    if (!memberId || !newRole) {
      return NextResponse.json({ error: 'ID du membre et nouveau rôle requis.' }, { status: 400 });
    }

    const validRoles = ['admin', 'editor'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
    }

    // Verify the member belongs to the same restaurant
    const { data: member } = await auth.supabase
      .from('restaurant_members')
      .select('id, role, user_id, restaurant_id')
      .eq('id', memberId)
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Membre non trouvé.' }, { status: 404 });
    }

    // Can't change own role
    if (member.user_id === auth.user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas modifier votre propre rôle.' }, { status: 400 });
    }

    // Can't change owner role
    if (member.role === 'owner') {
      return NextResponse.json({ error: 'Le rôle propriétaire ne peut pas être modifié.' }, { status: 403 });
    }

    const { error } = await auth.supabase
      .from('restaurant_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      console.error('Update role error:', error);
      return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, newRole });

  } catch (err) {
    console.error('Team role update error:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
