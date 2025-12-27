# Gamification System - Deep Dive

**Last Updated:** 2025-12-26  
**Status:** Production (with known issues)

---

## 🎯 Overview

The gamification system motivates users through:
- **XP & Levels** - Progress tracking (4 levels)
- **Badges** - Achievement unlocks (8 badges)
- **Streaks** - Daily practice tracking

All systems use **offline-first** architecture with Supabase sync.

---

## 🧩 Component Architecture

### BadgeDisplay.tsx

**Purpose:** Display user's unlocked badges in a grid

**Props:**
- `showAll?: boolean` - Show locked badges too (grayed out)
- `maxDisplay?: number` - Limit number shown
- `className?: string` - Additional CSS classes

**Data Flow:**
```
BadgeDisplay
  ↓ calls
useBadges()
  ↓ returns
unlockedBadges: UnlockedBadge[]
  ↓ renders
Grid of badge cards (locked/unlocked states)
```

**Key Features:**
- Click unlocked badge → Shows detail panel
- Locked badges show lock icon
- Loading skeleton while fetching
- Empty state when no badges

**Database Interaction:**
- Reads: `user_badges` table (via `useBadges` hook)
- Fallback: `localStorage` (`mi-coach-badges`)

---

### LevelProgress.tsx

**Purpose:** Show current level, XP, and progress bar

**Props:**
- `showXPNumbers?: boolean` - Show XP counts
- `compact?: boolean` - Compact horizontal layout
- `className?: string` - Additional CSS classes

**Data Flow:**
```
LevelProgress
  ↓ calls
useXP()
  ↓ returns
{
  currentXP: number
  currentLevel: number (1-4)
  levelName: string
  xpToNextLevel: number
  xpProgress: number (0-100%)
}
  ↓ renders
Level icon + name + progress bar
```

**Key Features:**
- Visual level icons (🌱 🌿 🌳 🏆)
- Progress bar with percentage
- Max level indicator
- Compact mode for headers

**Database Interaction:**
- Reads: `profiles.current_xp` (via `useXP` hook)
- Fallback: `localStorage` (`mi-coach-xp`)

---

### StreakCounter.tsx

**Purpose:** Display current practice streak

**Props:**
- `showLongest?: boolean` - Show "Best: X" below current
- `className?: string` - Additional CSS classes

**Data Flow:**
```
StreakCounter
  ↓ calls
useStreak()
  ↓ returns
{
  currentStreak: number
  longestStreak: number
  isLoading: boolean
}
  ↓ renders
🔥 + streak number
```

**Key Features:**
- Fire emoji (grayscale if streak = 0)
- Hover animation
- Optional longest streak display
- Loading skeleton

**Database Interaction:**
- Reads: `profiles.current_streak`, `longest_streak`, `last_practice_date` (via `useStreak` hook)
- Fallback: `localStorage` (`mi-coach-streak`)

---

## 🔌 Hook Architecture

### useBadges Hook

**File:** `hooks/useBadges.ts`

**Purpose:** Manage badge unlocks and display

**Returns:**
```typescript
{
  unlockedBadges: UnlockedBadge[]      // All unlocked badges
  newlyUnlockedBadges: UnlockedBadge[]  // Unseen badges
  checkAndUnlockBadges(context): Promise<BadgeDefinition[]>
  markBadgeAsSeen(badgeId): Promise<void>
  markAllBadgesAsSeen(): Promise<void>
  isLoading: boolean
}
```

**Database Operations:**

1. **Load Badges** (`loadFromSupabase`)
   ```typescript
   SELECT badge_id, unlocked_at, seen
   FROM user_badges
   WHERE user_id = ?
   ORDER BY unlocked_at DESC
   ```

2. **Unlock Badge** (`saveBadgeToSupabase`)
   ```typescript
   INSERT INTO user_badges (user_id, badge_id, unlocked_at, seen)
   VALUES (?, ?, ?, false)
   ```

3. **Mark as Seen** (`markBadgeAsSeen`)
   ```typescript
   UPDATE user_badges
   SET seen = true
   WHERE user_id = ? AND badge_id = ?
   ```

**Offline Handling:**
- Badge sync queue: `mi-coach-badge-sync-queue` (localStorage)
- Retries on hook load if Supabase was unavailable
- Merges queued badges into local state

**Badge Unlock Logic:**
```typescript
checkAndUnlockBadges({ streak, totalSessions })
  ↓
1. Filter badges by category (streak | milestone)
2. Check if requirement met (streak >= requirement OR totalSessions >= requirement)
3. Filter out already unlocked badges
4. Insert new badges into user_badges table
5. Update local state optimistically
```

---

