import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { priceId, restaurantId, userId, successUrl, cancelUrl } = await req.json();

    let targetRestaurantId = restaurantId;

    if (!targetRestaurantId && userId) {
      const supabase = getServiceClient();
      
      // Check if they already have one we somehow missed
      const { data: existingProfiles } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existingProfiles && existingProfiles.length > 0) {
        targetRestaurantId = existingProfiles[0].id;
      } else {
        // Auto-provision a default workspace
        const slug = `espace-${Date.now().toString(36)}`;
        const { data: newProfile, error: profileErr } = await supabase
          .from('restaurant_profiles')
          .insert({
            user_id: userId,
            restaurant_name: "Nouvel Espace RiveHub",
            slug: slug
          })
          .select()
          .single();
          
        if (newProfile && !profileErr) {
          targetRestaurantId = newProfile.id;
          
          await supabase.from('restaurant_settings').insert({
             restaurant_id: newProfile.id,
             subscription_tier: 'free'
          });
          
          await supabase.from('restaurant_members').insert({
             restaurant_id: newProfile.id,
             user_id: userId,
             role: 'owner',
             accepted_at: new Date().toISOString()
          });
        }
      }
    }

    if (!priceId || !targetRestaurantId) {
      return NextResponse.json(
        { error: 'Missing priceId or restaurantId could not be provisioned' },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${origin}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/pricing`,
      metadata: {
        restaurantId: restaurantId,
      },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
