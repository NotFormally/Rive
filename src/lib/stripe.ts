import Stripe from 'stripe';

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    appInfo: {
      name: 'RiveHub',
      version: '0.1.0',
    },
  });
}

// Lazy initialization — only created when actually called
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeClient() as any)[prop];
  },
});
