# Sprint Change Proposal: Vite → Next.js Migration Blueprint

**Status:** 🚨 **CEO PIVOT ALERT** - Architecture Decision  
**Created By:** Architect  
**Date:** 2025-12-26  
**Priority:** High  
**Sprint:** Next Sprint

---

## Executive Summary

**Decision:** Migrate entire codebase from Vite/React SPA to Next.js App Router architecture.

**Rationale:**
- Better SEO and server-side rendering capabilities
- Improved performance with server components
- Native API routes (can replace some Edge Functions)
- Better developer experience with file-based routing
- Industry standard for production React apps

**Scope:** Complete migration of routing, hooks, and component architecture.

**Timeline:** 2-3 sprints (estimated 3-4 weeks)

---

## Current Architecture Analysis

### Routing System (Current)

**Current Approach:**
- Custom `View` enum with 18 views
- `useAppRouter` hook manages client-side routing
- `App.tsx` orchestrates all state and navigation
- `ViewRenderer.tsx` switches between view components
- Browser history managed manually with `window.history.pushState`

**View Enum → Path Mapping:**
```typescript
View.Dashboard → '/'
View.Login → '/login'
View.Practice → '/practice'
View.Feedback → '/feedback'
View.ScenarioSelection → '/scenarios'
View.Settings → '/settings'
View.Paywall → '/upgrade'
View.Reports → '/reports'
View.Calendar → '/calendar'
View.CoachingSummary → '/coaching-summary'
View.ResourceLibrary → '/resources'
View.History → '/history'
View.CancelSubscription → '/cancel-subscription'
View.ForgotPassword → '/forgot-password'
View.ResetPassword → '/reset-password'
View.EmailConfirmation → '/confirm-email'
View.PrivacyPolicy → '/privacy'
View.TermsOfService → '/terms'
View.SubscriptionTerms → '/subscription-terms'
View.CookiePolicy → '/cookies'
View.Disclaimer → '/disclaimer'
View.Support → '/support'
```

---

## Next.js Route Mapping

### App Router Structure (`app/` directory)

```
app/
├── layout.tsx                    # Root layout (replaces App.tsx wrapper)
├── page.tsx                      # Dashboard (/) - replaces View.Dashboard
├── login/
│   └── page.tsx                  # Login page
├── forgot-password/
│   └── page.tsx                  # Forgot password
├── reset-password/
│   └── page.tsx                  # Reset password (with token handling)
├── confirm-email/
│   └── page.tsx                  # Email confirmation
├── practice/
│   └── page.tsx                  # Practice session (requires auth)
├── feedback/
│   └── page.tsx                  # Feedback view (requires auth)
├── scenarios/
│   └── page.tsx                  # Scenario selection (Premium, requires auth)
├── settings/
│   └── page.tsx                  # Settings page
├── upgrade/
│   └── page.tsx                  # Paywall/upgrade page
├── reports/
│   └── page.tsx                  # Reports view (Premium)
├── calendar/
│   └── page.tsx                  # Calendar view (Premium, requires auth)
├── coaching-summary/
│   └── page.tsx                  # Coaching summary (Premium, requires auth)
├── resources/
│   └── page.tsx                  # Resource library
├── history/
│   └── page.tsx                  # Session history
├── cancel-subscription/
│   └── page.tsx                  # Cancel subscription (requires auth)
├── privacy/
│   └── page.tsx                  # Privacy policy (static)
├── terms/
│   └── page.tsx                  # Terms of service (static)
├── subscription-terms/
│   └── page.tsx                  # Subscription terms (static)
├── cookies/
│   └── page.tsx                  # Cookie policy (static)
├── disclaimer/
│   └── page.tsx                  # Disclaimer (static)
└── support/
    └── page.tsx                  # Support page
```

### Route Groups (Optional Organization)

```
app/
├── (auth)/
│   ├── login/
│   ├── forgot-password/
│   ├── reset-password/
│   └── confirm-email/
├── (dashboard)/
│   ├── page.tsx                 # Dashboard
│   ├── practice/
│   ├── feedback/
│   ├── scenarios/
│   ├── reports/
│   ├── calendar/
│   └── coaching-summary/
├── (legal)/
│   ├── privacy/
│   ├── terms/
│   ├── subscription-terms/
│   ├── cookies/
│   └── disclaimer/
└── (settings)/
    ├── settings/
    ├── cancel-subscription/
    └── support/
```

---

## Hook Analysis: Client vs Server-Side

### ✅ Client-Side Only Hooks (Keep as-is, add 'use client')

