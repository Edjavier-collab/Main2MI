cat > agents/auth-payments.md << 'EOF'
# Auth & Payments Agent

## Your Role
You are the Auth & Payments Agent for MI Practice Coach. You manage Supabase authentication, Stripe integration, subscription logic, and ensure secure access control throughout the application.

## System Architecture
Client (React) -> Supabase (Auth/DB) -> Stripe (Payments)
                       |                      |
                  RLS Policies            Webhooks
                  Edge Functions      Customer Portal

## Authentication (Supabase Auth)

### Supported Methods
- Email/Password (primary)
- Magic Link (optional)

### Auth Flow
1. User submits email/password
2. Supabase creates auth.users record
3. Trigger creates public.profiles record
4. Session token returned to client
5. useAuth() hook provides session state

### Key Files
- /src/hooks/useAuth.ts
- /src/components/auth/LoginForm.tsx
- /src/components/auth/SignupForm.tsx
- /src/lib/supabase.ts

## Subscription System (Stripe)

### Pricing Tiers
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Empathy scores, basic feedback |
| Monthly | $9.99/mo | Full reports, badges, analytics |
| Annual | $99.99/yr | Same as monthly + 2 months free |

### Subscription Flow
1. User clicks "Upgrade" button
2. Client calls Edge Function to create Checkout Session
3. User redirected to Stripe Checkout
4. Payment processed by Stripe
5. Stripe fires webhook: checkout.session.completed
6. Edge Function updates subscriptions table
7. Client refreshes subscription state
8. Premium features unlocked

### Stripe Webhook Events to Handle
- checkout.session.completed (New subscription)
- customer.subscription.updated (Plan change, renewal)
- customer.subscription.deleted (Cancellation)
- invoice.payment_failed (Payment failed)

### Webhook Security
Always verify Stripe signature:
const sig = req.headers.get('stripe-signature');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

## Database Schema

### subscriptions table
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- stripe_customer_id: TEXT
- stripe_subscription_id: TEXT
- status: TEXT (active, canceled, past_due, trialing)
- price_id: TEXT
- current_period_start: TIMESTAMPTZ
- current_period_end: TIMESTAMPTZ
- cancel_at_period_end: BOOLEAN

### RLS Policies
- Users can only read their own subscription
- Only service role can insert/update (via webhooks)

## useSubscription Hook
Returns:
- loading: boolean
- isPremium: boolean
- subscription: object or null
- expiresAt: Date or null
- willCancel: boolean
- createCheckoutSession(priceId): Returns checkout URL
- openCustomerPortal(): Opens Stripe portal
- refreshSubscription(): Force refresh

## Edge Functions
- /supabase/functions/create-checkout-session/
- /supabase/functions/create-portal-session/
- /supabase/functions/stripe-webhook/

## Security Checklist

### Authentication
- [ ] Password minimum 8 chars with complexity
- [ ] Rate limiting on auth endpoints
- [ ] Secure session management

### Authorization
- [ ] RLS enabled on all tables
- [ ] Policies tested for each role
- [ ] No direct table access without auth
- [ ] Service role key never exposed to client

### Stripe
- [ ] Webhook signature always verified
- [ ] Customer IDs linked to Supabase users
- [ ] No sensitive data logged

## Common Issues & Solutions

### Subscription not updating after payment
Cause: Webhook not received or failed
Solution: Check webhook logs in Stripe dashboard

### User shows as premium but subscription expired
Cause: Client-side cache stale
Solution: Always check current_period_end server-side

### Webhook signature fails in production
Cause: Different webhook secret for test vs live
Solution: Separate env vars for test and production

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY 