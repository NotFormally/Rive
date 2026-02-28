import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getRestaurantEmail(supabase: any, restaurantId: string): Promise<{ email: string; restaurantName: string } | null> {
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
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = getServiceClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const restaurantId = session.metadata?.restaurantId;

      if (restaurantId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;

        let tier = 'freemium';
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL) tier = 'essential';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PERFORMANCE) tier = 'performance';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_INTELLIGENCE) tier = 'intelligence';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTREPRISE) tier = 'enterprise';

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
          }
        }).catch(() => {});
      }
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any;
      const priceId = subscription.items.data[0]?.price.id;

      if (priceId) {
        let tier = 'freemium';
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL) tier = 'essential';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PERFORMANCE) tier = 'performance';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_INTELLIGENCE) tier = 'intelligence';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTREPRISE) tier = 'enterprise';

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
      const subscription = event.data.object as any;

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
          p_tier: 'freemium',
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
  } catch (err: any) {
    console.error("Erreur serveur Webhook:", err);
    return NextResponse.json({ error: 'Serveur Erreur' }, { status: 500 });
  }
}
