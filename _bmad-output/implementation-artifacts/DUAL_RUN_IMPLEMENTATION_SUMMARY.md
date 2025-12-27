# Dual-Run Implementation Summary

**Date:** 2025-12-26  
**Command:** `*dual-run-diff`  
**Status:** ✅ COMPLETE

---

## What Was Created

### New Edge Functions (V2 - Initially Identical to Legacy)

**`supabase/functions/analyze-session-v2/index.ts`**
- Copy of legacy `analyze-session` function
- Will be modernized incrementally behind Bridge Adapter
- Currently produces identical output to legacy

**`supabase/functions/coaching-summary-v2/index.ts`**
- Copy of legacy `coaching-summary` function
- Will be modernized incrementally behind Bridge Adapter
- Currently produces identical output to legacy

### Dual-Run Wrapper Functions

**`supabase/functions/dual-run-analyze-session/index.ts`**
- Calls both legacy and v2 functions in parallel
- Compares outputs using simplified BridgeAdapter logic
- Records comparison results in `dual_run_tracking` table
- Returns legacy output (for now) while tracking drift
- Tracks consecutive semantic-equal matches

**`supabase/functions/dual-run-coaching-summary/index.ts`**
- Same pattern as `dual-run-analyze-session`
- Calls both legacy and v2 coaching summary functions
- Compares and tracks results

### Database Schema

**`supabase/migrations/20251226000000_create_dual_run_tracking.sql`**
- Creates `dual_run_tracking` table for storing comparison results
- Tracks: exactMatch, semanticEqual, differences, consecutive matches
- Includes view `dual_run_match_stats` for aggregate statistics
- RLS policies for user data access

---

## Dual-Run Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│   Frontend (PracticeView, App.tsx)                      │
│   Calls: dual-run-analyze-session                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│   dual-run-analyze-session (Wrapper)                    │
│   1. Calls legacy + v2 in parallel                     │
│   2. Compares outputs                                    │
│   3. Records comparison in DB                            │
│   4. Returns legacy output                               │
└───────┬───────────────────────────────┬─────────────────┘
        │                                 │
        ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│ analyze-session  │            │ analyze-session  │
│ (Legacy)         │            │ -v2 (New)        │
└──────────────────┘            └──────────────────┘
        │                                 │
        └─────────────┬───────────────────┘
                      ▼
        ┌─────────────────────────────┐
        │  Comparison Logic           │
        │  - Critical fields (exact)   │
        │  - Moderate fields (semantic)│
        │  - Minor fields (ignore)     │
        └─────────────┬───────────────┘
                      ▼
        ┌─────────────────────────────┐
        │  dual_run_tracking Table     │
        │  - Record comparison         │
        │  - Track consecutive matches │
        │  - Store differences         │
        └───────────────────────────────┘
```

---

## Comparison Logic

### Feedback Comparison (`compareFeedbackOutputs`)

**Critical Fields (Must Match Exactly):**
- `empathyScore` - Integer 1-5 (or 0)
- `analysisStatus` - Enum: 'complete' | 'insufficient-data' | 'error'
- `skillsDetected` - Array of MI skill names

**Moderate Fields (Semantic Equivalence Allowed):**
- `empathyBreakdown` - Text explanation
- `whatWentRight` - Text summary
- `areasForGrowth` - Text suggestions
- `nextFocus` - Text recommendation

**Semantic Equivalence Check:**
- Compares string lengths (allows 30% variance)
- Critical fields must match exactly
- If all critical fields match → `semanticEqual = true`

### Coaching Summary Comparison (`compareCoachingSummaryOutputs`)

**Critical Fields:**
- `totalSessions` - Must match exactly

**Moderate Fields:**
- `strengthsAndTrends` - Markdown text
- `areasForFocus` - Text
- `summaryAndNextSteps` - Text
- `dateRange` - Formatted date string

**Minor Fields (Can Differ):**
- `skillProgression` - Array of skill data
- `topSkillsToImprove` - Array of skill names
- `specificNextSteps` - Array of action steps

---

## Match Tracking

### Consecutive Match Counter

**Logic:**
- Each successful dual-run comparison is recorded
- If `semanticEqual = true` → increment counter
- If `semanticEqual = false` → reset counter to 0
- Counter persists per user per function

**Cutover Gate:**
- After **N=10 consecutive semantic-equal matches**
- System logs: `consecutiveMatches=10/${CUTOVER_THRESHOLD}`
- Human approval required before cutover

### Database Schema

**`dual_run_tracking` Table:**
```sql
- id: uuid (primary key)
- function_name: text ('analyze-session' | 'coaching-summary')
- user_id: uuid (references auth.users)
- run_timestamp: timestamptz
- exact_match: boolean
- semantic_equal: boolean
- differences: jsonb (array of difference objects)
- consecutive_semantic_matches: integer
- total_runs: integer
- legacy_output: jsonb
- adapted_output: jsonb
- error_message: text
```

**View: `dual_run_match_stats`**
- Aggregates match statistics per function
- Shows: total runs, semantic-equal count, max consecutive matches

---

## Usage Instructions

### Phase 1: Enable Dual-Run (Current State)

**Frontend Changes Required:**
1. Update `PracticeView.tsx` to call `dual-run-analyze-session` instead of `analyze-session`
2. Update `App.tsx` to call `dual-run-coaching-summary` instead of `coaching-summary`

**Example:**
```typescript
// Before
const functionsUrl = `${supabaseUrl}/functions/v1/analyze-session`;

