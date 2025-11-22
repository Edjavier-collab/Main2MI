# Stripe Payment & Tier Update Troubleshooting Guide

This guide helps diagnose and fix issues with Stripe payments and user tier upgrades.

## Quick Diagnosis

### Step 1: Check Backend Server Status

```bash
# Test if backend server is running
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-08T..."}
```

If the server is not responding, start it:
```bash
npm run dev:server
```

### Step 2: Run Setup Check

```bash
curl http://localhost:3001/api/setup-check | jq
```

This will show you the complete configuration status including:
- ✅/❌ Stripe keys configuration
- ✅/❌ Supabase credentials
- ✅/❌ Database connectivity
- ✅/❌ Price ID configuration

### Step 3: Check Frontend Console Logs

Open your browser's Developer Tools (F12) and go to the Console tab:

1. **Look for these success patterns:**
   ```
   [App] ✅ Stripe checkout success detected
   [App] ✅ Tier successfully updated to premium!
   [stripe-server] ✅ Successfully updated user tier to premium
   ```

2. **Look for these error patterns:**
   ```
   [App] Tier is still free (expected premium)
   [stripe-server] Supabase setup validation failed
   [stripe-server] No rows updated for user
   ```

---

## Common Issues & Solutions

### Issue 1: "Tier is still free (expected premium)" Warning

**Symptoms:**
- User completes payment successfully
- Stripe checkout redirects back to app
- Console shows: `[App] ⏳ Tier still: free (expected premium). Retrying...`
- Appears 5 times then gives up

**Root Causes:**
1. Backend server not running
2. Stripe CLI not forwarding webhooks
3. Supabase credentials missing
4. Database connection failed
5. Webhook processed but database update failed

**Solution Steps:**

#### A. Verify Backend Server is Running
```bash
# Terminal 1: Start backend
npm run dev:server

# Check logs for startup messages:
# [stripe-server] Server running on port 3001
# [stripe-server] Configuration: Stripe Secret Key: SET
```

#### B. Verify Stripe CLI is Forwarding Webhooks
```bash
# Terminal 2: Setup Stripe CLI forwarding
stripe listen --forward-to localhost:3001/api/stripe-webhook

# You should see:
# > Ready! Your webhook signing secret is whsec_xxxxx
```

**IMPORTANT:** Add the webhook secret to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### C. Check Supabase Credentials
In `.env.local`, verify these are set:
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

To find these values:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click Settings → API
4. Copy the URL and keys

#### D. Verify Database Connection
```bash
# Run setup check
curl http://localhost:3001/api/setup-check | jq '.supabase'

# Check for connection status like:
# "connectionTest": "✅ Connected (25 profiles)"
```

#### E. Test End-to-End Payment Flow
1. **Start all services:**
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   npm run dev:server
   
   # Terminal 3
   stripe listen --forward-to localhost:3001/api/stripe-webhook
   ```

2. **Complete a test payment:**
   - Go to http://localhost:3000
   - Log in
   - Create 3 free sessions (exhaust free tier)
   - Click "Subscribe Monthly" or "Subscribe Annually"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: `12/34` CVC: `123` ZIP: `12345`

3. **Monitor console logs:**
   - Frontend should show tier update attempts
   - Backend should show webhook received and database update

---

### Issue 2: "Failed to create checkout session"

**Symptoms:**
- User clicks "Subscribe" button
- Error appears: "Failed to create checkout session"
- Payment never initiates

**Root Causes:**
1. Backend server not running
2. Stripe secret key not configured
3. Price IDs not configured
4. Frontend can't reach backend URL

**Solution Steps:**

#### A. Verify Backend is Running
```bash
npm run dev:server
# Should see: [stripe-server] Server running on port 3001
```

#### B. Verify Stripe Configuration
Run setup check:
```bash
curl http://localhost:3001/api/setup-check | jq '.stripe'

# Should show:
# {
#   "secretKeyConfigured": true,
#   "publishableKeyConfigured": true,
#   "priceIds": {
#     "monthly": "✅ SET",
#     "annual": "✅ SET"
#   },
#   "webhookSecretConfigured": true
# }
```

If any are false/❌, add to `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_xxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
STRIPE_PRICE_MONTHLY=price_xxxx
STRIPE_PRICE_ANNUAL=price_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

#### C. Verify Frontend Backend URL
Check `.env.local` for:
```env
VITE_BACKEND_URL=http://localhost:3001
```

If not set, the frontend defaults to `http://localhost:3001`.

#### D. Check Network Requests
In browser DevTools (F12):
1. Go to Network tab
2. Click "Subscribe" button
3. Look for `create-checkout-session` request
4. Check response for errors

---

### Issue 3: "Webhook signature verification failed"

**Symptoms:**
- Backend logs show: `[stripe-server] Webhook signature verification failed`
- Tier doesn't update after payment
- May see: `This might be OK in development with Stripe CLI`

**Root Causes:**
1. `STRIPE_WEBHOOK_SECRET` not set correctly
2. Stripe CLI not running
3. Webhook secret mismatch between CLI and .env.local

**Solution Steps:**

#### A. Restart Stripe CLI with Fresh Secret
```bash
# Kill current Stripe CLI process (Ctrl+C)
# Then restart with fresh secret:
stripe listen --forward-to localhost:3001/api/stripe-webhook

# Copy the new webhook secret displayed
# Update .env.local:
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Restart backend server
npm run dev:server
```

