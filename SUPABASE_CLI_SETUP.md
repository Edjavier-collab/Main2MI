# Supabase CLI Setup Guide

This guide walks you through setting up the Supabase CLI to manage your database migrations.

## Prerequisites

- Supabase CLI installed (✅ Already installed at `/opt/homebrew/bin/supabase`)
- Access to your Supabase project dashboard
- Project reference ID: `alszwgqoicjgfrhecscj`

## Step 1: Create Access Token

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click on your profile icon (top right) → **Account Settings**
3. Navigate to **Access Tokens** in the left sidebar
4. Click **Generate New Token**
5. Give it a name (e.g., "MI Practice Coach CLI")
6. Copy the token immediately (you won't be able to see it again)

## Step 2: Authenticate the Supabase CLI

Open your terminal in the project root and run:

```bash
cd /Users/eduardojavier/mi-practice-coach/mi-practice-coach
supabase login
```

When prompted, paste the access token from Step 1.

**Alternative (if interactive login doesn't work):**

Set the token as an environment variable:

```bash
export SUPABASE_ACCESS_TOKEN="your_token_here"
```

Or add it to your `.env.local` file (though this is less secure):

```env
SUPABASE_ACCESS_TOKEN=your_token_here
```

## Step 3: Link Your Project

Once authenticated, link your local project to Supabase:

```bash
supabase link --project-ref alszwgqoicjgfrhecscj
```

This will create a `.supabase` directory with your project configuration.

## Step 4: Apply Database Migrations

Apply the schema migration to your Supabase project:

```bash
supabase db push
```

This will apply the migration in `supabase/migrations/001_initial_schema.sql`, which creates:
- `profiles` table with RLS policies
- `sessions` table with RLS policies
- Indexes for performance
- Auto-triggers for profile creation

## Step 5: Verify Environment Variables

Ensure your `.env.local` file contains:

```env
VITE_SUPABASE_URL=https://alszwgqoicjgfrhecscj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

You can find these in your Supabase Dashboard:
- **Settings → API** → Project URL and anon key
- **Settings → API** → service_role key (keep this secret!)

## Step 6: Verify Setup

Test that everything is working:

```bash
# Check CLI connection
supabase status

# Or view your database schema
supabase db remote commit
```

## Troubleshooting

### "Access token not provided"
- Make sure you've run `supabase login` or set `SUPABASE_ACCESS_TOKEN`
- Try logging in again: `supabase login --token YOUR_TOKEN`

### "Project not found"
- Verify your project reference ID is correct
- Check that you have access to the project in the dashboard

### Migration conflicts
- If tables already exist, you may need to drop existing policies first
- See the migration file comments for guidance

## Next Steps

After setup is complete:
- Your database schema will be managed via migrations
- Use `supabase db push` to apply new migrations
- Use `supabase db pull` to sync remote schema changes locally
- Use `supabase db studio` to open a local database browser

