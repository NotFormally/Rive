import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_ROUTES = ["/dashboard", "/admin"];
const AUTH_ROUTES = ["/login", "/signup"];

export default async function middleware(request: NextRequest) {
  // First, apply i18n routing to handle locales
  const response = handleI18nRouting(request);

  const pathname = request.nextUrl.pathname;

  // Check if route needs protection (ignoring the locale prefix)
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.includes(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.includes(route));

  // Get the Supabase auth token from cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const allCookies = request.cookies.getAll();
  const authCookie = allCookies.find(
    (c) =>
      c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  let isAuthenticated = false;

  if (authCookie) {
    try {
      const tokenData = JSON.parse(authCookie.value);
      const accessToken = Array.isArray(tokenData) ? tokenData[0] : tokenData;

      if (accessToken && typeof accessToken === "string") {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        });
        const {
          data: { user },
        } = await supabase.auth.getUser();
        isAuthenticated = !!user;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // Get the applied locale
  const activeLocale = response.headers.get('x-middleware-request-x-next-intl-locale') || routing.defaultLocale;

  // Protected route without auth → redirect to login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(`/${activeLocale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth route while already authenticated → redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${activeLocale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  // Skip all paths that should not be internationalized.
  // This matches all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico, sitemap.xml, robots.txt (metadata files)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
