#!/bin/bash

# Find any remaining 'mimastery.com' strings, excluding irrelevant directories
grep -r "mimastery.com" . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude-dir=.agents \
  --exclude-dir=_bmad \
  --exclude-dir=_bmad-output \
  --exclude-dir=archive \
  --exclude-dir=components_backup \
  --exclude-dir=.claude \
  --exclude-dir=.cursor \
  --exclude-dir=.testsprite \
  --exclude-dir=node_modules
