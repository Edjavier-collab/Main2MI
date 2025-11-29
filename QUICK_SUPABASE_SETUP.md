# Quick Supabase CLI Setup

## TL;DR - Run This

```bash
# 1. Get your access token from: https://app.supabase.com/account/tokens

# 2. Login (choose one):
supabase login
# OR
export SUPABASE_ACCESS_TOKEN="your_token_here"

# 3. Link project
cd /Users/eduardojavier/mi-practice-coach/mi-practice-coach
supabase link --project-ref alszwgqoicjgfrhecscj

# 4. Apply migrations
supabase db push

# 5. Verify
supabase status
```

## Or Use the Setup Script

```bash
cd /Users/eduardojavier/mi-practice-coach/mi-practice-coach
./scripts/setup-supabase-cli.sh
```

## What Gets Created

The migration (`supabase/migrations/001_initial_schema.sql`) creates:

- ✅ `profiles` table - User subscription tiers
- ✅ `sessions` table - Practice session data  
- ✅ RLS policies - Users can only access their own data
- ✅ Indexes - Fast queries by user_id and date
- ✅ Auto-triggers - Profile created automatically on signup

## Verify Your .env.local

Make sure these are set (get from Supabase Dashboard → Settings → API):

```env
VITE_SUPABASE_URL=https://alszwgqoicjgfrhecscj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Need Help?

See `SUPABASE_CLI_SETUP.md` for detailed instructions.

