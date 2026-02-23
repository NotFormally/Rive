import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "nassim.saighi@gmail.com";

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify signup error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
