# Bridge Adapter Contracts - Version 1

**Generated:** 2025-12-26  
**Purpose:** Stable contract definitions for Strangler Fig modernization  
**Status:** ✅ FROZEN - Do not modify during modernization

---

## Contract Files

### `FeedbackContractV1.ts`
- Defines exact JSON structure for `analyze-session` Edge Function output
- Includes validation and normalization functions
- Based on golden fixtures: `analyze-session-fixture-*.json`

### `CoachingSummaryContractV1.ts`
- Defines exact JSON structure for `coaching-summary` Edge Function output
- Includes validation and normalization functions
- Based on golden fixtures: `coaching-summary-fixture-*.json`

### `BridgeAdapter.ts`
- Adapter functions that transform new implementations → legacy contracts
- Dual-run comparison helpers for drift detection
- Validation wrappers

---

## Usage Pattern

### Phase 1: Legacy (Current)
```typescript
// Legacy Edge Function returns FeedbackContractV1 directly
const feedback = await callLegacyAnalyzeSession(transcript, patient);
// feedback matches FeedbackContractV1 exactly
```

### Phase 2: Bridge Adapter (During Modernization)
```typescript
// New Edge Function returns NewFeedbackOutput (different structure)
const newOutput = await callNewAnalyzeSession(transcript, patient);

// Adapter transforms → legacy contract
const adapted = adaptFeedbackToV1(newOutput);

// All callers still receive FeedbackContractV1 (no breaking changes)
return adapted;
```

### Phase 3: Dual-Run (Migration)
```typescript
// Run both implementations
const legacy = await callLegacyAnalyzeSession(transcript, patient);
const newOutput = await callNewAnalyzeSession(transcript, patient);
const adapted = adaptFeedbackToV1(newOutput);

// Compare for drift
const comparison = compareFeedbackOutputs(legacy, adapted);

if (comparison.semanticEqual) {
  // Count toward cutover threshold (N=10)
  incrementSemanticEqualCounter();
} else {
  // Reset counter, log differences
  resetCounter();
  logDifferences(comparison.differences);
}
```

### Phase 4: Cutover (After N=10 + Approval)
```typescript
// Switch default to new implementation
const newOutput = await callNewAnalyzeSession(transcript, patient);
const adapted = adaptFeedbackToV1(newOutput);

// Still return FeedbackContractV1 (adapter ensures compatibility)
return adapted;
```

### Phase 5: Legacy Removal (Final)
```typescript
// Remove adapter layer, update callers to use new structure directly
// (Only after all callers are updated to new contract)
const newOutput = await callNewAnalyzeSession(transcript, patient);
return newOutput; // New contract
```

---

## Contract Stability Rules

### ✅ DO:
- Use contracts as Source of Truth
- Validate all outputs against contracts
- Use adapter layer during migration
- Compare outputs using comparison helpers

### ❌ DON'T:
- Modify contract structures during modernization
- Skip adapter layer (breaks backward compatibility)
- Change required field names or types
- Remove optional fields that are in use

---

## Validation

### FeedbackContractV1 Validation
```typescript
import { validateFeedbackContractV1, normalizeFeedbackContractV1 } from './FeedbackContractV1';

// Validate structure
if (!validateFeedbackContractV1(data)) {
  throw new Error('Invalid FeedbackContractV1');
}

// Normalize (sanitize, fill defaults)
const normalized = normalizeFeedbackContractV1(partialData);
```

### CoachingSummaryContractV1 Validation
```typescript
import { validateCoachingSummaryContractV1, normalizeCoachingSummaryContractV1 } from './CoachingSummaryContractV1';

// Validate structure
if (!validateCoachingSummaryContractV1(data)) {
  throw new Error('Invalid CoachingSummaryContractV1');
}

// Normalize (sanitize, fill defaults, format dates)
const normalized = normalizeCoachingSummaryContractV1(
  partialData,
  totalSessions,
  firstSessionDate,
  lastSessionDate
);
```

---

## Adapter Pattern

The Bridge Adapter pattern allows:

1. **New implementations** to evolve independently (different structure, improved logic)
2. **Legacy callers** to continue working unchanged (still receive V1 contract)
3. **Incremental migration** (strangle legacy piece by piece)
4. **Safe rollback** (can switch back to legacy if issues arise)

---

## Next Steps

1. ✅ Contracts defined (this file)
2. ⏭️ Implement new Edge Functions with improved structure
3. ⏭️ Use adapter to wrap new functions
4. ⏭️ Dual-run comparison
5. ⏭️ Cutover after N=10 matches + approval

---

**Status:** ✅ Contracts frozen and ready for Bridge Adapter implementation
