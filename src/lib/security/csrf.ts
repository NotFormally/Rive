/**
 * csrf.ts — CSRF Protection via Double Submit Cookie Pattern
 *
 * How it works:
 * 1. A CSRF token is generated and stored in a cookie (readable by JS)
 * 2. The frontend reads the cookie and sends the token in a custom header
 * 3. The API route verifies the header matches the cookie
 *
 * An attacker on evil.com can trigger a cross-origin request with the
 * victim's cookies, but CANNOT read the cookie value to set the header.
 *
 * Additionally, we verify the Origin/Referer header matches our domain.
 */

// No Node.js crypto import — use Web Crypto API for Edge runtime compatibility

const CSRF_COOKIE_NAME = 'rive-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32; // 256 bits of entropy

// Allowed origins — add your production domain(s)
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'https://rivehub.com',
  'https://www.rivehub.com',
  'https://rive-app.vercel.app',
]);

// Match any Vercel preview deployment
const VERCEL_PREVIEW_REGEX = /^https:\/\/rive-[a-z0-9-]+\.vercel\.app$/;

/**
 * Generate a new CSRF token.
 * Uses Web Crypto API (works in Edge runtime + Node.js).
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract the CSRF token from request cookies.
 */
function getCsrfCookie(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').filter(Boolean).map(c => {
      const [key, ...rest] = c.split('=');
      return [key, rest.join('=')];
    })
  );
  return cookies[CSRF_COOKIE_NAME] || null;
}

/**
 * Extract the CSRF token from request header.
 */
function getCsrfHeader(req: Request): string | null {
  return req.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validate the Origin/Referer header against allowed origins.
 */
function validateOrigin(req: Request): { valid: boolean; origin: string | null } {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  // Origin header is most reliable
  if (origin) {
    if (ALLOWED_ORIGINS.has(origin) || VERCEL_PREVIEW_REGEX.test(origin)) {
      return { valid: true, origin };
    }
    return { valid: false, origin };
  }

  // Fall back to Referer
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (ALLOWED_ORIGINS.has(refererOrigin) || VERCEL_PREVIEW_REGEX.test(refererOrigin)) {
        return { valid: true, origin: refererOrigin };
      }
      return { valid: false, origin: refererOrigin };
    } catch {
      return { valid: false, origin: referer };
    }
  }

  // No Origin or Referer — could be same-origin (browser omits for same-origin)
  // or could be a non-browser client. Allow but log.
  return { valid: true, origin: null };
}

/**
 * Validate CSRF for a mutating request (POST, PUT, PATCH, DELETE).
 *
 * Returns null if valid, or a Response if blocked.
 *
 * @example
 * ```ts
 * export async function POST(req: Request) {
 *   const csrfError = validateCsrf(req);
 *   if (csrfError) return csrfError;
 *   // ... proceed
 * }
 * ```
 */
export function validateCsrf(req: Request): Response | null {
  // Skip CSRF for non-mutating methods
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  // Step 1: Validate Origin/Referer
  const { valid: originValid, origin } = validateOrigin(req);
  if (!originValid) {
    console.warn(`[csrf] Origin rejected: ${origin}`);
    return new Response(
      JSON.stringify({
        error: 'Requête bloquée : origine non autorisée.',
        code: 'CSRF_ORIGIN_REJECTED',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Step 2: Double Submit Cookie validation
  const cookieToken = getCsrfCookie(req);
  const headerToken = getCsrfHeader(req);

  // If no cookie exists yet, skip CSRF (first visit — cookie will be set by middleware)
  // This prevents breaking existing sessions. The middleware sets the cookie on page load.
  if (!cookieToken) {
    return null;
  }

  // Cookie exists but header missing or doesn't match
  if (!headerToken || headerToken !== cookieToken) {
    console.warn(`[csrf] Token mismatch — cookie: ${cookieToken?.substring(0, 8)}..., header: ${headerToken?.substring(0, 8) || 'MISSING'}...`);
    return new Response(
      JSON.stringify({
        error: 'Requête bloquée : jeton CSRF invalide. Rechargez la page.',
        code: 'CSRF_TOKEN_MISMATCH',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}

/**
 * Create a Set-Cookie header value for the CSRF token.
 * Called by middleware to set the cookie on page loads.
 */
export function csrfCookieHeader(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [
    `${CSRF_COOKIE_NAME}=${token}`,
    'Path=/',
    'SameSite=Strict',
    'Max-Age=86400', // 24 hours
  ];
  if (isProduction) {
    parts.push('Secure');
  }
  // Explicitly NOT HttpOnly — JS needs to read it to send in header
  return parts.join('; ');
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
