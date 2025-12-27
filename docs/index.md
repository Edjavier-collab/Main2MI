# MI Practice Coach - Master Documentation Index

**Welcome, AI Agents!** 👋

This is your master entry point to understand the MI Practice Coach codebase. Use this as your navigation guide.

---

## 🎯 Quick Start

**What is this project?**
- React-based Motivational Interviewing training app
- Uses Google Gemini AI for patient simulation and feedback
- Freemium model with Stripe payments
- Supabase for auth, database, and Edge Functions
- PWA-enabled for offline use

**Key Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Supabase (Auth, Database, Edge Functions)
- Payments: Stripe
- AI: Google Gemini
- Styling: Tailwind CSS + CSS Variables

---

## 📚 Core Documentation

### [Project Overview](./project-overview.md)
**Start here!** High-level architecture, known issues, and "chaotic vibes" that need attention.

### [Gamification System](./gamification.md)
Deep dive into badges, XP, levels, and streaks. How components talk to hooks and database.

---

## 🗂️ Project Structure

```
Main2MI/
├── components/          # React components
│   ├── views/           # Page-level components (Dashboard, Practice, etc.)
│   ├── ui/              # Reusable UI components
│   └── gamification/    # BadgeDisplay, LevelProgress, StreakCounter
├── hooks/               # Custom React hooks
│   ├── useBadges.ts     # Badge unlock tracking
│   ├── useXP.ts         # XP and level management
│   └── useStreak.ts     # Streak tracking
├── services/            # Business logic
│   ├── databaseService.ts
│   ├── geminiService.ts
│   └── stripeService.ts
├── contexts/            # React contexts (AuthContext)
├── types.ts             # TypeScript type definitions
├── constants.ts         # XP levels, badges, awards
└── supabase/
    ├── functions/       # Edge Functions
    └── migrations/      # Database migrations
```

---

## 🔍 Key Systems

### Authentication & User Management
- **File:** `contexts/AuthContext.tsx`
- **Database:** `profiles` table (Supabase)
- **Features:** Sign up, sign in, password reset, tier management

### Gamification
- **Components:** `components/gamification/`
- **Hooks:** `hooks/useBadges.ts`, `hooks/useXP.ts`, `hooks/useStreak.ts`
- **Database:** 
  - `profiles` table (XP, streaks)
  - `user_badges` table (badge unlocks)
- **See:** [Gamification System](./gamification.md)

### Practice Sessions
- **Component:** `components/views/PracticeView.tsx`
- **Storage:** `sessions` table (Supabase) + localStorage fallback
- **AI:** Gemini AI via `analyze-session` Edge Function

### Payments & Subscriptions
- **Service:** `services/stripeService.ts`
- **Edge Functions:** `create-checkout-session`, `stripe-webhook`
- **Tiers:** Free (3 sessions/month) vs Premium (unlimited)

---

## 🗄️ Database Schema

### Core Tables

**`profiles`**
- `user_id` (uuid, PK)
- `tier` (text: 'free' | 'premium')
- `current_xp` (int4) - Gamification
- `current_streak` (int4) - Gamification
- `longest_streak` (int4) - Gamification
- `last_practice_date` (date) - Gamification

**`user_badges`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `badge_id` (text) - References `constants.ts` BADGES
- `unlocked_at` (timestamptz)
- `seen` (boolean)

**`sessions`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `session_data` (jsonb) - Full session transcript + feedback
- `created_at` (timestamptz)

---

## 🎨 Design System

**Theme:** Growth Garden
- Primary: Sage green (#87A878)
- Colors via CSS variables (see `styles/theme.css`)
- Plant/growth metaphors throughout UI

**Styling:**
- Tailwind CSS utility classes
- CSS custom properties for theming
- `.tile-hover` utility class for card hover effects

---

## 🚀 Development

**Start Dev Server:**
```bash
npm run dev
```

**Deploy Edge Functions:**
```bash
supabase functions deploy
```

**Environment Variables:**
- `VITE_GEMINI_API_KEY` - Gemini AI
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

---

## 📖 For AI Agents

**When working on this codebase:**

1. **Read `docs/project-overview.md` first** - Understand the architecture and known issues
2. **Check `docs/gamification.md`** - If working on badges/XP/streaks
3. **Reference `types.ts`** - All TypeScript interfaces are here
4. **Check `constants.ts`** - XP levels, badges, awards are defined here
5. **Follow existing patterns** - Look at similar components/hooks for consistency

**Common Patterns:**
- Offline-first: localStorage fallback + Supabase sync
- Optimistic updates: Update UI immediately, sync in background
- Error handling: Graceful degradation, don't break user flow
- TypeScript strict mode: No `any` types

---

## 🔗 External Resources

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [React Docs](https://react.dev)

---

**Last Updated:** 2025-12-26  
**Maintained By:** Javi
