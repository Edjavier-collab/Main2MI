# Stripe Payment Integration - Quick Start

## 30-Second Setup Check

```bash
# 1. Start three terminals
Terminal 1: npm run dev                              # Frontend (port 3000)
Terminal 2: npm run dev:server                       # Backend (port 3001)
Terminal 3: stripe listen --forward-to localhost:3001/api/stripe-webhook

# 2. Check backend is healthy
curl http://localhost:3001/api/setup-check

# 3. Verify all these show ✅ or true
```

## Required Environment Variables

Create `.env.local` in project root with:

```env
# === STRIPE ===
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from stripe listen output)
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...

# === SUPABASE ===
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === BACKEND URL (optional, defaults to localhost:3001) ===
VITE_BACKEND_URL=http://localhost:3001
```

## Getting Your Keys

### Stripe Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy "Secret key" → `STRIPE_SECRET_KEY`
3. Copy "Publishable key" → `VITE_STRIPE_PUBLISHABLE_KEY`

### Stripe Prices
1. Go to https://dashboard.stripe.com/test/products
2. Create two products with recurring prices:
   - Monthly: $9.99 → Copy Price ID → `STRIPE_PRICE_MONTHLY`
   - Annual: $99.99 → Copy Price ID → `STRIPE_PRICE_ANNUAL`

### Stripe Webhook Secret
Run in Terminal 3:
```bash
stripe listen --forward-to localhost:3001/api/stripe-webhook
```
Copy the displayed `whsec_...` → `STRIPE_WEBHOOK_SECRET`

### Supabase Keys
1. Go to https://app.supabase.com/project/_/settings/api
2. Copy "Project URL" → `VITE_SUPABASE_URL`
3. Copy "anon public" → `VITE_SUPABASE_ANON_KEY`
4. Copy "service_role secret" → `SUPABASE_SERVICE_ROLE_KEY`

## Testing Payment Flow

1. **Complete 3 free sessions** to exhaust free tier
2. **Click "Subscribe Monthly"** or "Subscribe Annually"
3. **Use test card**: `4242 4242 4242 4242`
4. **Expiry**: Any future date (e.g., `12/34`)
5. **CVC**: Any 3 digits (e.g., `123`)
6. **ZIP**: Any 5 digits (e.g., `12345`)

## What Happens Behind the Scenes

1. Frontend → Stripe Checkout → User pays ✅
2. Stripe → Backend Webhook → Updates database
3. Frontend → Polls Supabase → Finds tier = "premium"
4. Frontend → Shows success, updates tier

## Monitoring Success

### Frontend Console (F12)
Look for:
```
[App] ✅ Stripe checkout success detected
[App] ✅ Tier successfully updated to premium!
```

### Backend Logs (Terminal 2)
Look for:
```
[stripe-server] Checkout completed for user: user-id
[stripe-server] ✅ Successfully updated user tier to premium
```

### Stripe Dashboard
Go to https://dashboard.stripe.com/test/webhooks
Look for `checkout.session.completed` event ✅

## Debugging

```bash
# Check if backend is running
curl http://localhost:3001/health

# Full setup diagnostic
curl http://localhost:3001/api/setup-check | jq

# Is Stripe CLI connected?
# Terminal 3 should show: "> Ready! Your webhook signing secret is whsec_..."
```

## Troubleshooting

| Issue | Check First | Solution |
|-------|-------------|----------|
| "Failed to create checkout session" | Is backend running? | `npm run dev:server` |
| "Tier is still free" | Is webhook secret set? | Check `.env.local` has `STRIPE_WEBHOOK_SECRET` |
| "No rows updated" | Does user profile exist? | Check Supabase `profiles` table |
| Can't connect to backend | Is port 3001 free? | `lsof -i :3001` |
| Keys not working | Did you restart servers? | Stop and run `npm run dev:server` again |

## Full Troubleshooting Guide

See `STRIPE_TROUBLESHOOTING.md` for detailed solutions.


