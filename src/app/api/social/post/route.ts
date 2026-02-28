import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const { platform, text, imageUrl, connectionId } = await req.json();

    if (!platform || !text) {
      return NextResponse.json({ error: "Plateforme et texte requis" }, { status: 400 });
    }

    // 1. Get the connection from DB to get the access token
    const { data: connection, error: dbError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (dbError || !connection) {
      return NextResponse.json({ error: "Connexion introuvable ou non autorisée" }, { status: 404 });
    }

    const accessToken = connection.access_token;

    // 2. Route to the right API
    if (platform === 'meta') {
      // POST to Instagram Graph API
      // Since this is an MVP without a live Meta App approved for publishing, 
      // we mock the success or structural call. 
      // A real call involves 2 steps: 
      // a) Create media container: POST /{ig-user-id}/media?image_url={url}&caption={text}
      // b) Publish container: POST /{ig-user-id}/media_publish?creation_id={id}
      
      console.log(`[Meta API Mock] Publishing to Meta with token ${accessToken.substring(0, 10)}... Caption: ${text}`);
      
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1500));
      
      return NextResponse.json({ success: true, platform: 'meta' });
      
    } else if (platform === 'tiktok') {
      // POST to TikTok API
      // Real call: POST https://open.tiktokapis.com/v2/post/publish/video/init/
      console.log(`[TikTok API Mock] Publishing to TikTok with token ${accessToken.substring(0, 10)}... Caption: ${text}`);
      
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1500));
      
      return NextResponse.json({ success: true, platform: 'tiktok' });
      
    } else {
      return NextResponse.json({ error: "Plateforme non reconnue" }, { status: 400 });
    }

  } catch (error) {
    console.error("[Social Post Error]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