#### B. Verify Webhook is Being Received
```bash
# Check Stripe Dashboard
# Go to: https://dashboard.stripe.com/test/webhooks
# Look for recent events in the endpoint list
```

---

### Issue 4: "No rows updated" / Profile Not Found

**Symptoms:**
- Backend logs show: `[stripe-server] ⚠️  No rows updated for user`
- Possible causes listed
- User profile might not exist in database

**Root Causes:**
1. User profile row doesn't exist in `profiles` table
2. RLS (Row Level Security) policies prevent updates
3. Service role key lacks permissions
4. Wrong user_id format

**Solution Steps:**

#### A. Check User Profile Exists
```sql
-- Run in Supabase SQL Editor
SELECT * FROM profiles WHERE user_id = 'user-id-here';
```

If no rows returned, profile doesn't exist.

#### B. Create Profile If Missing
```sql
INSERT INTO profiles (user_id, tier, created_at, updated_at)
VALUES ('user-id-here', 'free', NOW(), NOW());
```

#### C. Verify RLS Policies
In Supabase Dashboard:
1. Go to your project
2. Click "Authentication" → "Policies"
3. Select `profiles` table
4. Verify service role can UPDATE rows:

**Required policy:**
```sql
CREATE POLICY "service_role_can_update" ON profiles
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```

#### D. Verify Service Role Key
In Supabase Dashboard:
1. Settings → API
2. Copy the "Service role" key (starts with `eyJ...`)
3. Compare with `.env.local` `SUPABASE_SERVICE_ROLE_KEY`

They should match exactly.

---

### Issue 5: "Price ID not configured" Error

**Symptoms:**
- Backend logs: `Price ID not configured for plan: monthly`
- Error response: "Please set STRIPE_PRICE_MONTHLY in .env.local"

**Root Causes:**
1. Price IDs not created in Stripe Dashboard
2. Price IDs not added to `.env.local`
3. Environment variables not reloaded

**Solution Steps:**

#### A. Create Prices in Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Click "+ Add product"

**For Monthly Plan:**
- Name: "MI Practice Coach Premium - Monthly"
- Price: $9.99
- Billing: Monthly (recurring)
- Copy the Price ID (starts with `price_`)

**For Annual Plan:**
- Name: "MI Practice Coach Premium - Annual"
- Price: $99.99
- Billing: Yearly (recurring)
- Copy the Price ID (starts with `price_`)

#### B. Add to .env.local
```env
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_ANNUAL=price_xxxxx
```

#### C. Restart Backend Server
```bash
npm run dev:server
```

---

## Debugging Commands

### Test Backend Connectivity
```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/setup-check | jq
```

### Monitor Stripe CLI Webhook Events
```bash
stripe listen --forward-to localhost:3001/api/stripe-webhook -v
```

### Check Backend Logs
```bash
# The backend logs appear in Terminal 2 where you ran:
npm run dev:server
```

### View Complete Event in Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on the endpoint
3. View recent event attempts
4. Click on individual events to see request/response

### Frontend Console Debug Tips
Press F12 and type in console:
```javascript
// Check current user tier
JSON.parse(localStorage.getItem('mi-coach-tier'))

// Check saved sessions
JSON.parse(localStorage.getItem('mi-coach-sessions'))

// View all stored data
Object.keys(localStorage).filter(k => k.includes('mi-coach'))
```

---

## End-to-End Test Checklist

- [ ] Terminal 1: `npm run dev` (frontend on port 3000)
- [ ] Terminal 2: `npm run dev:server` (backend on port 3001)
- [ ] Terminal 3: `stripe listen --forward-to localhost:3001/api/stripe-webhook`
- [ ] `.env.local` has all Stripe and Supabase keys
- [ ] `curl http://localhost:3001/api/setup-check | jq` shows all ✅
- [ ] Log in to app
- [ ] Create 3 practice sessions
- [ ] Click "Subscribe Monthly"
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Check frontend console for success logs
- [ ] Check backend terminal for webhook success
- [ ] Verify tier changed to "premium"
- [ ] Logout and login to verify tier persists

---

## Production Deployment Notes

### Before Going Live

1. **Switch to Production Keys:**
   ```env
   STRIPE_SECRET_KEY=sk_live_xxxx  (not sk_test_xxxx)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
   STRIPE_PRICE_MONTHLY=price_live_xxxx
   STRIPE_PRICE_ANNUAL=price_live_xxxx
   ```

2. **Configure Webhook URL:**
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint with your production backend URL
   - Event type: `checkout.session.completed`
   - Copy the production webhook secret

3. **Update .env.local on Production Server:**
   ```env
   VITE_BACKEND_URL=https://your-backend-domain.com
   STRIPE_WEBHOOK_SECRET=whsec_live_xxxx
   ```

4. **Test in Production Test Mode:**
   - Use `pk_test_*` and `sk_test_*` keys even in production
   - This allows you to test before enabling live payments

---

## Getting Help

If you're still stuck:

1. **Run the full diagnostic:**
   ```bash
   curl http://localhost:3001/api/setup-check | jq
   ```

2. **Enable debug mode:**
   - Open DevTools (F12)
   - Go to Console
   - Look for all `[App]` and `[stripe-server]` messages

3. **Check Stripe Dashboard:**
   - https://dashboard.stripe.com/test/webhooks
   - Look at recent event delivery attempts

4. **Check Supabase Logs:**
   - https://app.supabase.com → Your Project → Logs → API logs
   - Look for update attempts to the profiles table


