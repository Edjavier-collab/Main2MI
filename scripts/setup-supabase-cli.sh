#!/bin/bash

# Supabase CLI Setup Script
# This script helps you set up the Supabase CLI for the MI Practice Coach project

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_REF="alszwgqoicjgfrhecscj"

echo "🚀 Supabase CLI Setup for MI Practice Coach"
echo "============================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found: $(which supabase)"
echo ""

# Check if already logged in
if supabase projects list &> /dev/null; then
    echo "✅ Already authenticated with Supabase"
else
    echo "📝 Step 1: Authentication Required"
    echo "   You need to log in to Supabase CLI."
    echo ""
    echo "   Option A: Interactive login (recommended)"
    echo "   Run: supabase login"
    echo "   Then paste your access token when prompted."
    echo ""
    echo "   Option B: Use environment variable"
    echo "   Run: export SUPABASE_ACCESS_TOKEN='your_token_here'"
    echo "   Then run this script again."
    echo ""
    echo "   Get your token from: https://app.supabase.com/account/tokens"
    echo ""
    read -p "Have you logged in? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please log in first, then run this script again."
        exit 1
    fi
fi

# Check if project is already linked
if [ -d "$PROJECT_ROOT/.supabase" ]; then
    echo "✅ Project appears to be linked (`.supabase` directory exists)"
    read -p "Do you want to re-link? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔗 Linking project..."
        cd "$PROJECT_ROOT"
        supabase link --project-ref "$PROJECT_REF"
    else
        echo "Skipping link step."
    fi
else
    echo "🔗 Step 2: Linking project..."
    cd "$PROJECT_ROOT"
    supabase link --project-ref "$PROJECT_REF"
fi

echo ""
echo "📦 Step 3: Applying database migrations..."
cd "$PROJECT_ROOT"

if [ -f "supabase/migrations/001_initial_schema.sql" ]; then
    echo "   Found migration: 001_initial_schema.sql"
    echo "   This will create:"
    echo "   - profiles table with RLS policies"
    echo "   - sessions table with RLS policies"
    echo "   - Indexes and triggers"
    echo ""
    read -p "Apply migration? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase db push
        echo ""
        echo "✅ Migration applied successfully!"
    else
        echo "Skipping migration. Run 'supabase db push' manually when ready."
    fi
else
    echo "⚠️  No migration file found at supabase/migrations/001_initial_schema.sql"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify your .env.local has the correct Supabase credentials"
echo "2. Test the connection: supabase status"
echo "3. View database: supabase db studio"
echo ""

