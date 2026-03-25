#!/bin/bash
OLD_DOMAIN="mimastery.com"
echo "Checking for remaining instances of $OLD_DOMAIN (excluding emails and env vars)..."
grep -r "$OLD_DOMAIN" . \
  --exclude-dir={node_modules,.next,.git,scripts,brain,.agents} \
  --exclude={package-lock.json,.env.local,.env} \
  | grep -v "@mimastery.com"
