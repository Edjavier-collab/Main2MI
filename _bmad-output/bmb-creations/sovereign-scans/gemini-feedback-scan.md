# Sovereign Scan: Gemini Feedback Generation System

**Scan Date:** 2025-12-26  
**Target:** Gemini feedback generation (post-session feedback + coaching summaries)  
**Scan Type:** Deep archaeological analysis for Strangler Fig modernization

---

## Executive Summary

The Gemini feedback system consists of **2 Supabase Edge Functions** that generate AI-powered feedback for MI practice sessions. This is an **excellent Strangler Fig candidate** due to:
- ✅ Clear boundaries (isolated Edge Functions)
- ✅ User-visible outputs (FeedbackView + CoachingSummaryView)
- ✅ Structured JSON contracts (already using Gemini structured output)
- ✅ Lower risk than core infrastructure files

---

## Architecture Overview

### Function Set Boundary

**Primary Functions:**
1. `supabase/functions/analyze-session/index.ts` - Post-session feedback generation
2. `supabase/functions/coaching-summary/index.ts` - Multi-session coaching summaries

**Supporting Files:**
- `services/geminiTextProcessor.ts` - Text processing utilities (client-side)
- `services/geminiMockService.ts` - Mock responses for testing (client-side)

**Consumers:**
- `components/views/FeedbackView.tsx` - Displays post-session feedback
- `components/views/CoachingSummaryView.tsx` - Displays multi-session summaries
- `components/views/HistoryView.tsx` - May display feedback summaries
- `components/views/CalendarView.tsx` - May trigger coaching summary generation

---

## Function 1: `analyze-session` Edge Function

### Location
`supabase/functions/analyze-session/index.ts` (409 lines)

### Purpose
Analyzes a single practice session transcript and generates detailed MI feedback.

### Input Contract

**HTTP Request:**
- Method: `POST`
- Auth: `Bearer <JWT>` token in Authorization header
- Body:
```typescript
{
  transcript: ChatMessage[],  // Array of { author: 'user' | 'patient', text: string }
  patient: PatientProfile     // Full patient profile object
}
```

### Output Contract (Current)

**Success Response (200):**
```typescript
{
  keyTakeaway?: string,                    // Optional single-sentence takeaway
  empathyScore: number,                    // 1-5 integer (REQUIRED)
  empathyBreakdown: string,                // 2-3 sentence explanation (REQUIRED)
  whatWentRight: string,                   // 2-3 sentences with quotes (REQUIRED)
  constructiveFeedback: string,            // Key area + missed opportunity (REQUIRED)
  areasForGrowth: string,                  // 2-3 actionable sentences (REQUIRED)
  skillsDetected: string[],                // Array of MI skill names (REQUIRED)
  keySkillsUsed: string[],                 // Skills used effectively
  skillCounts: Record<string, number>,     // Count per skill (e.g., {"Reflections": 4})
  nextPracticeFocus: string,               // Actionable goal for next session
  nextFocus: string,                       // Concise recommendation (REQUIRED)
  analysisStatus: string,                  // 'complete' | 'insufficient-data'
  analysisMessage?: string                  // Optional status message
}
```

**Error Responses:**
- `401` - Invalid/expired token
- `400` - Missing/invalid transcript or patient
- `429` - Rate limit exceeded
- `500` - Server/AI service error
- `504` - Timeout (30s)

### Dependencies

**External:**
- Google Gemini API (`gemini-2.0-flash` model)
- Supabase Auth (JWT verification)
- Environment: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

**Internal:**
- `../_shared/cors.ts` - CORS handling utilities

### Key Logic Flow

1. **Auth Check** → Verify JWT token via Supabase
2. **Input Validation** → Check transcript array + patient object
3. **Clinician Input Check** → Ensure at least one user message exists
4. **Prompt Construction** → Format transcript + patient profile into Gemini prompt
5. **Gemini API Call** → Structured JSON output with schema validation
6. **Response Normalization** → Sanitize and normalize Gemini output
7. **Return Feedback** → JSON response to client

### Normalization Logic

The `normalizeFeedbackOutput()` function:
- Sanitizes skills arrays (filters to valid MI skills only)
- Coerces empathyScore to 1-5 integer
- Provides fallback strings for missing fields
- Handles skillCounts as JSON string or object

### Critical Constraints

