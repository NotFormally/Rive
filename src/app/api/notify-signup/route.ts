import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from '@/lib/email';

const ADMIN_EMAIL = "dock@rivehub.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurant_name, email, locale } = body;

    if (!restaurant_name || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Use service role if available, otherwise anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log signup notification in the database
    await supabase.from("signup_notifications").insert({
      restaurant_name,
      email,
      locale: locale || "fr",
      notified: false,
    });

    // Log to server console for immediate visibility in Vercel logs
    console.log(
      `🆕 NEW SIGNUP | ${restaurant_name} | ${email} | locale: ${locale || "fr"} | ${new Date().toISOString()}`
    );

    // Send welcome email (fire and forget — never blocks signup)
    sendEmail({
      type: 'welcome',
      to: email,
      restaurantName: restaurant_name,
    }).catch((err) => console.error('[email] welcome email failed:', err));

    sendEmail({
      type: 'admin_signup_notification',
      to: ADMIN_EMAIL,
      restaurantName: restaurant_name,
      email: email,
      locale: locale || "fr",
    }).catch((err) => console.error('[email] admin signup notification failed:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify signup error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
