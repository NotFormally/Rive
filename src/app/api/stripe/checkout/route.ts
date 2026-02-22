import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { priceId, restaurantId, successUrl, cancelUrl } = await req.json();

    if (!priceId || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing priceId or restaurantId' },
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
      success_url: successUrl || `${origin}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
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
