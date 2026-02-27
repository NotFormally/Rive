import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type MemberRole = 'owner' | 'admin' | 'editor';

type AuthResult =
  | { user: { id: string }; restaurantId: string; role: MemberRole; supabase: SupabaseClient }
  | null;

/**
 * Extract and verify the Supabase auth token from an API request.
 * Returns user, restaurantId, role, and the authenticated supabase client, or null if not authenticated.
 */
export async function requireAuth(req: Request): Promise<AuthResult> {
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

    // Try exact match first (legacy single cookie)
    let authCookieKey = Object.keys(cookies).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );

    if (authCookieKey) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookies[authCookieKey]));
        accessToken = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch {
        // fall through to chunked approach
      }
    }

    // Handle chunked cookies (sb-xxx-auth-token.0, .1, .2, ...)
    if (!accessToken) {
      const chunkedKeys = Object.keys(cookies)
        .filter(k => k.startsWith('sb-') && /\-auth-token\.\d+$/.test(k))
        .sort((a, b) => {
          const numA = parseInt(a.split('.').pop() || '0');
          const numB = parseInt(b.split('.').pop() || '0');
          return numA - numB;
        });

      if (chunkedKeys.length > 0) {
        try {
          const combined = chunkedKeys.map(k => cookies[k]).join('');
          const parsed = JSON.parse(decodeURIComponent(combined));
          accessToken = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch (e) {
          console.error('[requireAuth] Failed to parse chunked cookies:', e);
        }
      }
    }
  }

  if (!accessToken) {
    console.warn('[requireAuth] No access token found in request');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.warn('[requireAuth] getUser failed:', error?.message);
    return null;
  }

  const { data: membership, error: memberErr } = await supabase
    .from('restaurant_members')
    .select('restaurant_id, role')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .limit(1)
    .single();

  if (!membership) {
    console.warn('[requireAuth] No membership found for user:', user.id, memberErr?.message);
    return null;
  }

  console.log('[requireAuth] Authenticated:', user.id, 'role:', membership.role);
  return { user: { id: user.id }, restaurantId: membership.restaurant_id, role: membership.role as MemberRole, supabase };
}

/**
 * Standard 401 response for unauthenticated requests.
 */
export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Non autorisé' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
