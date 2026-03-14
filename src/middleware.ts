import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateCsrfToken, validateCsrf, csrfCookieHeader, CSRF_COOKIE_NAME } from '@/lib/security/csrf';

// ---------------------------------------------------------------------------
// Inline locale config (avoids importing routing.ts which pulls next-intl
// plugin alias → request.ts → all 54 message JSON files into the Edge bundle)
// ---------------------------------------------------------------------------
const LOCALES = [
  'fr', 'en', 'es', 'it', 'de', 'pt', 'ru', 'pl', 'tr', 'da', 'sv', 'ro', 'el', 'hu', 'cs',
  'fa', 'ar', 'ar-AE', 'ar-LB', 'ar-EG', 'kab',
  'hi', 'ur', 'pa', 'ta', 'bn', 'zh-CN', 'zh-HK', 'nan', 'ja', 'ko',
  'id', 'ms', 'jv', 'th', 'vi', 'tl',
  'sw', 'am', 'yo', 'ha', 'zu', 'om',
  'en-AU', 'en-NZ',
  'br', 'cy', 'gd', 'ga',
  'eu', 'co',
  'nds', 'gsw', 'frk-mos', 'nl-BE',
  'nl', 'hsb', 'rom', 'ht',
] as const;

const DEFAULT_LOCALE = 'en';
const LOCALE_SET = new Set<string>(LOCALES);
const COOKIE_NAME = 'NEXT_LOCALE';
const HEADER_LOCALE = 'x-next-intl-locale';

const PROTECTED_ROUTES = ["/dashboard", "/admin"];
const AUTH_ROUTES = ["/login", "/signup"];

// ---------------------------------------------------------------------------
// API routes exempt from CSRF validation
// (webhooks use signature auth, cron uses secret tokens, auth callbacks are
//  OAuth flows, public endpoints have no session to hijack)
// ---------------------------------------------------------------------------
const CSRF_EXEMPT_PREFIXES = [
  '/api/stripe/webhook',     // Stripe signature verification
  '/api/webhooks/',          // External webhooks (reservations, etc.)
  '/api/cron/',              // Server-to-server cron jobs
  '/api/auth/',              // OAuth callbacks (Meta, TikTok)
  '/api/notify-signup',      // Public signup notification (pre-auth)
  '/api/verify-turnstile',   // Cloudflare Turnstile verification (pre-auth)
];

// ---------------------------------------------------------------------------
// Lightweight i18n routing (replaces next-intl/middleware to cut Edge bundle)
// ---------------------------------------------------------------------------

function detectLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split('/');
  const candidate = segments[1]; // first path segment after /
  if (candidate && LOCALE_SET.has(candidate)) return candidate;
  return null;
}

function detectLocaleFromHeaders(request: NextRequest): string {
  // 1. Cookie preference
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieLocale && LOCALE_SET.has(cookieLocale)) return cookieLocale;

  // 2. Accept-Language header
  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    const preferred = acceptLang
      .split(',')
      .map(part => {
        const [lang, q] = part.trim().split(';q=');
        return { lang: lang.trim(), q: q ? parseFloat(q) : 1 };
      })
      .sort((a, b) => b.q - a.q);

    for (const { lang } of preferred) {
      // Exact match (e.g. "zh-CN")
      if (LOCALE_SET.has(lang)) return lang;
      // Base language match (e.g. "fr-FR" → "fr")
      const base = lang.split('-')[0];
      if (LOCALE_SET.has(base)) return base;
    }
  }

  return DEFAULT_LOCALE;
}

function handleI18nRouting(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const pathLocale = detectLocaleFromPath(pathname);

  if (pathLocale) {
    // Path already has a valid locale prefix → rewrite with locale header
    const headers = new Headers(request.headers);
    headers.set(HEADER_LOCALE, pathLocale);
    // Set cookie for future visits
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set(COOKIE_NAME, pathLocale, { path: '/', sameSite: 'lax' });
    return response;
  }

  // No locale in path → detect and redirect
  const locale = detectLocaleFromHeaders(request);

  // Default locale uses as-needed prefix (no redirect for default)
  if (locale === DEFAULT_LOCALE) {
    const headers = new Headers(request.headers);
    headers.set(HEADER_LOCALE, locale);
    // Rewrite to /{defaultLocale}/... internally
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    const response = NextResponse.rewrite(url, { request: { headers } });
    response.cookies.set(COOKIE_NAME, locale, { path: '/', sameSite: 'lax' });
    return response;
  }

  // Non-default locale → redirect to prefixed path
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(COOKIE_NAME, locale, { path: '/', sameSite: 'lax' });
  return response;
}

// ---------------------------------------------------------------------------
// CSRF validation for API routes
// ---------------------------------------------------------------------------

function handleApiCsrf(request: NextRequest): NextResponse | Response {
  const pathname = request.nextUrl.pathname;

  // Skip exempt routes (webhooks, cron, auth callbacks, public endpoints)
  if (CSRF_EXEMPT_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Only validate CSRF for mutating methods
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Validate CSRF (returns null if valid, Response if blocked)
  const csrfBlocked = validateCsrf(request);
  if (csrfBlocked) return csrfBlocked;

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Main middleware
// ---------------------------------------------------------------------------

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── API routes: CSRF validation only (no i18n) ──
  if (pathname.startsWith('/api/')) {
    return handleApiCsrf(request);
  }

  // ── Page routes: i18n + auth + CSRF cookie ──
  const response = handleI18nRouting(request);

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.includes(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.includes(route));

  // ── Set CSRF cookie on ALL page visits (not just protected routes) ──
  if (!request.cookies.get(CSRF_COOKIE_NAME)) {
    const token = generateCsrfToken();
    response.headers.append('Set-Cookie', csrfCookieHeader(token));
  }

  if (!isProtected && !isAuthRoute) {
    return response;
  }

  // Create a Supabase client that reads/writes cookies via the request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Race getUser() against a 5-second timeout
  let isAuthenticated = false;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    isAuthenticated = !!(result && 'data' in result && result.data?.user);
  } catch {
    isAuthenticated = false;
  }

  // Get the applied locale
  const activeLocale = response.headers.get(HEADER_LOCALE)
    || response.headers.get('x-middleware-request-x-next-intl-locale')
    || DEFAULT_LOCALE;

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(`/${activeLocale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${activeLocale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  // Include both page routes and API routes (API needs CSRF validation)
  matcher: ['/((?!_next|_vercel|.*\\..*).*)',]
};
