import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const clientId = process.env.META_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/meta/callback`;
    
    // Pass restaurantId through the state parameter to know which restaurant to link upon callback
    const state = auth.restaurantId;

    if (!clientId) {
      return NextResponse.json({ error: "META_CLIENT_ID non configuré" }, { status: 500 });
    }

    // Permissions we need for Instagram and Facebook pages
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish'
    ].join(',');

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Meta Auth Error]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
