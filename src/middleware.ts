import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PROTECTED_ROUTES = ["/dashboard", "/admin"];
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Get the Supabase auth token from cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Look for the Supabase auth cookie
  const allCookies = request.cookies.getAll();
  const authCookie = allCookies.find(
    (c) =>
      c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  let isAuthenticated = false;

  if (authCookie) {
    try {
      // Parse the cookie value (it's a JSON array with [access_token, refresh_token])
      const tokenData = JSON.parse(authCookie.value);
      const accessToken = Array.isArray(tokenData) ? tokenData[0] : tokenData;

      if (accessToken && typeof accessToken === "string") {
        // Verify the token by calling Supabase
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

  // Protected route without auth → redirect to login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth route while already authenticated → redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
