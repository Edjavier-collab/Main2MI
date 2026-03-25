---
name: subdomain-migrator
description: Automates the migration of a Next.js application from a root domain (e.g., mimastery.com) to a subdomain (e.g., app.mimastery.com). Trigger this skill whenever the user mentions "subdomain migration", "moving to app.domain.com", "changing site domain", or "refactoring hardcoded domain strings". This skill ensures metadata, environment variables, service callbacks (Stripe, Supabase), and config files are updated according to modern Next.js App Router standards.
---

# Subdomain Migrator

A specialized skill for migrating a Next.js application to a subdomain while maintaining service integrity and SEO. **This skill is project-specific and should only operate within the current workspace.** Do not attempt global system modifications or changes outside the scope of the current project directory.

## Core Responsibilities

1. **MetadataBase Migration:** Ensure `metadataBase` in the root `layout.tsx` is updated to the new subdomain using `process.env.NEXT_PUBLIC_SITE_URL`.
2. **Environment Variable Refactoring:** Replace all hardcoded instances of the old root domain (e.g., `mimastery.com`) with `process.env.NEXT_PUBLIC_SITE_URL` across the entire codebase.
3. **Service Logic (Stripe & Supabase):**
   - Update Stripe Checkout success/cancel URLs.
   - Update Supabase Auth redirect callbacks (e.g., `auth/callback`).
   - **Update Supabase Edge Functions CORS Headers:** Ensure `supabase/functions/_shared/cors.ts` (or equivalent) allows the new subdomain in `Access-Control-Allow-Origin`.
   - Ensure redirection logic correctly prepends the subdomain.
4. **Configuration (Image Optimization):** Update `next.config.js` `remotePatterns` to allow the new subdomain and any related external domains.
5. **Leak Prevention:** Generate a `scripts/check-leaks.sh` script to audit the codebase for any remaining hardcoded old domain strings.

## Workflow

### 1. Research & Audit
- Identify all hardcoded instances of the root domain.
- Locate the root `layout.tsx` and check `metadataBase`.
- Identify Stripe and Supabase service files, and Edge Function shared headers.
- Inspect `next.config.js` for `remotePatterns`.

### 2. Implementation
- **Refactor Strings:** Use search tools to find all occurrences of the root domain and replace them with `process.env.NEXT_PUBLIC_SITE_URL` where appropriate.
- **Update Metadata:** Ensure `metadataBase` is set to `new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://app.example.com')`.
- **Update Config:** Add the new subdomain to `next.config.js` `remotePatterns`.
- **Update CORS:** Ensure Supabase functions accept requests from the new subdomain.
- **Service Callbacks:** Fix any logic that manually constructs URLs.

### 3. Verification Script
Generate `scripts/check-leaks.sh` with the following logic:
```bash
#!/bin/bash
OLD_DOMAIN="mimastery.com"
echo "Checking for remaining instances of $OLD_DOMAIN..."
grep -r "$OLD_DOMAIN" . --exclude-dir={node_modules,.next,.git,scripts} --exclude=package-lock.json
```

### 4. Validation & Evals
- Run `npm run build` to ensure no environment variable issues.
- Confirm that the leak-check script passes (no output).
- **Eval Constraints:** When running test cases or evaluations for this skill, always **copy** the targeted files to the subagent's designated output directory before modifying them. Do NOT modify the live workspace files during evaluation testing.

## Best Practices
- **Prefer Environment Variables:** Never hardcode the new subdomain; always use `NEXT_PUBLIC_SITE_URL`.
- **Be Surgical:** Only replace domain strings that refer to the site's own domain, not third-party domains (unless they are also being migrated).
- **SEO First:** Ensure canonical URLs and OG images use the full subdomain URL.
