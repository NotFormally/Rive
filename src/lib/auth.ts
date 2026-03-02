import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type MemberRole = 'owner' | 'admin' | 'editor';

type AuthResult =
  | { user: { id: string }; restaurantId: string; role: MemberRole; supabase: SupabaseClient }
  | null;

/**
 * Decode a Supabase cookie value, handling both legacy JSON and new base64- format.
 */
function decodeSupabaseCookie(raw: string): unknown {
  let value = decodeURIComponent(raw);
  // @supabase/ssr >= 0.5 encodes cookies with a "base64-" prefix
  if (value.startsWith('base64-')) {
    value = Buffer.from(value.slice(7), 'base64').toString();
  }
  return JSON.parse(value);
}

/**
 * Extract the access_token from a parsed Supabase session cookie.
 */
function extractAccessToken(parsed: unknown): string | null {
  if (!parsed) return null;
  // New format: { access_token, refresh_token, ... }
  if (typeof parsed === 'object' && !Array.isArray(parsed) && (parsed as Record<string, unknown>).access_token) {
    return (parsed as Record<string, string>).access_token;
  }
  // Legacy format: ["access_token", "refresh_token"]
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed[0];
  }
  // Direct token string
  if (typeof parsed === 'string') return parsed;
  return null;
}

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

    // Try exact match first (single cookie — supports both legacy JSON and base64- format)
    const authCookieKey = Object.keys(cookies).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );

    if (authCookieKey) {
      try {
        const parsed = decodeSupabaseCookie(cookies[authCookieKey]);
        accessToken = extractAccessToken(parsed);
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
          const parsed = decodeSupabaseCookie(combined);
          accessToken = extractAccessToken(parsed);
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
