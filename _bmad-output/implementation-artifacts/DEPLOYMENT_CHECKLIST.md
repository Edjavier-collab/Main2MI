# Dual-Run Deployment Checklist

**Date:** 2025-12-26  
**Status:** Ready for Deployment

---

## Pre-Deployment Checklist

### ✅ Code Complete
- [x] V2 Edge Functions created (`analyze-session-v2`, `coaching-summary-v2`)
- [x] Dual-run wrapper functions created (`dual-run-analyze-session`, `dual-run-coaching-summary`)
- [x] Database migration created (`create_dual_run_tracking.sql`)
- [x] Frontend updated to use dual-run wrappers
- [x] Documentation complete

### ⚠️ Pre-Deployment Steps

1. **Review Migration SQL**
   - Verify `dual_run_tracking` table schema
   - Check RLS policies are correct
   - Confirm indexes are appropriate

2. **Test Edge Functions Locally** (if using Supabase CLI)
   ```bash
   supabase start
   supabase functions serve --env-file .env.local
   ```

3. **Verify Environment Variables**
   - `SUPABASE_URL` - Set in Edge Function environment
   - `SUPABASE_ANON_KEY` - Set in Edge Function environment
   - `SUPABASE_SERVICE_ROLE_KEY` - Required for admin operations
   - `GEMINI_API_KEY` - Required for both legacy and v2 functions

---

## Deployment Steps

### Step 1: Deploy Database Migration

```bash
# Apply migration to create dual_run_tracking table
supabase migration up

# Or if using Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run contents of: supabase/migrations/20251226000000_create_dual_run_tracking.sql
```

**Verify:**
```sql
-- Check table exists
SELECT * FROM dual_run_tracking LIMIT 1;

-- Check view exists
SELECT * FROM dual_run_match_stats;
```

### Step 2: Deploy V2 Edge Functions

```bash
# Deploy new V2 functions (initially identical to legacy)
supabase functions deploy analyze-session-v2
supabase functions deploy coaching-summary-v2
```

**Verify:**
- Functions appear in Supabase Dashboard → Edge Functions
- Can invoke via Supabase Dashboard or CLI

### Step 3: Deploy Dual-Run Wrapper Functions

```bash
# Deploy dual-run wrappers
supabase functions deploy dual-run-analyze-session
supabase functions deploy coaching-summary-v2
```

**Verify:**
- Functions appear in Supabase Dashboard
- Check function logs for any errors

### Step 4: Verify Frontend Changes

**Files Updated:**
- `components/views/PracticeView.tsx` - Now calls `dual-run-analyze-session`
- `App.tsx` - Now calls `dual-run-coaching-summary`

**Test:**
1. Start dev server: `npm run dev`
2. Complete a practice session
3. Check browser console for any errors
4. Verify feedback is generated correctly

---

## Post-Deployment Verification

### 1. Test Dual-Run Functionality

**Test Analyze Session:**
1. Complete a practice session
2. Check Supabase logs for `dual-run-analyze-session`
3. Verify both legacy and v2 functions are called
4. Check `dual_run_tracking` table for comparison results

**Test Coaching Summary:**
1. Generate a coaching summary (requires multiple sessions)
2. Check Supabase logs for `dual-run-coaching-summary`
3. Verify comparison results in database

### 2. Monitor Database

**Query Match Statistics:**
```sql
-- View aggregate stats
SELECT * FROM dual_run_match_stats;

-- View recent comparisons
SELECT 
  function_name,
  run_timestamp,
  semantic_equal,
  consecutive_semantic_matches,
  differences
FROM dual_run_tracking
ORDER BY run_timestamp DESC
LIMIT 20;
```

**Expected Behavior:**
- Both functions should succeed (v2 is identical to legacy)
- `semantic_equal` should be `true` for most runs
- `consecutive_semantic_matches` should increment
- `differences` should be empty or contain only minor field differences

### 3. Check Function Logs

