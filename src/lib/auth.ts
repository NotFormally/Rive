import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type AuthResult =
  | { user: { id: string }; restaurantId: string; supabase: SupabaseClient }
  | null;

/**
 * Extract and verify the Supabase auth token from an API request.
 * Returns user, restaurantId, and the authenticated supabase client, or null if not authenticated.
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
    const authCookieKey = Object.keys(cookies).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (authCookieKey) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookies[authCookieKey]));
        accessToken = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch {
        return null;
      }
    }
  }

  if (!accessToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('restaurant_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return null;

  return { user: { id: user.id }, restaurantId: profile.id, supabase };
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