// After
const functionsUrl = `${supabaseUrl}/functions/v1/dual-run-analyze-session`;
```

**What Happens:**
- Both legacy and v2 functions are called
- Outputs are compared and logged
- Legacy output is returned (no user-visible change)
- Comparison results stored in `dual_run_tracking` table

### Phase 2: Monitor Matches

**Query Match Statistics:**
```sql
-- View aggregate stats
SELECT * FROM dual_run_match_stats;

-- View recent comparisons for a user
SELECT 
  function_name,
  run_timestamp,
  semantic_equal,
  consecutive_semantic_matches,
  differences
FROM dual_run_tracking
WHERE user_id = '...'
ORDER BY run_timestamp DESC
LIMIT 20;
```

**Check Cutover Readiness:**
```sql
-- Check if any user has reached threshold
SELECT 
  function_name,
  user_id,
  MAX(consecutive_semantic_matches) as max_matches
FROM dual_run_tracking
GROUP BY function_name, user_id
HAVING MAX(consecutive_semantic_matches) >= 10;
```

### Phase 3: Cutover (After N=10 Matches + Approval)

**Update Dual-Run Functions:**
- Change default return from `legacyOutput` → `newOutput`
- Keep legacy as fallback
- Add feature flag for gradual rollout

**Example Cutover Logic:**
```typescript
// In dual-run-analyze-session/index.ts
const shouldUseNew = consecutiveMatches >= CUTOVER_THRESHOLD && approved;

if (shouldUseNew && newOutput) {
  return jsonResponse(newOutput, 200, req);
} else {
  return jsonResponse(legacyOutput, 200, req);
}
```

---

## Next Steps

### Immediate Actions

1. **Deploy Migration:**
   ```bash
   supabase migration up
   ```

2. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy analyze-session-v2
   supabase functions deploy coaching-summary-v2
   supabase functions deploy dual-run-analyze-session
   supabase functions deploy dual-run-coaching-summary
   ```

3. **Update Frontend:**
   - Change `analyze-session` → `dual-run-analyze-session`
   - Change `coaching-summary` → `dual-run-coaching-summary`

### Monitoring Phase

1. **Run Dual-Run Functions:**
   - Use app normally (practice sessions, coaching summaries)
   - Dual-run wrapper calls both functions automatically
   - Comparison results logged to database

2. **Monitor Match Statistics:**
   - Check `dual_run_match_stats` view regularly
   - Track consecutive matches per user
   - Review differences when `semanticEqual = false`

3. **Review Drift:**
   - When differences occur, review `differences` JSONB field
   - Determine if drift is acceptable or indicates a bug
   - Fix issues in v2 functions if needed

### Cutover Phase (After N=10 Matches)

1. **Verify Threshold:**
   - Query `dual_run_match_stats` to confirm N=10 matches
   - Review recent comparisons for consistency

2. **Get Human Approval:**
   - Review all differences from dual-run period
   - Confirm no critical field mismatches
   - Approve cutover

3. **Update Dual-Run Functions:**
   - Add feature flag or config for cutover
   - Switch default return to new output
   - Keep legacy as fallback

4. **Monitor Post-Cutover:**
   - Watch for errors or user complaints
   - Keep dual-run active for safety
   - Gradually reduce legacy fallback usage

---

## Files Created

**Edge Functions:**
- `supabase/functions/analyze-session-v2/index.ts`
- `supabase/functions/coaching-summary-v2/index.ts`
- `supabase/functions/dual-run-analyze-session/index.ts`
- `supabase/functions/dual-run-coaching-summary/index.ts`

**Database:**
- `supabase/migrations/20251226000000_create_dual_run_tracking.sql`

**Documentation:**
- `_bmad-output/implementation-artifacts/DUAL_RUN_IMPLEMENTATION_SUMMARY.md` (this file)

---

**Status:** ✅ Dual-run system implemented and ready for deployment

**Next Command:** `*manage-cutover` (after N=10 matches are achieved)
