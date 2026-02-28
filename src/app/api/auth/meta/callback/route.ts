import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the restaurantId passed in /api/auth/meta
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (error) {
    console.error("Meta OAuth Error:", error, errorDescription);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=meta_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=invalid_request`);
  }

  const clientId = process.env.META_CLIENT_ID;
  const clientSecret = process.env.META_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/meta/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=meta_not_configured`);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`);
    
    if (!tokenResponse.ok) {
      const errData = await tokenResponse.json();
      console.error("Token Exchange Failed:", errData);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=meta_token_failed`);
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;

    // 2. Exchange short-lived token for long-lived token (usually 60 days)
    const longTokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`);
    let accessToken = shortLivedToken;
    let expiresAt = null;

    if (longTokenResponse.ok) {
      const longTokenData = await longTokenResponse.json();
      accessToken = longTokenData.access_token;
      if (longTokenData.expires_in) {
        expiresAt = new Date(Date.now() + longTokenData.expires_in * 1000).toISOString();
      }
    }

    // 3. Fetch user's pages to find the connected page
    // For simplicity of this MVP, we fetch the first page or let the user select later.
    // Here we just grab the user ID and name.
    const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
    const userData = await userResponse.json();

    if (!userData.id) {
       return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=meta_user_data_failed`);
    }

    // 4. Save to database
    // Note: in a real robust setup, you would fetch /me/accounts, get page access tokens, and store those.
    // For now, we store the user access token and ID as a 'meta' platform connection.
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        restaurant_id: state,
        platform: 'meta',
        account_id: userData.id,
        account_name: userData.name || 'Compte Meta',
        access_token: accessToken,
        expires_at: expiresAt
      }, { onConflict: 'restaurant_id,platform,account_id' });

    if (dbError) {
      console.error("DB Save Error:", dbError);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=meta_db_failed`);
    }

    // Success
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_success=meta_connected`);

  } catch (err) {
    console.error("Unexpected Meta Callback Error:", err);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=unexpected`);
  }
}
