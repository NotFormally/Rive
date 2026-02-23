import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

  // Only check auth for protected or auth routes
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

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

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
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
