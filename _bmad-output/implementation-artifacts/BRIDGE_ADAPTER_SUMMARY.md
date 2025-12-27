# Bridge Adapter Design Summary

**Date:** 2025-12-26  
**Command:** `*bridge-adapter`  
**Status:** ✅ COMPLETE

---

## What Was Created

### Contract Definitions (Frozen Source of Truth)

**`FeedbackContractV1.ts`**
- Exact TypeScript interface matching legacy `analyze-session` output
- Validation function: `validateFeedbackContractV1()`
- Normalization function: `normalizeFeedbackContractV1()`
- Based on golden fixtures: `analyze-session-fixture-*.json`

**`CoachingSummaryContractV1.ts`**
- Exact TypeScript interface matching legacy `coaching-summary` output
- Validation function: `validateCoachingSummaryContractV1()`
- Normalization function: `normalizeCoachingSummaryContractV1()`
- Based on golden fixtures: `coaching-summary-fixture-*.json`

### Adapter Layer

**`BridgeAdapter.ts`**
- `adaptFeedbackToV1()` - Transforms new output → legacy contract
- `adaptCoachingSummaryToV1()` - Transforms new summary → legacy contract
- `compareFeedbackOutputs()` - Dual-run drift detection
- `validateAndAdaptFeedback()` - Validation wrapper
- `validateAndAdaptCoachingSummary()` - Validation wrapper

---

## Bridge Adapter Pattern

### The Stable Façade

```
┌─────────────────────────────────────────┐
│   Client Code (FeedbackView, etc.)     │
│   Expects: FeedbackContractV1          │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Bridge Adapter (Stable Façade)     │
│  - adaptFeedbackToV1()                  │
│  - adaptCoachingSummaryToV1()           │
└───────────────┬─────────────────────────┘
                │
                │ (can route to either)
                │
        ┌───────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Legacy Edge  │  │ New Edge      │
│ Function     │  │ Function      │
│ (analyze-    │  │ (analyze-     │
│  session)    │  │  session-v2)  │
└──────────────┘  └──────────────┘
```

### Migration Flow

**Phase 1: Legacy Only**
- All calls go to legacy Edge Functions
- Output matches `FeedbackContractV1` directly

**Phase 2: Dual-Run (Bridge Adapter Active)**
- Calls go to both legacy + new Edge Functions
- New output → adapter → `FeedbackContractV1`
- Compare legacy vs adapted for drift
- Track semantic-equal matches (target: N=10)

**Phase 3: Cutover**
- After N=10 matches + human approval
- Switch default to new Edge Functions
- Still use adapter (maintains V1 contract)
- Legacy functions remain as fallback

**Phase 4: Legacy Removal**
- After confidence period
- Remove legacy Edge Functions
- Update callers to new contract (if desired)
- Remove adapter layer

---

## Contract Structure

### FeedbackContractV1

**Required Fields:**
- `empathyScore` (number, 1-5 or 0)
- `empathyBreakdown` (string)
- `whatWentRight` (string)
- `areasForGrowth` (string)
- `skillsDetected` (MISkill[])
- `nextFocus` (string)
- `analysisStatus` ('complete' | 'insufficient-data' | 'error')

**Optional Fields:**
- `keyTakeaway` (string)
- `constructiveFeedback` (string)
- `keySkillsUsed` (MISkill[])
- `skillCounts` (Record<string, number>)
- `nextPracticeFocus` (string)
- `analysisMessage` (string)

### CoachingSummaryContractV1

**Required Fields:**
- `totalSessions` (number)
- `dateRange` (string, "MM/DD/YYYY to MM/DD/YYYY")
- `strengthsAndTrends` (string, markdown)
- `areasForFocus` (string)
- `summaryAndNextSteps` (string)

**Optional Fields:**
- `skillProgression` (SkillProgressionItem[])
- `topSkillsToImprove` (string[])
- `specificNextSteps` (string[])

---

## Adapter Functions

### `adaptFeedbackToV1(newOutput: NewFeedbackOutput): FeedbackContractV1`

Transforms new feedback structure → legacy contract:
- Maps `newOutput.empathy.score` → `empathyScore`
- Maps `newOutput.empathy.explanation` → `empathyBreakdown`
- Maps `newOutput.strengths.summary` → `whatWentRight`
- Maps `newOutput.growthAreas.suggestions` → `areasForGrowth`
- Maps `newOutput.skills.detected` → `skillsDetected`
- Maps `newOutput.recommendations.nextSession` → `nextFocus`
- Normalizes and validates output

### `adaptCoachingSummaryToV1(newOutput: NewCoachingSummaryOutput): CoachingSummaryContractV1`

Transforms new summary structure → legacy contract:
- Maps `newOutput.sessions.count` → `totalSessions`
- Formats `newOutput.sessions.dateRange` → `dateRange` string
- Maps `newOutput.analysis.*` → corresponding text fields
- Transforms `newOutput.progression.skills` → `skillProgression`
- Normalizes and validates output

### `compareFeedbackOutputs(legacy: FeedbackContractV1, adapted: FeedbackContractV1): DriftComparison`

Compares legacy vs adapted output:
- **Critical fields**: Must match exactly (empathyScore, analysisStatus, skillsDetected)
- **Moderate fields**: Semantic equivalence allowed (text fields)
- **Minor fields**: Can differ (optional fields)
- Returns: `{ exactMatch, semanticEqual, differences[] }`

---

## Validation Rules

### FeedbackContractV1 Validation
- ✅ `empathyScore` is integer 0-5
- ✅ All required string fields are non-empty
- ✅ `skillsDetected` contains only valid MI skills
- ✅ `analysisStatus` is valid enum value
- ✅ Optional arrays are valid if present

### CoachingSummaryContractV1 Validation
- ✅ `totalSessions` >= 1
- ✅ `dateRange` matches "MM/DD/YYYY to MM/DD/YYYY" format
- ✅ All required string fields are non-empty
- ✅ `skillProgression` items have valid structure if present
- ✅ Trend values are valid enum ('increasing' | 'stable' | 'decreasing')

---

## Next Steps

### Phase 3: Dual-Run Implementation (`*dual-run-diff`)

1. **Create new Edge Functions:**
   - `supabase/functions/analyze-session-v2/index.ts`
   - `supabase/functions/coaching-summary-v2/index.ts`

2. **Implement dual-run wrapper:**
   - Call both legacy + new functions
   - Adapt new output using `BridgeAdapter`
   - Compare using `compareFeedbackOutputs()`
   - Track semantic-equal matches

3. **Add drift detection:**
   - Log differences when semantic-equal = false
   - Reset counter on drift
   - Increment counter on semantic-equal

4. **Cutover gate:**
   - After N=10 consecutive matches
   - Request human approval
   - Switch default to new implementation

---

## Files Created

**Location:** `_bmad-output/implementation-artifacts/contracts/`

- `FeedbackContractV1.ts` - Feedback contract definition
- `CoachingSummaryContractV1.ts` - Coaching summary contract definition
- `BridgeAdapter.ts` - Adapter functions and comparison helpers
- `README.md` - Contract documentation and usage patterns

---

**Status:** ✅ Bridge Adapter designed and ready for implementation
