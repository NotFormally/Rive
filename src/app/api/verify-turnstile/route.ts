// =============================================================================
// Cloudflare Turnstile Server-Side Verification
//
// SETUP GUIDE:
//   1. Go to https://dash.cloudflare.com → Turnstile (left sidebar)
//   2. Click "Add Site"
//   3. Enter your domain (e.g., rivehub.com) and select widget type:
//      - "Managed" (recommended): Cloudflare decides challenge type
//      - "Non-Interactive": invisible to users, purely passive
//      - "Invisible": no visible widget, challenge only when suspicious
//   4. Copy the Site Key → set as NEXT_PUBLIC_TURNSTILE_SITE_KEY in .env.local
//   5. Copy the Secret Key → set as TURNSTILE_SECRET_KEY in .env.local
//
// TEST KEYS (for development — always pass):
//   Site Key:   1x00000000000000000000AA
//   Secret Key: 1x0000000000000000000000000000000AA
//
// PROTECTED PAGES: /signup, /login, /invite
// =============================================================================

import { NextResponse } from "next/server";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    if (!TURNSTILE_SECRET) {
      // Fail open in dev if secret not configured
      console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification");
      return NextResponse.json({ success: true });
    }

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      console.warn("[turnstile] Verification failed:", data["error-codes"]);
      return NextResponse.json({ success: false, error: "Verification failed" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[turnstile] Error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