### useXP Hook

**File:** `hooks/useXP.ts`

**Purpose:** Manage XP points and level calculation

**Returns:**
```typescript
{
  currentXP: number
  currentLevel: number (1-4)
  levelName: string
  xpToNextLevel: number
  xpProgress: number (0-100%)
  addXP(amount, reason): Promise<void>
  processQueue(): Promise<void>
  isLoading: boolean
}
```

**Database Operations:**

1. **Load XP** (`loadFromSupabase`)
   ```typescript
   SELECT current_xp
   FROM profiles
   WHERE user_id = ?
   ```

2. **Save XP** (`saveToSupabase`)
   ```typescript
   UPDATE profiles
   SET current_xp = ?, updated_at = ?
   WHERE user_id = ?
   ```

**Level Calculation:**
```typescript
getLevelFromXP(xp)
  ↓
Find highest XP_LEVELS entry where xp >= minXP
  ↓
Returns: { level, name, minXP, maxXP }
```

**XP Progress Calculation:**
```typescript
getXPProgress(xp)
  ↓
1. Get current level
2. Get next level threshold
3. Calculate: (xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP) * 100
```

**Offline Handling:**
- Sync queue: `mi-coach-sync-queue` (localStorage)
- Stores XP deltas (not absolute values)
- Retries with exponential backoff
- On sync, reads current server XP and adds delta

**XP Award Flow:**
```typescript
addXP(amount, reason)
  ↓
1. Calculate newXP = currentXP + amount
2. Update state optimistically
3. Save to localStorage
4. Try to save to Supabase
5. If Supabase fails, queue delta for retry
```

---

### useStreak Hook

**File:** `hooks/useStreak.ts`

**Purpose:** Track consecutive practice days

**Returns:**
```typescript
{
  currentStreak: number
  longestStreak: number
  lastPracticeDate: Date | null
  updateStreak(): Promise<number>
  processQueue(): Promise<void>
  isLoading: boolean
}
```

**Database Operations:**

1. **Load Streak** (`loadFromSupabase`)
   ```typescript
   SELECT current_streak, longest_streak, last_practice_date
   FROM profiles
   WHERE user_id = ?
   ```

2. **Update Streak** (`saveToSupabase`)
   ```typescript
   UPDATE profiles
   SET current_streak = ?, longest_streak = ?, last_practice_date = ?, updated_at = ?
   WHERE user_id = ?
   ```

**Streak Calculation Logic:**
```typescript
updateStreak()
  ↓
1. Get today's date (LOCAL timezone, YYYY-MM-DD)
2. Check if already practiced today → return current streak
3. Check if practiced yesterday (LOCAL timezone)
   - If yes: newStreak = currentStreak + 1
   - If no: newStreak = 1 (reset)
4. Update longestStreak = max(longestStreak, newStreak)
5. Save to database
```

**⚠️ Important:** Uses **LOCAL timezone** (not UTC)
- Streaks reset at local midnight
- `last_practice_date` stored as `date` type (YYYY-MM-DD)
- Date comparisons done in local timezone

**Streak Validation:**
```typescript
validateStreak(data)
  ↓
1. Check if lastPracticeDate is today or yesterday (LOCAL)
2. If not → reset currentStreak to 0
3. Keep longestStreak unchanged
```

**Offline Handling:**
- Sync queue: `mi-coach-sync-queue` (localStorage)
- Stores full streak state (not delta)
- Replaces existing streak operation (only latest matters)
- Retries with exponential backoff

---

## 🔄 Integration Points

### Session Completion Flow

**Location:** `hooks/useSessionManager.ts`

**When a session completes:**

```typescript
saveNewSession(transcript, feedback, patient)
  ↓
1. Save session to Supabase + localStorage
2. updateStreak() → useStreak.updateStreak()
   - Calculates new streak based on last practice date
   - Updates profiles table
3. addXP() → useXP.addXP()
   - Awards base XP (10) + bonus for empathy score
   - Updates profiles.current_xp
4. checkAndUnlockBadges() → useBadges.checkAndUnlockBadges()
   - Checks streak badges (currentStreak >= requirement)
   - Checks milestone badges (totalSessions >= requirement)
   - Inserts new badges into user_badges table
```

**XP Award Logic:**
```typescript
// Base XP
let xpAmount = 10;  // ⚠️ Should use XP_AWARDS.SESSION_COMPLETE

// Empathy score bonus
if (empathyScore >= 4.5) {
  xpAmount += 10;  // ⚠️ Should use XP_AWARDS.SCORE_90_PLUS_BONUS
} else if (empathyScore >= 3.5) {
  xpAmount += 5;   // ⚠️ Should use XP_AWARDS.SCORE_70_PLUS_BONUS
}

// ⚠️ Missing: Streak day bonus (XP_AWARDS.STREAK_DAY_BONUS)
// ⚠️ Missing: Badge unlock XP (XP_AWARDS.BADGE_UNLOCK)
```

