#!/bin/bash

# Find remaining 'mimastery.com' strings excluding common irrelevant directories
grep -rn "mimastery.com" . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude-dir=.cache \
  --exclude=package-lock.json \
  --exclude=*.log \
  --exclude=check-leaks.sh
