# Subscription Implementation Guide

This document outlines the remaining steps to complete the subscription-ready setup for MI Practice Coach.

## Completed

✅ Legal pages (Privacy Policy, Terms of Service, Subscription Terms, Cookie Policy, Disclaimer)
✅ Cookie consent banner with preferences storage
✅ Onboarding acceptance flow (age 18+, Terms/Privacy)
✅ Stripe Billing Portal endpoint (`/api/create-billing-portal-session`)
✅ Automatic tax and billing address collection in checkout
✅ CORS restriction to FRONTEND_URL in production

## Remaining Tasks

### 1. Supabase Database Setup

#### 1a. Create `subscriptions` table

Run this SQL in Supabase SQL Editor:

```sql
-- Create subscriptions table
CREATE TABLE subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  status text, -- 'active', 'past_due', 'unpaid', 'canceled', 'trialing'
  price_id text,
  plan_interval text, -- 'month' or 'year'
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
```

#### 1b. Create `webhook_events` table for idempotency

```sql
-- Create webhook_events table for idempotent processing
CREATE TABLE webhook_events (
  event_id text NOT NULL PRIMARY KEY,
  event_type text,
  payload jsonb,
  processed_at timestamptz DEFAULT now()
);

CREATE INDEX webhook_events_event_type_idx ON webhook_events(event_type);
```

#### 1c. Update `profiles` table with acceptance fields

```sql
-- Add acceptance tracking fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS age_confirmed boolean DEFAULT false;
```

#### 1d. Enable RLS (Row-Level Security) - Optional but recommended

```sql
-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Service role bypass (server-side only)
-- Note: Service role key can bypass RLS, which is needed for webhooks
```

---

### 2. Webhook Event Handlers Enhancement

Update `server/stripe-server.js` webhook handler to handle full subscription lifecycle:

```javascript
// In the webhook handler, add these event types:

if (event.type === 'customer.subscription.created') {
  const subscription = event.data.object;
  const userId = subscription.metadata?.userId;
  
  // Store subscription details in Supabase
  // Call `supabase.from('subscriptions').insert({ ...subscription_data })`
}

if (event.type === 'customer.subscription.updated') {
  const subscription = event.data.object;
  
  // Update subscription status, current_period_end, cancel_at_period_end
  // Map status to tier: 'active' -> premium, 'canceled'/'unpaid' -> free
}

if (event.type === 'customer.subscription.deleted') {
  const subscription = event.data.object;
  
  // Mark subscription as canceled
  // Downgrade user tier to 'free' in profiles table
}

if (event.type === 'invoice.payment_succeeded') {
  // Optional: Log successful payments for analytics
}

if (event.type === 'invoice.payment_failed') {
  const invoice = event.data.object;
  
  // Notify user of failed payment
  // Consider downgrading tier if payment fails repeatedly
}
```

---

### 3. Persist Stripe Customer ID & Subscription ID on Checkout Success

In `App.tsx`, after checkout success, fetch the checkout session to get the customer ID and subscription ID:

```typescript
// In the `useEffect` that handles `session_id` from checkout redirect:

const session = await stripe.checkout.sessions.retrieve(sessionId, {
  stripeAccount: 'your-account-id', // If using Stripe Connect
});

const customerId = session.customer; // Stripe Customer ID
const subscriptionId = session.subscription; // Stripe Subscription ID

// Store in Supabase subscriptions table
await saveSubscriptionToDatabase(user.id, {
  stripe_customer_id: customerId,
  stripe_subscription_id: subscriptionId,
  status: 'active', // Will be updated by webhook
  price_id: session.line_items[0].price.id,
  plan_interval: plan, // 'month' or 'year'
});
```

---

### 4. Data Export Endpoint

Add to `server/stripe-server.js`:

```javascript
app.get('/api/account/export', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Fetch user profile, sessions, and subscriptions
    const [profile, sessions, subscriptions] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('sessions').select('*').eq('user_id', userId),
      supabase.from('subscriptions').select('*').eq('user_id', userId),
    ]);

    // Return as JSON (or ZIP for large exports)
    res.json({
      profile: profile.data,
      sessions: sessions.data,
      subscriptions: subscriptions.data,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[stripe-server] Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});
```

---

### 5. Account Deletion Endpoint

Add to `server/stripe-server.js`:

