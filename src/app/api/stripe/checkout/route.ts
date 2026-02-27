import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { priceId, restaurantId, successUrl, cancelUrl } = await req.json();

    if (!priceId || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing lookup key (priceId) or restaurantId' },
        { status: 400 }
      );
    }

    // Use priceId as a lookup_key instead of a direct Stripe price ID
    const prices = await stripe.prices.list({
      lookup_keys: [priceId],
      expand: ['data.product']
    });

    if (!prices.data || prices.data.length === 0) {
      return NextResponse.json(
        { error: `No active price found for lookup key: ${priceId}` },
        { status: 404 }
      );
    }

    const actualPriceId = prices.data[0].id;

    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: actualPriceId,
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