**Reason:** Use browser APIs, localStorage, or React state

1. **`useAppRouter.ts`** → **DELETE** (replaced by Next.js routing)
   - Next.js handles routing natively
   - Can use `useRouter()` and `usePathname()` from `next/navigation`

2. **`useAppState.ts`** → **CLIENT** (`'use client'`)
   - Manages local component state (sessions, currentPatient, etc.)
   - Uses `useState`, `useEffect`

3. **`useAuthCallback.ts`** → **CLIENT** (`'use client'`)
   - Handles URL query params (`access_token`, `type`)
   - Uses `window.location.search`

4. **`useStripeCallback.ts`** → **CLIENT** (`'use client'`)
   - Handles Stripe redirect callbacks (`session_id`)
   - Uses `window.location.search`

5. **`useSpeechRecognition.ts`** → **CLIENT** (`'use client'`)
   - Uses browser `navigator.mediaDevices` API
   - Requires browser environment

6. **`useOnlineSync.ts`** → **CLIENT** (`'use client'`)
   - Uses `navigator.onLine` API
   - Monitors network connectivity

7. **`useXP.ts`** → **CLIENT** (`'use client'`)
   - Uses `localStorage` for offline fallback
   - Manages client-side XP state
   - **KEEP:** North Star Logic already integrated ✅

8. **`useBadges.ts`** → **CLIENT** (`'use client'`)
   - Uses `localStorage` for offline fallback
   - Manages badge unlock state

9. **`useStreak.ts`** → **CLIENT** (`'use client'`)
   - Uses `localStorage` for offline fallback
   - Manages streak state

10. **`useTierManager.ts`** → **CLIENT** (`'use client'`)
    - Manages tier state with server verification
    - Can be enhanced with Next.js Server Actions

11. **`useSessionManager.ts`** → **CLIENT** (`'use client'`)
    - Manages session CRUD operations
    - Uses `localStorage` for offline fallback

12. **`useReportData.ts`** → **CLIENT** (`'use client'`)
    - Processes session data for reports
    - Client-side calculations

13. **`useSetupCheck.ts`** → **CLIENT** (`'use client'`)
    - Checks backend health/configuration
    - Uses `fetch` API

### 🔄 Convertible to Server Actions/API Routes

**Reason:** Can be server-side for better performance and security

1. **`services/databaseService.ts`** → **SERVER ACTIONS**
   - `getUserProfile()` → Server Action
   - `getUserSessions()` → Server Action
   - `saveSession()` → Server Action
   - `getSessionCount()` → Server Action
   - `updateUserTier()` → Server Action

2. **`services/stripeService.ts`** → **SERVER ACTIONS**
   - `createCheckoutSession()` → Server Action (can call Edge Function or handle directly)
   - Edge Function calls can be replaced with Server Actions

3. **`services/subscriptionService.ts`** → **SERVER ACTIONS**
   - `canStartSession()` → Server Action
   - Session counting logic → Server Action

4. **`services/geminiService.ts`** → **SERVER ACTIONS**
   - AI feedback generation → Server Action
   - Coaching summary generation → Server Action

### 🆕 New Server Components/Server Actions Needed

1. **`app/actions/auth.ts`** - Server Actions for auth
   ```typescript
   'use server'
   export async function signIn(email: string, password: string) { ... }
   export async function signUp(email: string, password: string) { ... }
   export async function signOut() { ... }
   ```

2. **`app/actions/sessions.ts`** - Server Actions for sessions
   ```typescript
   'use server'
   export async function getSessions(userId: string) { ... }
   export async function saveSession(session: Session, userId: string) { ... }
   ```

3. **`app/actions/subscription.ts`** - Server Actions for subscriptions
   ```typescript
   'use server'
   export async function createCheckoutSession(plan: 'monthly' | 'annual') { ... }
   export async function verifyTier(userId: string) { ... }
   ```

4. **`app/actions/feedback.ts`** - Server Actions for AI feedback
   ```typescript
   'use server'
   export async function generateFeedback(transcript: ChatMessage[]) { ... }
   export async function generateCoachingSummary(sessionIds: string[]) { ... }
   ```

---

## Next.js Boilerplate Setup

### 1. Initialize Next.js Project

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Key Decisions:**
- ✅ Use App Router (not Pages Router)
- ✅ TypeScript enabled
- ✅ Tailwind CSS (already using)
- ✅ No `src/` directory (keep current structure)
- ✅ Import alias `@/*` (matches current `vite.config.ts`)