- **Timeout:** 30 seconds max
- **Required Fields:** empathyScore, empathyBreakdown, whatWentRight, areasForGrowth, skillsDetected, nextFocus
- **Skill Enum:** Must match `FEEDBACK_SKILLS` array exactly
- **Empathy Score:** Must be integer 1-5

---

## Function 2: `coaching-summary` Edge Function

### Location
`supabase/functions/coaching-summary/index.ts` (402 lines)

### Purpose
Generates a coaching summary analyzing multiple practice sessions together.

### Input Contract

**HTTP Request:**
- Method: `POST`
- Auth: `Bearer <JWT>` token in Authorization header
- Body:
```typescript
{
  sessions: Session[]  // Array of complete Session objects with feedback
}
```

### Output Contract (Current)

**Success Response (200):**
```typescript
{
  totalSessions: number,                    // Count of sessions analyzed (REQUIRED)
  dateRange: string,                        // "MM/DD/YYYY to MM/DD/YYYY" (REQUIRED)
  strengthsAndTrends: string,              // Markdown-formatted analysis (REQUIRED)
  areasForFocus: string,                    // 1-2 core themes (REQUIRED)
  summaryAndNextSteps: string,              // Encouraging summary + action (REQUIRED)
  skillProgression: Array<{                 // Skill usage trends
    skillName: string,
    totalCount: number,
    averagePerSession: number,
    trend: 'increasing' | 'stable' | 'decreasing'
  }>,
  topSkillsToImprove: string[],            // 1-2 skill names
  specificNextSteps: string[]               // 2-3 actionable steps
}
```

**Error Responses:**
- `401` - Invalid/expired token
- `400` - Missing/invalid sessions array or empty array
- `429` - Rate limit exceeded
- `500` - Server/AI service error
- `504` - Timeout (60s)

### Dependencies

**External:**
- Google Gemini API (`gemini-2.0-flash` model)
- Supabase Auth (JWT verification)
- Environment: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

**Internal:**
- `../_shared/cors.ts` - CORS handling utilities

### Key Logic Flow

1. **Auth Check** → Verify JWT token via Supabase
2. **Input Validation** → Check sessions array (must have at least 1)
3. **Session Summarization** → Extract key data from each session
4. **Prompt Construction** → Build comprehensive prompt with all session data
5. **Gemini API Call** → Structured JSON output with schema validation
6. **Response Normalization** → Sanitize and normalize Gemini output
7. **Return Summary** → JSON response to client

### Normalization Logic

The `normalizeCoachingSummary()` function:
- Provides fallback strings for all text fields
- Validates skillProgression array structure
- Ensures trend values are valid enum
- Calculates date range from first/last session

### Critical Constraints

- **Timeout:** 60 seconds max (longer than analyze-session)
- **Required Fields:** totalSessions, dateRange, strengthsAndTrends, areasForFocus, summaryAndNextSteps
- **Session Count:** Must have at least 1 session
- **Date Format:** MM/DD/YYYY

---

## Client-Side Consumption

### FeedbackView Component

**Location:** `components/views/FeedbackView.tsx`

**Consumes:** Output from `analyze-session` Edge Function

**Key Display Logic:**
- Shows empathy score gauge (1-5)
- Displays "What Went Right" section
- Shows "Areas for Growth" (premium-gated)
- Lists detected skills
- Shows skill counts
- Displays "Next Focus" recommendation

**Tier Gating:**
- Free users: See empathy score + basic feedback
- Premium users: See full feedback including constructive feedback

### CoachingSummaryView Component

**Location:** `components/views/CoachingSummaryView.tsx` (referenced in grep)

**Consumes:** Output from `coaching-summary` Edge Function

**Display Logic:** (needs inspection - file not fully read)

---

## Dependencies Map

### Inbound Dependencies (Who Calls These Functions)

**analyze-session:**
- `components/views/PracticeView.tsx` - After session completion
- `hooks/useSessionManager.ts` - May trigger feedback generation
- `App.tsx` - May coordinate feedback flow

**coaching-summary:**
- `components/views/CalendarView.tsx` - When generating summaries
- `components/views/HistoryView.tsx` - May trigger summary generation

### Outbound Dependencies (What These Functions Use)

**Both Functions:**
- `../_shared/cors.ts` - CORS utilities
- Google Gemini API (external)
- Supabase Auth (external)

