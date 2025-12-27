# Project Overview - MI Practice Coach

**Status:** Production  
**Last Updated:** 2025-12-26

---

## 🎯 Project Purpose

MI Practice Coach helps healthcare professionals practice Motivational Interviewing (MI) skills through AI-powered patient conversations and detailed feedback.

**Core Features:**
- AI patient simulation (Gemini AI)
- Post-session feedback with empathy scoring
- Multi-session coaching summaries
- Gamification (badges, XP, levels, streaks)
- Freemium subscription model

---

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Entry:** `index.tsx` → `App.tsx`
- **Routing:** View-based (no React Router, custom `useAppRouter` hook)
- **State:** React hooks + Context API (AuthContext)
- **Styling:** Tailwind CSS + CSS Variables

### Backend (Supabase)
- **Auth:** Supabase Auth (email/password)
- **Database:** PostgreSQL via Supabase
- **Functions:** Deno Edge Functions (TypeScript)
- **Storage:** Not used (all data in database)

### External Services
- **AI:** Google Gemini API (via Edge Functions)
- **Payments:** Stripe (Checkout + Webhooks)

---

## ⚠️ Chaotic Vibes (Issues That Need Attention)

### 🔴 Critical Issues

**1. Timezone Inconsistency**
- **Location:** `agents/gamification.md` vs `hooks/useStreak.ts`
- **Problem:** 
  - Agent docs say streaks use UTC
  - Actual implementation uses LOCAL timezone
- **Impact:** Streaks break at local midnight, not UTC midnight
- **Fix Needed:** Update agent docs OR standardize on one timezone

**2. XP Awards Not Using Constants**
- **Location:** `hooks/useSessionManager.ts` lines 234-249
- **Problem:** 
  - Hardcoded XP values (10, 5, 10) instead of `XP_AWARDS` constants
  - `XP_AWARDS.STREAK_DAY_BONUS` and `XP_AWARDS.BADGE_UNLOCK` defined but never used
- **Impact:** Inconsistent XP awards, harder to maintain
- **Fix Needed:** Refactor to use `XP_AWARDS` constants

**3. Skill Badges Missing**
- **Location:** `agents/gamification.md` vs `constants.ts`
- **Problem:** 
  - Agent docs mention 6 skill badges (Reflective Listener, Question Crafter, etc.)
  - `constants.ts` only has streak and milestone badges
- **Impact:** Incomplete feature, misleading documentation
- **Fix Needed:** Either implement skill badges OR remove from docs

### 🟡 Moderate Issues

**4. Dual Sync Queue Systems**
- **Location:** `hooks/useBadges.ts` vs `utils/syncQueue.ts`
- **Problem:** 
  - Badges use `BADGE_SYNC_QUEUE_KEY` (localStorage)
  - XP/Streaks use `SYNC_QUEUE_KEY` (localStorage)
  - Different patterns, different retry logic
- **Impact:** Code duplication, inconsistent behavior
- **Fix Needed:** Unify sync queue system OR document why they're separate

**5. Badge Unlock XP Not Awarded**
- **Location:** `hooks/useBadges.ts` `checkAndUnlockBadges`
- **Problem:** 
  - `XP_AWARDS.BADGE_UNLOCK = 25` is defined
  - Badge unlock doesn't call `addXP(25, 'Badge unlocked')`
- **Impact:** Users don't get XP for badges (feature incomplete)
- **Fix Needed:** Add XP award when badge unlocks

**6. Streak Day Bonus XP Not Implemented**
- **Location:** `hooks/useSessionManager.ts` XP award logic
- **Problem:** 
  - `XP_AWARDS.STREAK_DAY_BONUS = 2` is defined
  - No code awards `currentStreak * 2` XP
- **Impact:** Missing gamification feature
- **Fix Needed:** Add streak bonus to XP calculation

### 🟢 Minor Issues

**7. Agent Documentation Outdated**
- **Location:** `agents/gamification.md`
- **Problem:** 
  - Lists files that don't exist (`useUserProgress.ts`)
  - Implementation status checklist is outdated
- **Impact:** Misleading for AI agents
- **Fix Needed:** Update agent docs to match reality

**8. Duplicate XP Award Prevention**
- **Location:** `hooks/useSessionManager.ts` lines 231-260
- **Problem:** 
  - Uses `XP_AWARDED_KEY` localStorage to prevent duplicates
  - But session IDs are UUIDs, so duplicates unlikely anyway
- **Impact:** Unnecessary complexity
- **Fix Needed:** Simplify or document why needed

---

## 🗺️ Data Flow Patterns

### Gamification Flow (Session Complete)

```
PracticeView.tsx
  ↓ (session ends)
useSessionManager.saveNewSession()
  ↓
1. Save session to Supabase + localStorage
2. updateStreak() → useStreak.updateStreak()
   - Updates profiles.current_streak
   - Queues if Supabase fails
3. addXP() → useXP.addXP()
   - Updates profiles.current_xp
   - Queues if Supabase fails
4. checkAndUnlockBadges() → useBadges.checkAndUnlockBadges()
   - Checks streak + totalSessions
   - Inserts into user_badges table
   - Queues if Supabase fails
```

### Offline-First Pattern

**All gamification hooks follow this pattern:**