**In Supabase Dashboard:**
- Go to Edge Functions → Logs
- Filter by `dual-run-analyze-session` or `dual-run-coaching-summary`
- Look for:
  - "Calling legacy and new functions in parallel..."
  - "Comparison result: semanticEqual=true"
  - "Recorded comparison: consecutiveMatches=X/10"

---

## Monitoring Phase

### Daily Checks

1. **Review Match Statistics:**
   ```sql
   SELECT * FROM dual_run_match_stats;
   ```

2. **Check for Drift:**
   ```sql
   -- Find runs with differences
   SELECT 
     function_name,
     run_timestamp,
     semantic_equal,
     differences
   FROM dual_run_tracking
   WHERE semantic_equal = false
   ORDER BY run_timestamp DESC;
   ```

3. **Track Progress Toward Cutover:**
   ```sql
   -- Check consecutive matches per user
   SELECT 
     function_name,
     user_id,
     MAX(consecutive_semantic_matches) as max_matches
   FROM dual_run_tracking
   GROUP BY function_name, user_id
   ORDER BY max_matches DESC;
   ```

### Cutover Readiness Check

**When to Consider Cutover:**
- ✅ N=10 consecutive semantic-equal matches achieved
- ✅ No critical field differences in recent runs
- ✅ Moderate field differences are acceptable (text variations)
- ✅ Human approval obtained

**Query for Cutover Readiness:**
```sql
-- Find users ready for cutover
SELECT 
  function_name,
  user_id,
  MAX(consecutive_semantic_matches) as max_matches,
  COUNT(*) as total_runs
FROM dual_run_tracking
WHERE semantic_equal = true
GROUP BY function_name, user_id
HAVING MAX(consecutive_semantic_matches) >= 10
ORDER BY max_matches DESC;
```

---

## Rollback Plan

If issues occur during dual-run phase:

### Option 1: Revert Frontend (Immediate)
- Change `dual-run-analyze-session` → `analyze-session`
- Change `dual-run-coaching-summary` → `coaching-summary`
- Deploy frontend changes
- Legacy functions continue working normally

### Option 2: Disable Dual-Run Wrapper
- Update dual-run functions to only call legacy
- Keep tracking active but skip v2 calls
- Investigate issues with v2 functions

### Option 3: Remove Dual-Run (Full Rollback)
- Revert frontend to direct legacy calls
- Keep v2 functions deployed (unused)
- Keep tracking table (for analysis)
- Plan fixes for v2 functions

---

## Troubleshooting

### Issue: V2 Function Fails

**Symptoms:**
- `comparisonError` in `dual_run_tracking` table
- Logs show v2 function errors

**Actions:**
1. Check v2 function logs for specific error
2. Verify `GEMINI_API_KEY` is set
3. Compare v2 function code with legacy
4. Fix v2 function and redeploy

### Issue: Comparison Always Shows Differences

**Symptoms:**
- `semantic_equal = false` for all runs
- `differences` array contains critical fields

**Actions:**
1. Review `differences` JSONB field in database
2. Check if v2 function normalization differs
3. Verify BridgeAdapter comparison logic
4. May need to adjust comparison thresholds

### Issue: Database Errors

**Symptoms:**
- `dual_run_tracking` insert fails
- RLS policy errors

**Actions:**
1. Verify migration was applied correctly
2. Check RLS policies allow service role writes
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
4. Check function has admin access

---

## Next Steps After Deployment

1. **Monitor for 1-2 weeks:**
   - Collect comparison data
   - Track consecutive matches
   - Review any differences

2. **After N=10 Matches:**
   - Review all differences
   - Get human approval
   - Proceed with `*manage-cutover` command

3. **Post-Cutover:**
   - Switch dual-run to return new output
   - Keep legacy as fallback
   - Monitor for issues
   - Gradually remove legacy fallback

---

**Status:** Ready for deployment

**Deployment Date:** TBD  
**Deployed By:** TBD  
**Cutover Date:** TBD (after N=10 matches)