**coaching-summary:**
- Depends on Session type structure from `types.ts`
- Uses feedback structure from `analyze-session` output

---

## Legacy Gravity Assessment

### Risk Level: **MEDIUM**

**Why Medium:**
- ✅ Isolated Edge Functions (serverless, separate from main codebase)
- ✅ Clear input/output contracts
- ✅ User-visible outputs (can freeze UI rendering)
- ⚠️ Used by multiple views/components
- ⚠️ Part of core user experience flow

**Impact if Broken:**
- Users cannot receive feedback after practice sessions
- Premium users lose coaching summary feature
- High user-facing impact, but isolated from core app logic

---

## Strangler Fig Readiness

### ✅ Ready for Strangler Fig

**Advantages:**
1. **Clear Boundaries** - Two distinct Edge Functions with separate responsibilities
2. **Structured Output** - Already using Gemini structured output (JSON schemas)
3. **Testable** - Can generate golden fixtures from real API responses
4. **Isolated** - Changes won't affect core app infrastructure
5. **User-Visible** - Clear success criteria (UI renders correctly)

**Challenges:**
1. **Edge Function Deployment** - Requires Supabase CLI deployment
2. **API Key Management** - Must handle GEMINI_API_KEY in both old/new versions
3. **Dual-Run Complexity** - Need to run both old/new functions side-by-side
4. **Client-Side Integration** - Must update client code to call new function endpoints

---

## Recommended Strangler Fig Strategy

### Phase 1: Freeze Current Behavior
1. Generate golden fixtures from `analyze-session`:
   - Capture JSON responses for 5-10 representative sessions
   - Capture rendered Markdown/text from FeedbackView
2. Generate golden fixtures from `coaching-summary`:
   - Capture JSON responses for 3-5 multi-session scenarios
   - Capture rendered output from CoachingSummaryView

### Phase 2: Create Bridge Adapter
1. Define `FeedbackContractV1` interface (matches current JSON structure)
2. Define `CoachingSummaryContractV1` interface
3. Create adapter functions that wrap new implementation but maintain old contract

### Phase 3: Implement New Version
1. Create new Edge Functions: `analyze-session-v2` and `coaching-summary-v2`
2. Implement improved prompts/logic while maintaining contract compatibility
3. Add versioned endpoints or feature flags

### Phase 4: Dual-Run Migration
1. Client calls both old and new functions
2. Compare outputs (JSON + rendered Markdown)
3. Track semantic-equality matches
4. After 10 consecutive matches + human approval → cut over

### Phase 5: Strangle Legacy
1. Update all client code to use new endpoints
2. Remove old Edge Functions
3. Clean up adapter layer

---

## Next Steps

1. **Generate Golden Fixtures** (`*gen-golden-fixtures`)
   - Run `analyze-session` on 5-10 test transcripts
   - Run `coaching-summary` on 3-5 test session arrays
   - Save JSON + rendered Markdown snapshots

2. **Create Bridge Adapter** (`*bridge-adapter`)
   - Define versioned contracts
   - Create adapter wrapper functions

3. **Begin Dual-Run** (`*dual-run-diff`)
   - Implement new version alongside old
   - Compare outputs systematically

---

## Files Requiring Changes

**Edge Functions:**
- `supabase/functions/analyze-session/index.ts` (target for modernization)
- `supabase/functions/coaching-summary/index.ts` (target for modernization)

**Client Code:**
- `components/views/FeedbackView.tsx` (may need adapter integration)
- `components/views/CoachingSummaryView.tsx` (may need adapter integration)
- `hooks/useSessionManager.ts` (may trigger feedback generation)
- `components/views/PracticeView.tsx` (calls analyze-session)
- `components/views/CalendarView.tsx` (calls coaching-summary)

**New Files to Create:**
- `services/geminiFeedbackAdapter.ts` - Bridge adapter layer
- `contracts/FeedbackContractV1.ts` - Type definitions
- `contracts/CoachingSummaryContractV1.ts` - Type definitions
- `tests/fixtures/golden-feedback-*.json` - Golden fixtures
- `tests/fixtures/golden-coaching-*.json` - Golden fixtures

---

**Scan Complete** ✅  
**Recommendation:** Proceed with Strangler Fig modernization  
**Risk Level:** Medium (isolated but user-facing)  
**Estimated Effort:** 2-3 days for full migration