```javascript
app.post('/api/account/delete', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Delete or anonymize sessions and subscriptions
    await Promise.all([
      supabase.from('sessions').delete().eq('user_id', userId),
      supabase.from('subscriptions').delete().eq('user_id', userId),
    ]);

    // Delete profile
    await supabase.from('profiles').delete().eq('user_id', userId);

    // Optionally schedule auth user deletion (requires Supabase admin API)
    console.log('[stripe-server] User data deleted for userId:', userId);

    res.json({ message: 'Account deletion scheduled' });
  } catch (error) {
    console.error('[stripe-server] Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});
```

---

### 6. Hook Settings "Manage Subscription" to Portal

Update `components/SettingsView.tsx`:

```typescript
const handleManageSubscription = async () => {
  try {
    setLoading(true);
    
    // Fetch user's Stripe customer ID from Supabase
    const profile = await getUserProfile(user.id);
    const subscriptions = await getSubscriptions(user.id);
    
    if (!subscriptions || subscriptions.length === 0) {
      alert('No active subscription found');
      return;
    }

    const customerId = subscriptions[0].stripe_customer_id;
    
    // Call backend to create portal session
    const response = await fetch(`${process.env.VITE_BACKEND_URL}/api/create-billing-portal-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}`,
      }),
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('[SettingsView] Error opening portal:', error);
    alert('Failed to open subscription management portal');
  } finally {
    setLoading(false);
  }
};

// Then update the Settings row onClick:
<SettingsRow onClick={handleManageSubscription}>
  <span className="text-sky-600">Manage Subscription</span>
</SettingsRow>
```

---

### 7. Create `getSubscriptions` Service Function

Add to `services/databaseService.ts`:

```typescript
export const getSubscriptions = async (userId: string): Promise<any[] | null> => {
  try {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[databaseService] Error fetching subscriptions:', error);
    return null;
  }
};
```

---

### 8. Update Onboarding Acceptance to Supabase

In `services/databaseService.ts`, update `createUserProfile` to include acceptance fields:

```typescript
export const createUserProfile = async (userId: string, tier: UserTier = UserTier.Free): Promise<DbUserProfile | null> => {
  try {
    const now = new Date().toISOString();
    
    // Retrieve acceptance timestamps from localStorage
    const termsAcceptedAt = localStorage.getItem('mi-coach-terms-accepted');
    const privacyAcceptedAt = localStorage.getItem('mi-coach-privacy-accepted');
    const ageConfirmed = localStorage.getItem('mi-coach-age-confirmed') ? true : false;

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        tier,
        created_at: now,
        updated_at: now,
        terms_accepted_at: termsAcceptedAt,
        privacy_accepted_at: privacyAcceptedAt,
        age_confirmed: ageConfirmed,
      })
      .select('*')
      .single();

    // Clear localStorage acceptance fields
    localStorage.removeItem('mi-coach-age-confirmed');
    localStorage.removeItem('mi-coach-terms-accepted');
    localStorage.removeItem('mi-coach-privacy-accepted');

    return data as DbUserProfile;
  } catch (error) {
    console.error('[databaseService] Error creating profile:', error);
    return null;
  }
};
```

---

## Environment Variables Checklist

Ensure these are in `.env.local`:

```env
# Existing Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# New / Updated
FRONTEND_URL=http://localhost:3000  # For CORS and portal return URL
NODE_ENV=development  # Set to 'production' for prod

# Supabase
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Backend
VITE_BACKEND_URL=http://localhost:3001
```

---

## Testing Checklist

- [ ] Legal pages render correctly from Settings
- [ ] Cookie consent banner appears on first visit
- [ ] Onboarding acceptance step requires all checkboxes
- [ ] Checkout includes billing address and tax calculation
- [ ] Stripe webhook processes `checkout.session.completed` events
- [ ] Supabase subscription row created after purchase
- [ ] Tier updates to premium after successful payment
- [ ] Billing portal opens from Settings for premium users
- [ ] Subscription cancellation (via portal) downgrades tier to free

---

## Next Steps

1. **Run SQL migrations** in Supabase to create tables and fields
2. **Update webhook handler** to persist subscription data
3. **Implement data export/delete endpoints** for GDPR compliance
4. **Add getSubscriptions** database service function
5. **Update Settings** to call portal endpoint
6. **Test end-to-end** with Stripe test mode
7. **Deploy** to staging/production

---

## Support

For issues or questions:
- Check Stripe logs: https://dashboard.stripe.com/logs
- Check Supabase logs: Project > Logs
- Check server console: Backend logs in `npm run dev:server`


