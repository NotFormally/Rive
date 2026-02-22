import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ce secret n'existe pas encore dans les variables d'environnement.
// On va le créer grace à la commande Stripe CLI.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

    // Gestion de l'événement complété (premier paiement) ou 'invoice.payment_succeeded' (paiement récurrent)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const restaurantId = session.metadata?.restaurantId;

      if (restaurantId && session.subscription) {
        // Retrieve subscription for product price tier
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;

        let tier = 'trial';
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL) tier = 'essential';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PERFORMANCE) tier = 'performance';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTREPRISE) tier = 'enterprise';

        // Update database using SECURITY DEFINER function to bypass RLS securely
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
      }
    } 
    // Gèle l'accès / Repasse en essai "expiré" si l'abonnement est supprimé/annulé
    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      
      // On retrouve l'utilisateur via le stripe_customer_id
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
          p_tier: 'trial', // Retourne en "trial", et comme date trial dépassée: freemium actif.
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Erreur serveur Webhook:", err);
    return NextResponse.json({ error: 'Serveur Erreur' }, { status: 500 });
  }
}
