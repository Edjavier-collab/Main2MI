#!/bin/bash

# Deploy Supabase Edge Functions Script
# Run this script to deploy all Edge Functions to your Supabase project

set -e

echo "=========================================="
echo "  MI Practice Coach - Edge Functions Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed.${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"

# Check if logged in
echo ""
echo "Step 1: Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}You need to login to Supabase first.${NC}"
    echo "This will open a browser window for authentication."
    echo ""
    read -p "Press Enter to login to Supabase..."
    supabase login
fi

echo -e "${GREEN}✓ Logged in to Supabase${NC}"

# Check if project is linked
echo ""
echo "Step 2: Checking project link..."
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${YELLOW}Project not linked. Let's link it now.${NC}"
    echo ""
    echo "You can find your project reference in your Supabase dashboard URL:"
    echo "https://supabase.com/dashboard/project/<project-ref>"
    echo ""
    read -p "Enter your Supabase project reference: " PROJECT_REF
    supabase link --project-ref "$PROJECT_REF"
fi

echo -e "${GREEN}✓ Project linked${NC}"

# Check and set secrets
echo ""
echo "Step 3: Setting up Stripe secrets..."
echo ""
echo -e "${YELLOW}You need to set these secrets (skip if already set):${NC}"
echo "  - STRIPE_SECRET_KEY (from Stripe Dashboard > Developers > API keys)"
echo "  - STRIPE_PRICE_MONTHLY (from Stripe Dashboard > Products > Pricing)"
echo "  - STRIPE_PRICE_ANNUAL (from Stripe Dashboard > Products > Pricing)"
echo "  - STRIPE_WEBHOOK_SECRET (create webhook first, then get secret)"
echo ""
read -p "Do you want to set/update secrets now? (y/n): " SET_SECRETS

if [ "$SET_SECRETS" = "y" ] || [ "$SET_SECRETS" = "Y" ]; then
    echo ""
    read -p "Enter STRIPE_SECRET_KEY (or press Enter to skip): " STRIPE_SECRET_KEY
    if [ -n "$STRIPE_SECRET_KEY" ]; then
        supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
        echo -e "${GREEN}✓ STRIPE_SECRET_KEY set${NC}"
    fi

    read -p "Enter STRIPE_PRICE_MONTHLY (or press Enter to skip): " STRIPE_PRICE_MONTHLY
    if [ -n "$STRIPE_PRICE_MONTHLY" ]; then
        supabase secrets set STRIPE_PRICE_MONTHLY="$STRIPE_PRICE_MONTHLY"
        echo -e "${GREEN}✓ STRIPE_PRICE_MONTHLY set${NC}"
    fi

    read -p "Enter STRIPE_PRICE_ANNUAL (or press Enter to skip): " STRIPE_PRICE_ANNUAL
    if [ -n "$STRIPE_PRICE_ANNUAL" ]; then
        supabase secrets set STRIPE_PRICE_ANNUAL="$STRIPE_PRICE_ANNUAL"
        echo -e "${GREEN}✓ STRIPE_PRICE_ANNUAL set${NC}"
    fi

    read -p "Enter STRIPE_WEBHOOK_SECRET (or press Enter to skip): " STRIPE_WEBHOOK_SECRET
    if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
        supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
        echo -e "${GREEN}✓ STRIPE_WEBHOOK_SECRET set${NC}"
    fi
fi

# Deploy functions
echo ""
echo "Step 4: Deploying Edge Functions..."
echo ""

FUNCTIONS=(
    "create-checkout-session"
    "stripe-webhook"
    "get-subscription"
    "cancel-subscription"
    "apply-retention-discount"
    "restore-subscription"
    "upgrade-subscription"
)

for func in "${FUNCTIONS[@]}"; do
    echo "Deploying $func..."
    supabase functions deploy "$func" --no-verify-jwt
    echo -e "${GREEN}✓ $func deployed${NC}"
done

echo ""
echo "=========================================="
echo -e "${GREEN}  All Edge Functions Deployed!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to Stripe Dashboard > Developers > Webhooks"
echo "2. Add endpoint: https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook"
echo "3. Select events: checkout.session.completed, customer.subscription.updated,"
echo "   customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed"
echo "4. Copy the webhook signing secret"
echo "5. Run: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx"
echo ""
echo "Your Edge Functions are now live!"

