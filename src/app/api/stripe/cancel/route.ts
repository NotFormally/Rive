import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { reason, comments } = await req.json();

    if (!reason) {
      return NextResponse.json({ error: "Missing reason" }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseService = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the user's restaurant profile
    const { data: membership } = await supabaseService
      .from("restaurant_members")
      .select("restaurant_id, role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not authorized to cancel subscription" }, { status: 403 });
    }

    // Get the subscription details
    const { data: settings } = await supabaseService
      .from("restaurant_settings")
      .select("stripe_subscription_id")
      .eq("restaurant_id", membership.restaurant_id)
      .single();

    const { data: profile } = await supabaseService
      .from("restaurant_profiles")
      .select("restaurant_name")
      .eq("id", membership.restaurant_id)
      .single();

    if (settings?.stripe_subscription_id) {
      // Cancel at period end
      await stripe.subscriptions.update(settings.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      // Webhook will handle DB updates and user notification on deletion
    }

    // Notify dock@rivehub.com with the feedback
    sendEmail({
      type: 'churn_feedback',
      to: 'dock@rivehub.com',
      restaurantName: profile?.restaurant_name || 'Unknown Restaurant',
      email: user.email!,
      reason,
      comments: comments || '',
    }).catch(err => console.error('[email] churn feedback failed:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
