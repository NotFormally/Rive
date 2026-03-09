import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from '@/lib/email';
import { validateRestaurantName } from '@/lib/validation';

const ADMIN_EMAIL = "dock@rivehub.com";

// In-memory IP rate limiting for signup (resets on cold start, which is fine for Vercel)
const signupAttempts = new Map<string, { count: number; firstAttempt: number }>();
const SIGNUP_RATE_WINDOW_MS = 3600_000; // 1 hour
const SIGNUP_RATE_MAX = 5; // max 5 signups per IP per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = signupAttempts.get(ip);

  if (!entry || now - entry.firstAttempt > SIGNUP_RATE_WINDOW_MS) {
    signupAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }

  entry.count++;
  return entry.count > SIGNUP_RATE_MAX;
}

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip)) {
      console.warn(`[signup] Rate limited IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const body = await request.json();
    const { restaurant_name, email, locale, country } = body;

    if (!restaurant_name || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Server-side validation — reject gibberish names even if client-side was bypassed
    const nameError = validateRestaurantName(restaurant_name);
    if (nameError) {
      console.warn(`[signup] Rejected gibberish name: "${restaurant_name}" from IP: ${ip}`);
      return NextResponse.json({ error: "Invalid restaurant name" }, { status: 400 });
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
      country: country || null,
      notified: false,
    });

    // Log to server console for immediate visibility in Vercel logs
    console.log(
      `🆕 NEW SIGNUP | ${restaurant_name} | ${email} | locale: ${locale || "fr"} | country: ${country || "—"} | ${new Date().toISOString()}`
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
