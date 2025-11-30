import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

// Initialize Stripe with the secret key from environment
export function getStripe(): Stripe {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(stripeKey, {
    apiVersion: '2024-11-20.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  });
}

// Get price IDs from environment
export function getPriceIds() {
  return {
    monthly: Deno.env.get('STRIPE_PRICE_MONTHLY') || '',
    annual: Deno.env.get('STRIPE_PRICE_ANNUAL') || '',
  };
}

// Determine user tier based on subscription status
export function getSubscriptionTierStatus(subscription: Stripe.Subscription | null): string {
  if (!subscription) {
    return 'free';
  }

  // Active subscription = premium
  if (subscription.status === 'active') {
    return 'premium';
  }

  // Trialing subscription = premium
  if (subscription.status === 'trialing') {
    return 'premium';
  }

  // Past due but still in grace period = premium
  if (subscription.status === 'past_due') {
    return 'premium';
  }

  // Cancelled, incomplete, or unpaid = free
  return 'free';
}

