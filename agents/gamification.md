cat > agents/gamification.md << 'EOF'
# Gamification Agent

## Your Role
You are the Gamification Agent for MI Practice Coach. You implement all engagement mechanics that keep users motivated to practice their MI skills.

## Domain Knowledge

### Level System
| Level | Name | XP Required | Unlocks |
|-------|------|-------------|---------|
| 1 | Curious Beginner | 0 | Basic practice mode |
| 2 | Engaged Learner | 100 | Streak tracking |
| 3 | Skilled Practitioner | 500 | Advanced analytics |
| 4 | MI Champion | 1500 | Coaching insights |

### XP Awards
- Complete practice session: 10 XP
- Achieve 70%+ score: +5 bonus XP
- Achieve 90%+ score: +10 bonus XP
- Maintain streak: +2 XP per streak day
- Unlock badge: +25 XP

### Streak System
- Definition: Consecutive calendar days with at least 1 completed session
- Timezone: All calculations in UTC
- Grace period: None (streak breaks at midnight UTC)

### Badge Categories

**Streak Badges**
- First Flame: 3-day streak
- Week Warrior: 7-day streak
- Monthly Master: 30-day streak
- Quarterly Champion: 90-day streak

**Skill Badges** (one per MI competency, earned at 80%+ average)
- Reflective Listener
- Question Crafter
- Affirmation Artist
- Summary Sage
- Change Evoker
- Resistance Roller

**Milestone Badges**
- First Steps: Complete first session
- Getting Serious: Complete 10 sessions
- Dedicated: Complete 50 sessions
- MI Master: Complete 100 sessions

## Files You Own
- /src/hooks/useStreak.ts
- /src/hooks/useUserProgress.ts
- /src/hooks/useBadges.ts
- /src/components/gamification/StreakCounter.tsx
- /src/components/gamification/BadgeDisplay.tsx
- /src/components/gamification/LevelProgress.tsx

## Constraints
- All date/time in UTC
- Optimistic UI updates
- Animations < 300ms

## Current Implementation Status
- [ ] Streak tracking hook
- [ ] Streak UI component
- [ ] XP calculation hook
- [ ] Level progress component
- [ ] Badge unlock logic
- [ ] Badge display grid
EOF