1. **Optimistic Update:** Update React state immediately
2. **localStorage Save:** Always save to localStorage (works offline)
3. **Supabase Sync:** Try to sync to Supabase
4. **Queue on Failure:** If Supabase fails, queue for retry
5. **Retry on Load:** When hook loads, process queue first

**Example:** `useXP.addXP()`
```typescript
setCurrentXP(newXP);                    // 1. Optimistic
saveToLocalStorage(newXP);              // 2. localStorage
await saveToSupabase(user.id, newXP);  // 3. Supabase (queues on fail)
```

---

## 🔌 Component → Hook → Database Map

### BadgeDisplay.tsx
```
BadgeDisplay
  ↓ uses
useBadges()
  ↓ reads
user_badges table (Supabase)
  ↓ fallback
localStorage (mi-coach-badges)
```

**Key Methods:**
- `unlockedBadges` - Array of unlocked badges
- `checkAndUnlockBadges(context)` - Unlock badges based on streak/sessions
- `markBadgeAsSeen(badgeId)` - Mark badge as seen

### LevelProgress.tsx
```
LevelProgress
  ↓ uses
useXP()
  ↓ reads
profiles.current_xp (Supabase)
  ↓ fallback
localStorage (mi-coach-xp)
```

**Key Methods:**
- `currentXP` - Total XP points
- `currentLevel` - Level 1-4 (calculated from XP)
- `addXP(amount, reason)` - Add XP (queues if offline)

### StreakCounter.tsx
```
StreakCounter
  ↓ uses
useStreak()
  ↓ reads
profiles.current_streak, longest_streak, last_practice_date (Supabase)
  ↓ fallback
localStorage (mi-coach-streak)
```

**Key Methods:**
- `currentStreak` - Consecutive days practiced
- `updateStreak()` - Called after session completes
- `processQueue()` - Sync queued streak updates

---

## 📊 Database Schema

### `profiles` Table
```sql
user_id uuid PRIMARY KEY
tier text ('free' | 'premium')
current_xp int4 DEFAULT 0
current_streak int4 DEFAULT 0
longest_streak int4 DEFAULT 0
last_practice_date date
created_at timestamptz
updated_at timestamptz
```

### `user_badges` Table
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
badge_id text (references constants.ts BADGES)
unlocked_at timestamptz
seen boolean DEFAULT false
UNIQUE(user_id, badge_id)
```

### `sessions` Table
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
session_data jsonb (Session object)
created_at timestamptz
```

---

## 🎮 Gamification Constants

**XP Levels** (`constants.ts`):
- Level 1: Curious Beginner (0-99 XP)
- Level 2: Engaged Learner (100-499 XP)
- Level 3: Skilled Practitioner (500-1499 XP)
- Level 4: MI Champion (1500+ XP)

**XP Awards** (`constants.ts`):
- `SESSION_COMPLETE: 10` ✅ Used
- `SCORE_70_PLUS_BONUS: 5` ✅ Used
- `SCORE_90_PLUS_BONUS: 10` ✅ Used
- `STREAK_DAY_BONUS: 2` ❌ NOT USED
- `BADGE_UNLOCK: 25` ❌ NOT USED

**Badges** (`constants.ts`):
- Streak: 3, 7, 30, 90 days ✅ Implemented
- Milestone: 1, 10, 50, 100 sessions ✅ Implemented
- Skill: (6 badges mentioned in docs) ❌ NOT IMPLEMENTED

---

## 🔄 Sync Queue System

**Two Separate Systems:**

1. **Main Sync Queue** (`utils/syncQueue.ts`)
   - Used by: `useXP`, `useStreak`
   - Storage: `mi-coach-sync-queue` (localStorage)
   - Types: `'xp' | 'streak'`
   - Retry logic: Exponential backoff, max 5 retries

2. **Badge Sync Queue** (`hooks/useBadges.ts`)
   - Used by: `useBadges`
   - Storage: `mi-coach-badge-sync-queue` (localStorage)
   - Retry logic: Simple retry on hook load

**Why Separate?**
- Badge queue stores full badge data
- Main queue stores deltas/operations
- Different retry strategies

**Recommendation:** Consider unifying, but document the difference if keeping separate.

---

## 🚨 Breaking Changes Risk

**High Risk Areas:**

1. **Timezone Changes**
   - Changing streak timezone logic could break existing streaks
   - Users expect streaks to reset at local midnight

2. **XP Calculation Changes**
   - Changing XP awards could make users lose progress
   - Need migration strategy if changing level thresholds

3. **Badge System Changes**
   - Adding/removing badges could break existing unlocks
   - Badge IDs are stored in database, must be stable

---

## 📝 Recommendations

### Immediate Fixes (High Priority)
1. ✅ Fix timezone documentation inconsistency
2. ✅ Refactor XP awards to use constants
3. ✅ Add badge unlock XP award
4. ✅ Add streak day bonus XP

### Short-Term Improvements
1. Implement skill badges OR remove from docs
2. Unify sync queue systems OR document separation
3. Update agent documentation

### Long-Term Considerations
1. Add migration path for XP/level changes
2. Add analytics for gamification engagement
3. Consider leaderboards (streak-based)

---

**Last Updated:** 2025-12-26  
**Next Review:** After gamification fixes