---

## 📊 Database Schema

### `profiles` Table (Gamification Columns)

```sql
-- XP System
current_xp int4 DEFAULT 0
  -- Total experience points
  -- Used to calculate level (1-4)

-- Streak System
current_streak int4 DEFAULT 0
  -- Current consecutive days practiced
  -- Resets if gap > 1 day

longest_streak int4 DEFAULT 0
  -- Best streak ever achieved
  -- Never resets

last_practice_date date
  -- Date of last completed session (YYYY-MM-DD)
  -- Stored in LOCAL timezone (not UTC)
  -- Used to calculate streak continuation
```

### `user_badges` Table

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
badge_id text NOT NULL
  -- References constants.ts BADGES array
  -- Format: 'streak-3', 'sessions-10', etc.
unlocked_at timestamptz NOT NULL DEFAULT now()
seen boolean NOT NULL DEFAULT false
  -- Whether user has acknowledged the badge
UNIQUE(user_id, badge_id)
  -- Prevents duplicate badge unlocks
```

**Indexes:**
- `idx_user_badges_user_id` - Fast user lookups
- `idx_user_badges_unseen` - Fast unseen badge queries

---

## 🎮 Badge Definitions

**Location:** `constants.ts` lines 766-833

### Streak Badges
- `streak-3` - First Flame 🔥 (3 days)
- `streak-7` - Week Warrior 💪 (7 days)
- `streak-30` - Monthly Master 🌟 (30 days)
- `streak-90` - Quarterly Champion 👑 (90 days)

### Milestone Badges
- `sessions-1` - First Steps 🌱 (1 session)
- `sessions-10` - Getting Serious 📚 (10 sessions)
- `sessions-50` - Dedicated 🎯 (50 sessions)
- `sessions-100` - MI Master 🏆 (100 sessions)

### Skill Badges (⚠️ NOT IMPLEMENTED)
- Mentioned in `agents/gamification.md` but not in `constants.ts`
- Would require skill tracking per session

---

## 🔧 Sync Queue System

### Main Sync Queue (`utils/syncQueue.ts`)

**Used By:** `useXP`, `useStreak`

**Storage:** `mi-coach-sync-queue` (localStorage)

**Operation Types:**
- `'xp'` - XP delta to add
- `'streak'` - Full streak state to update

**Retry Logic:**
- Exponential backoff: `MIN_RETRY_DELAY * 2^retryCount`
- Max retries: 5
- Prunes failed operations after max retries

**XP Sync Handler:**
```typescript
1. Read current XP from Supabase
2. Add delta: newXP = currentXP + xpDelta
3. Update Supabase
```

**Streak Sync Handler:**
```typescript
1. Replace existing streak operation (only latest matters)
2. Update Supabase with full streak state
```

### Badge Sync Queue (`hooks/useBadges.ts`)

**Used By:** `useBadges`

**Storage:** `mi-coach-badge-sync-queue` (localStorage)

**Retry Logic:**
- Simple retry on hook load
- No exponential backoff
- Retries all queued badges

**Why Separate?**
- Badge queue stores full badge data (badgeId + timestamp)
- Main queue stores operations/deltas
- Different retry strategies needed

---

## 🐛 Known Issues

See `docs/project-overview.md` for full list of "chaotic vibes"

**Quick Summary:**
1. ⚠️ Timezone inconsistency (docs say UTC, code uses LOCAL)
2. ⚠️ XP awards not using constants
3. ⚠️ Badge unlock XP not awarded
4. ⚠️ Streak day bonus XP not implemented
5. ⚠️ Skill badges mentioned but not implemented

---

## 📝 Usage Examples

### Awarding XP After Session
```typescript
const { addXP } = useXP();

// Award base XP
await addXP(10, 'Session completed');

// Award bonus for high score
if (empathyScore >= 4.5) {
  await addXP(10, 'Excellent empathy score');
}
```

### Checking Badge Unlocks
```typescript
const { checkAndUnlockBadges } = useBadges();
const { currentStreak } = useStreak();

// After session completes
const newBadges = await checkAndUnlockBadges({
  streak: currentStreak,
  totalSessions: sessions.length,
});
```

### Updating Streak
```typescript
const { updateStreak } = useStreak();

// After session completes
const newStreak = await updateStreak();
// Returns new streak count
```

---

**Last Updated:** 2025-12-26