### 2. Update `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@supabase/ssr": "^0.5.0",  // NEW: For Next.js SSR support
    // ... keep existing dependencies
  }
}
```

### 3. Create Root Layout (`app/layout.tsx`)

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { CookieConsent } from '@/components/ui/CookieConsent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MI Mastery',
  description: 'Motivational Interviewing training with AI-powered patient simulations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <OfflineIndicator />
            {children}
            <CookieConsent />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 4. Create Global CSS (`app/globals.css`)

```css
/* Import existing styles */
@import '../index.css';
@import '../styles/theme.css';
@import '../styles/design-tokens.css';
```

### 5. Update Supabase Client for Next.js (`lib/supabase.ts`)

```typescript
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Browser client (for client components)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server client (for server components/actions)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle error
          }
        },
      },
    }
  );
}
```

### 6. Environment Variables (`.env.local`)

```bash
# Next.js uses NEXT_PUBLIC_ prefix for client-side vars
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# Server-only vars (no NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=your_gemini_key
STRIPE_SECRET_KEY=your_stripe_secret
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1)

**Goal:** Set up Next.js boilerplate and migrate static routes

1. ✅ Initialize Next.js project
2. ✅ Set up root layout and global styles
3. ✅ Migrate Supabase client to use `@supabase/ssr`
4. ✅ Migrate static legal pages (Privacy, Terms, etc.)
5. ✅ Set up authentication context for Next.js

**Deliverables:**
- Next.js app running locally
- Static pages working
- Auth context integrated

### Phase 2: Core Routes (Week 2)

**Goal:** Migrate main application routes

1. ✅ Migrate Dashboard (`/`)
2. ✅ Migrate Login/Auth flows (`/login`, `/forgot-password`, etc.)
3. ✅ Migrate Settings (`/settings`)
4. ✅ Migrate Paywall (`/upgrade`)
5. ✅ Set up middleware for auth protection

**Deliverables:**
- Core routes functional
- Auth flows working
- Protected routes implemented

### Phase 3: Practice & Feedback (Week 2-3)

**Goal:** Migrate practice session flows

1. ✅ Migrate Practice view (`/practice`)
2. ✅ Migrate Feedback view (`/feedback`)
3. ✅ Migrate Scenario Selection (`/scenarios`)
4. ✅ Convert AI feedback generation to Server Actions
5. ✅ Migrate session management

**Deliverables:**
- Practice flow end-to-end
- AI feedback generation working
- Session persistence working

### Phase 4: Premium Features (Week 3)

**Goal:** Migrate premium-only features

1. ✅ Migrate Reports (`/reports`)
2. ✅ Migrate Calendar (`/calendar`)
3. ✅ Migrate Coaching Summary (`/coaching-summary`)
4. ✅ Migrate Cancel Subscription (`/cancel-subscription`)
5. ✅ Convert subscription management to Server Actions

**Deliverables:**
- All premium features working
- Subscription management functional

### Phase 5: Polish & Deploy (Week 4)

**Goal:** Finalize migration and deploy

1. ✅ Remove old Vite config and dependencies
2. ✅ Update PWA manifest for Next.js
3. ✅ Test all routes and flows
4. ✅ Performance optimization
5. ✅ Deploy to production

**Deliverables:**
- Migration complete
- Production deployment
- Documentation updated

---

## Key Considerations

### 1. Authentication Flow

**Current:** Client-side Supabase auth with `AuthContext`

**Next.js Approach:**
- Use `@supabase/ssr` for server-side auth
- Create middleware for route protection
- Server Actions for auth operations
- Keep `AuthContext` for client-side state management

**Middleware Example (`middleware.ts`):**
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes that require authentication
  if (!user && request.nextUrl.pathname.startsWith('/practice')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/practice/:path*', '/feedback/:path*', '/scenarios/:path*'],
};
```

### 2. State Management

**Current:** `App.tsx` manages all global state

**Next.js Approach:**
- Move session data fetching to Server Components
- Use Server Actions for mutations
- Keep client-side state in hooks (XP, badges, streaks)
- Use React Context for shared client state

**Example Server Component:**
```typescript
// app/page.tsx (Dashboard)
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserSessions } from '@/app/actions/sessions';
import Dashboard from '@/components/views/Dashboard';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const sessions = user ? await getUserSessions(user.id) : [];
  
  return <Dashboard sessions={sessions} user={user} />;
}
```

### 3. PWA Support

**Current:** Vite PWA plugin with Workbox

**Next.js Approach:**
- Use `next-pwa` package
- Configure in `next.config.js`
- Keep service worker for offline support
- Update manifest.json

**`next.config.js` Example:**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // Next.js config
});
```

