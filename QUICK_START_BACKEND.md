# Quick Start: Backend Implementation

## 1. Database Migrations (5 minutes)

Copy and paste into Supabase SQL Editor:

```sql
-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  status text,
  price_id text,
  plan_interval text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_id_idx ON subscriptions(stripe_subscription_id);

-- 2. Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id text NOT NULL PRIMARY KEY,
  event_type text,
  payload jsonb,
  processed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webhook_events_type_idx ON webhook_events(event_type);

-- 3. Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS age_confirmed boolean DEFAULT false;
```

## 2. Add Webhook Handlers (15 minutes)

In `server/stripe-server.js`, find the webhook handler around line 50 and update it to handle these events:

```javascript
// Add these inside the webhook handler's event.type checks:

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const userId = session.metadata?.userId;
  
  // Update profiles tier to premium
  // Create subscriptions row with stripe IDs
}

if (event.type === 'customer.subscription.updated') {
  const subscription = event.data.object;
  
  // Update subscriptions table status
  // If canceled/unpaid, downgrade user tier to free
}

if (event.type === 'customer.subscription.deleted') {
  const subscription = event.data.object;
  
  // Mark as canceled in subscriptions
  // Downgrade tier to free
}
```

See **SUBSCRIPTION_SETUP.md section 2** for full code.

## 3. Add Service Functions (10 minutes)

In `services/databaseService.ts`, add:

```typescript
export const getSubscriptions = async (userId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};
```

## 4. Add Backend Endpoints (20 minutes)

Add to `server/stripe-server.js` after the create-checkout-session endpoint:

```javascript
// Data export endpoint
app.get('/api/account/export', async (req, res) => {
  // See SUBSCRIPTION_SETUP.md section 4
});

// Account deletion endpoint
app.post('/api/account/delete', async (req, res) => {
  // See SUBSCRIPTION_SETUP.md section 5
});
```

## 5. Update Settings Component (5 minutes)

In `components/SettingsView.tsx`, replace the handlePlaceholderClick in the "Manage Subscription" row with:

```typescript
onClick={handleManageSubscription}
```

And add the function (see SUBSCRIPTION_SETUP.md section 6).

## 6. Start Backend & Test (10 minutes)

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run dev:server

# Terminal 3: Stripe webhook listener
stripe listen --forward-to localhost:3001/api/stripe-webhook

# Copy webhook signing secret from output and add to .env.local
```

## 7. Test Checkout Flow

1. Go to http://localhost:3000
2. Login or create account
3. Free tier → click "Subscribe Annual"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Any future expiry date, any CVC
6. Fill billing address (required by law)
7. Should succeed and redirect with `session_id` in URL
8. Check Supabase: new row in `subscriptions` table
9. Check `profiles`: tier should be 'premium'
10. Go to Settings → "Manage Subscription" → should open Stripe portal

## Environment Variables Checklist

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
VITE_BACKEND_URL=http://localhost:3001
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NODE_ENV=development
```

## Common Issues

**Issue**: "No subscriptions table"
**Fix**: Run the SQL migrations (step 1)

**Issue**: "Webhook not received"
**Fix**: Make sure `stripe listen` is running and STRIPE_WEBHOOK_SECRET is in .env.local

**Issue**: "Tier not updating after payment"
**Fix**: Check webhook handler is catching event, check Supabase has `subscriptions` table

**Issue**: "Billing portal button does nothing"
**Fix**: Make sure `getSubscriptions` is implemented and returns data with `stripe_customer_id`

## Next Steps After Backend

1. Staging deployment test
2. Production Stripe API keys
3. Live customer testing
4. Monitoring & alerts setup

---

**Estimated time**: 1 hour total for experienced backend dev

