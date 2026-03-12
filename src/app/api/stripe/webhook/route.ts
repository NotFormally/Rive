import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const PRICE_TO_TIER: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL!]: 'essence',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PERFORMANCE!]: 'performance',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTREPRISE!]: 'intelligence',
};

function resolveTierFromPriceId(priceId: string): string | null {
  return PRICE_TO_TIER[priceId] ?? null;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getRestaurantEmail(supabase: SupabaseClient, restaurantId: string): Promise<{ email: string; restaurantName: string } | null> {
  const { data } = await supabase
    .from('restaurant_profiles')
    .select('user_id, restaurant_name')
    .eq('id', restaurantId)
    .single();

  const profile = data as { user_id: string; restaurant_name: string } | null;
  if (!profile) return null;

  const { data: { user } } = await supabase.auth.admin.getUserById(profile.user_id);
  if (!user?.email) return null;

  return { email: user.email, restaurantName: profile.restaurant_name };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig || !webhookSecret) {
      console.warn("Signature manquante ou Webhook Secret non défini.");
      return NextResponse.json({ error: 'Webhook Secret Error' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    const supabase = getServiceClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const restaurantId = session.metadata?.restaurantId;

      if (restaurantId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;

        const tier = resolveTierFromPriceId(priceId);
        if (!tier) {
          console.error(`[webhook] Unknown Stripe price ID: ${priceId}. Aborting tier update to prevent accidental downgrade.`);
          return NextResponse.json({ error: 'Unknown price ID' }, { status: 400 });
        }

        const { error } = await supabase.rpc('update_subscription_from_stripe', {
          p_restaurant_id: restaurantId,
          p_stripe_customer_id: session.customer as string,
          p_stripe_subscription_id: session.subscription as string,
          p_tier: tier,
        });

        if (error) {
          console.error("Database update error:", error);
          throw new Error("Unable to update subscription in database");
        }

        // Send payment confirmation email (fire and forget)
        getRestaurantEmail(supabase, restaurantId).then((info) => {
          if (info) {
            sendEmail({
              type: 'payment_confirmation',
              to: info.email,
              restaurantName: info.restaurantName,
              tier,
            }).catch((err) => console.error('[email] payment confirmation failed:', err));

            sendEmail({
              type: 'admin_subscription_notification',
              to: 'dock@rivehub.com',
              restaurantName: info.restaurantName,
              email: info.email,
              tier,
            }).catch((err) => console.error('[email] admin subscription notification failed:', err));
          }
        }).catch(() => {});
      }
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;

      if (priceId) {
        const tier = resolveTierFromPriceId(priceId);
        if (!tier) {
          console.error(`[webhook] subscription.updated: Unknown price ID: ${priceId}. Skipping update.`);
          return NextResponse.json({ received: true });
        }

        const { data: settingsData } = await supabase
          .from('restaurant_settings')
          .select('restaurant_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (settingsData) {
          const { error } = await supabase.rpc('update_subscription_from_stripe', {
            p_restaurant_id: settingsData.restaurant_id,
            p_stripe_customer_id: subscription.customer,
            p_stripe_subscription_id: subscription.id,
            p_tier: tier,
          });

          if (error) {
            console.error('[webhook] subscription.updated DB error:', error);
          }
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      const { data: settingsData } = await supabase
        .from('restaurant_settings')
        .select('restaurant_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (settingsData) {
        await supabase.rpc('update_subscription_from_stripe', {
          p_restaurant_id: settingsData.restaurant_id,
          p_stripe_customer_id: subscription.customer,
          p_stripe_subscription_id: null,
          p_tier: 'free',
        });

        // Send cancellation email (fire and forget)
        getRestaurantEmail(supabase, settingsData.restaurant_id).then((info) => {
          if (info) {
            sendEmail({
              type: 'subscription_cancelled',
              to: info.email,
              restaurantName: info.restaurantName,
            }).catch((err) => console.error('[email] cancellation email failed:', err));
          }
        }).catch(() => {});
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erreur serveur Webhook:", err);
    return NextResponse.json({ error: 'Serveur Erreur' }, { status: 500 });
  }
}
