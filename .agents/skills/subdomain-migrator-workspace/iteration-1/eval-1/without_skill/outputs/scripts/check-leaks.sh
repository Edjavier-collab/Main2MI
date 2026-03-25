#!/bin/bash

# Script to check for hardcoded 'mimastery.com' strings that should be replaced with process.env.NEXT_PUBLIC_SITE_URL

echo "Checking for hardcoded 'mimastery.com' strings..."

# Files to exclude from the check
EXCLUDE_PATTERNS="node_modules|.next|.git|scripts/check-leaks.sh|package-lock.json"

# Search for the string, excluding certain directories
FOUND_LEAKS=$(grep -rn "mimastery.com" . | grep -vE "$EXCLUDE_PATTERNS")

if [ -z "$FOUND_LEAKS" ]; then
  echo "✅ No hardcoded 'mimastery.com' strings found."
  exit 0
else
  echo "❌ Found potential leaks:"
  echo "$FOUND_LEAKS"
  echo ""
  echo "Please replace these with 'process.env.NEXT_PUBLIC_SITE_URL' where appropriate."
  exit 1
fi