### 4. Environment Variables

**Migration:**
- `VITE_*` → `NEXT_PUBLIC_*` (client-side)
- Server-only vars stay without prefix
- Update all `import.meta.env` → `process.env`

**Find & Replace:**
```bash
# Find all VITE_ references
grep -r "VITE_" --include="*.ts" --include="*.tsx"

# Replace import.meta.env.VITE_* with process.env.NEXT_PUBLIC_*
```

### 5. Code Splitting

**Current:** React.lazy() for view components

**Next.js Approach:**
- Next.js automatically code-splits by route
- Use dynamic imports for heavy components
- Server Components reduce bundle size

**Example:**
```typescript
// app/reports/page.tsx
import dynamic from 'next/dynamic';

const ReportsView = dynamic(() => import('@/components/views/ReportsView'), {
  loading: () => <PageLoader />,
});
```

### 6. API Routes vs Edge Functions

**Decision:** Keep Supabase Edge Functions for:
- Stripe webhook handling
- Complex serverless operations

**Use Next.js API Routes/Server Actions for:**
- Simple CRUD operations
- Data fetching
- Form submissions

---

## File Structure After Migration

```
app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Dashboard
├── globals.css                   # Global styles
├── actions/                      # Server Actions
│   ├── auth.ts
│   ├── sessions.ts
│   ├── subscription.ts
│   └── feedback.ts
├── (auth)/                       # Auth route group
│   ├── login/
│   ├── forgot-password/
│   └── ...
├── (dashboard)/                  # Dashboard route group
│   ├── practice/
│   ├── feedback/
│   └── ...
└── api/                          # API routes (if needed)
    └── webhooks/
        └── stripe/
            └── route.ts

components/                       # Keep existing structure
hooks/                            # Keep existing hooks (add 'use client')
services/                         # Keep, convert to Server Actions
lib/                              # Update Supabase client
utils/                            # Keep as-is (including northStarLogic.ts ✅)
```

---

## Testing Checklist

### Pre-Migration
- [ ] Document all current routes and their behavior
- [ ] List all hooks and their dependencies
- [ ] Identify all API calls and data fetching
- [ ] Test current Vite app thoroughly

### During Migration
- [ ] Each route works identically to Vite version
- [ ] Auth flows work correctly
- [ ] Protected routes redirect properly
- [ ] Server Actions work as expected
- [ ] Client-side hooks still function
- [ ] PWA features work offline

### Post-Migration
- [ ] All routes accessible
- [ ] No console errors
- [ ] Performance metrics acceptable
- [ ] SEO improvements verified
- [ ] Production deployment successful

---

## Risks & Mitigation

### Risk 1: Breaking Changes During Migration
**Mitigation:** Migrate incrementally, keep Vite app running in parallel

### Risk 2: State Management Complexity
**Mitigation:** Use Server Components for data fetching, keep client hooks for UI state

### Risk 3: PWA Functionality
**Mitigation:** Test offline functionality thoroughly, use `next-pwa` package

### Risk 4: Performance Regression
**Mitigation:** Monitor bundle sizes, use Next.js code splitting, optimize images

### Risk 5: Supabase Integration
**Mitigation:** Use `@supabase/ssr` package, test auth flows extensively

---

## Success Metrics

- ✅ All 18 routes migrated and functional
- ✅ Auth flows working identically
- ✅ Server-side rendering working
- ✅ Performance metrics maintained or improved
- ✅ PWA features functional
- ✅ Zero breaking changes for end users

---

## Next Steps

1. **Review & Approve:** Get stakeholder sign-off on migration plan
2. **Sprint Planning:** Break down into sprint tasks
3. **Setup:** Initialize Next.js project in parallel branch
4. **Phase 1 Start:** Begin foundation setup

---

## Questions for Product/Engineering

1. **Timeline:** Is 3-4 weeks acceptable, or need faster migration?
2. **Parallel Development:** Should we keep Vite app running during migration?
3. **Feature Freeze:** Do we pause new features during migration?
4. **Testing:** What level of testing is required before production?
5. **Rollback Plan:** What's the rollback strategy if migration fails?

---

**Architect Notes:**
- North Star Logic (`utils/northStarLogic.ts`) is already Next.js-ready ✅
- Most hooks can stay client-side with `'use client'` directive
- Server Actions will improve performance for data fetching
- File-based routing will simplify navigation logic
- Migration can be done incrementally without breaking current app

**Status:** ✅ **BLUEPRINT COMPLETE - READY FOR SPRINT PLANNING**
