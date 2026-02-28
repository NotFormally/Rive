import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/tiktok/callback`;
    const state = auth.restaurantId;

    if (!clientKey) {
      return NextResponse.json({ error: "TIKTOK_CLIENT_KEY non configuré" }, { status: 500 });
    }

    // Permissions we need for TikTok
    const scopes = 'user.info.basic,video.publish,video.upload';

    // Anti-CSRF token
    const csrfState = Math.random().toString(36).substring(2);

    // TikTok requires both state and stringified state if we want to pass custom data, but we can just use state
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[TikTok Auth Error]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
