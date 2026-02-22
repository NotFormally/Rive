import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role to bypass RLS for rate-limit checks
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 30;

type RateLimitResult = { allowed: boolean; remaining: number };

/**
 * Check rate limit and log the usage if allowed.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for atomic check+insert.
 */
export async function checkRateLimit(
  restaurantId: string,
  route: string
): Promise<RateLimitResult> {
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000
  ).toISOString();

  // Count recent requests
  const { count, error } = await supabaseAdmin
    .from('ai_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('route', route)
    .gte('created_at', windowStart);

  if (error) {
    // On error, allow the request but don't log (fail open)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
  }

  const currentCount = count || 0;

  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  // Log this usage
  await supabaseAdmin.from('ai_usage_log').insert({
    restaurant_id: restaurantId,
    route,
  });

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - currentCount - 1 };
}

/**
 * Standard 429 response.
 */
export function tooManyRequests() {
  return new Response(
    JSON.stringify({ error: 'Trop de requêtes. Réessayez dans une minute.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );
}
