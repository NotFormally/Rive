import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the restaurantId passed
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (error) {
    console.error("TikTok OAuth Error:", error);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=tiktok_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=invalid_request`);
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/tiktok/callback`;

  if (!clientKey || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=tiktok_not_configured`);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });
    
    if (!tokenResponse.ok) {
      const errData = await tokenResponse.json();
      console.error("TikTok Token Exchange Failed:", errData);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=tiktok_token_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const openId = tokenData.open_id;
    let expiresAt = null;

    if (tokenData.expires_in) {
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    }

    // 2. Fetch basic user info
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    let accountName = 'Compte TikTok';
    if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.data && userData.data.user) {
            accountName = userData.data.user.display_name;
        }
    }

    // 3. Save to database
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        restaurant_id: state,
        platform: 'tiktok',
        account_id: openId,
        account_name: accountName,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt
      }, { onConflict: 'restaurant_id,platform,account_id' });

    if (dbError) {
      console.error("DB Save Error:", dbError);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=tiktok_db_failed`);
    }

    // Success
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_success=tiktok_connected`);

  } catch (err) {
    console.error("Unexpected TikTok Callback Error:", err);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?social_error=unexpected`);
  }
}
