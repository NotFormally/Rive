import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { sendEmail } from "@/lib/email";

function getStripe() {
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Simple in-memory rate limiter: max 2 attempts per user per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 2;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { confirmName, reason } = await req.json();

    if (!confirmName) {
      return NextResponse.json({ error: "Missing confirmation" }, { status: 400 });
    }

    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Rate limit per user
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many deletion attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Verify owner role
    const { data: membership } = await supabase
      .from("restaurant_members")
      .select("restaurant_id, role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Only the owner can delete the account" }, { status: 403 });
    }

    // Verify restaurant name matches confirmation
    const { data: profile } = await supabase
      .from("restaurant_profiles")
      .select("restaurant_name")
      .eq("id", membership.restaurant_id)
      .single();

    if (!profile || profile.restaurant_name !== confirmName) {
      return NextResponse.json({ error: "Restaurant name does not match" }, { status: 400 });
    }

    // 1. Cancel active Stripe subscription if any
    let stripeCancelled = false;
    const { data: settings } = await supabase
      .from("restaurant_settings")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("restaurant_id", membership.restaurant_id)
      .single();

    if (settings?.stripe_subscription_id) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(settings.stripe_subscription_id);
        stripeCancelled = true;
      } catch (stripeErr) {
        console.error("[account/delete] Stripe cancel error:", stripeErr);
        // Continue — don't block deletion if Stripe fails
      }
    }

    // 2. Collect team member emails before dissociation (for notifications)
    const { data: teamMembers } = await supabase
      .from("restaurant_members")
      .select("user_id")
      .eq("restaurant_id", membership.restaurant_id)
      .neq("role", "owner");

    const teamCount = teamMembers?.length ?? 0;

    // Fetch team member emails for notification
    const teamEmails: string[] = [];
    if (teamMembers && teamMembers.length > 0) {
      for (const member of teamMembers) {
        const { data: { user: memberUser } } = await supabase.auth.admin.getUserById(member.user_id);
        if (memberUser?.email) teamEmails.push(memberUser.email);
      }
    }

    // Dissociate team members
    const { error: dissociateError } = await supabase
      .from("restaurant_members")
      .delete()
      .eq("restaurant_id", membership.restaurant_id)
      .neq("role", "owner");

    if (dissociateError) {
      console.error("[account/delete] Failed to dissociate team:", dissociateError);
      return NextResponse.json(
        { error: "Failed to remove team members. Deletion aborted.", code: "team_dissociate_failed" },
        { status: 500 }
      );
    }

    // 3. Delete the restaurant profile — CASCADE will purge all child tables
    const { error: deleteError } = await supabase
      .from("restaurant_profiles")
      .delete()
      .eq("id", membership.restaurant_id);

    if (deleteError) {
      console.error("[account/delete] Failed to delete restaurant:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account data. Please contact support.", code: "cascade_failed" },
        { status: 500 }
      );
    }

    // 3b. GDPR/Law 25 audit log (hashed identifiers only)
    const { error: auditError } = await supabase.from("account_deletion_log").insert({
      restaurant_id: membership.restaurant_id,
      restaurant_name_hash: sha256(profile.restaurant_name),
      owner_email_hash: sha256(user.email!),
      team_members_dissociated: teamCount,
      stripe_subscription_cancelled: stripeCancelled || !!settings?.stripe_subscription_id,
      cascade_completed: true,
      deletion_reason: reason || null,
    });

    if (auditError) {
      console.error("[account/delete] Audit log insert failed:", auditError);
      // Non-blocking — deletion already succeeded
    }

    // 4. Delete the Supabase Auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error("[account/delete] Failed to delete auth user:", authDeleteError);
      // Data is already gone — log but don't fail
    }

    // 5. Send confirmation email to user
    sendEmail({
      type: "account_deleted",
      to: user.email!,
      restaurantName: profile.restaurant_name,
    }).catch((err) => console.error("[email] account_deleted failed:", err));

    // 6. Notify admin
    sendEmail({
      type: "admin_account_deleted",
      to: "dock@rivehub.com",
      restaurantName: profile.restaurant_name,
      email: user.email!,
    }).catch((err) => console.error("[email] admin_account_deleted failed:", err));

    // 7. Notify team members of access revocation
    for (const email of teamEmails) {
      sendEmail({
        type: "team_access_revoked",
        to: email,
        restaurantName: profile.restaurant_name,
      }).catch((err) => console.error("[email] team_access_revoked failed:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[account/delete] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
