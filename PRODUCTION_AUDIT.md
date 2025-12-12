# Production Readiness Audit - Core Loop

**Date:** 2025-01-10  
**Scope:** Practice session flow, AI feedback, subscription gating, error handling, success states

---

## 1. Practice Session Flow ✅

### Full Path Trace:
1. **Dashboard** (`components/views/Dashboard.tsx:110-120`)
   - User clicks "Start a New Practice"
   - Button disabled if `!isPremium && displayRemaining === 0`
   - Calls `onStartPractice` handler

2. **App.tsx** (`App.tsx:166-188`)
   - `handleStartPractice()` checks `canStartSession(user?.id || null, userTier)`
   - If limit reached → redirects to Paywall
   - Premium users → `View.ScenarioSelection`
   - Free users → generates patient → `View.Practice`

3. **PracticeView** (`components/views/PracticeView.tsx:29-232`)
   - Shows patient profile card initially
   - User clicks "Begin Session" → starts chat
   - Timer counts down (90s free, 300s premium)
   - User can "End Session" manually or timer expires

4. **End Session** (`PracticeView.tsx:100-104`)
   - Sets `isEndingSession = true` (shows loading overlay)
   - Calls `getFeedbackForTranscript(transcript, patient, userTier)`
   - Calls `onFinish(transcript, feedback)`

5. **App.tsx** (`App.tsx:197-209`)
   - `handleFinishPractice()` saves session via `saveNewSession()`
   - Navigates to `View.Feedback`

6. **FeedbackView** (`components/views/FeedbackView.tsx:136-454`)
   - Displays feedback based on tier
   - User clicks "Done" → `handleDoneFromFeedback()` → Dashboard

### ✅ **What Works:**
- Full flow is connected end-to-end
- Loading states during feedback generation (`isEndingSession` overlay)
- Session saving happens optimistically (UI updates immediately)

### ⚠️ **Issues Found:**

**ISSUE #1: No error handling if feedback generation fails during session end**
- **Location:** `PracticeView.tsx:100-104`
- **Problem:** If `getFeedbackForTranscript()` throws, `isEndingSession` stays `true` forever
- **Impact:** User stuck on loading screen, can't proceed
- **Fix Needed:** Wrap in try/catch, show error message, allow retry or skip feedback

**ISSUE #2: No timeout for feedback generation**
- **Location:** `services/geminiService.ts:690-849`
- **Problem:** Gemini API call has no timeout. Could hang indefinitely
- **Impact:** User waits forever if API is slow/unresponsive
- **Fix Needed:** Add timeout (e.g., 30s), fallback to error state

**ISSUE #3: Missing patient validation before saving**
- **Location:** `App.tsx:197-201`
- **Problem:** Only checks `currentPatient` exists, doesn't validate transcript has messages
- **Impact:** Could save empty sessions
- **Fix Needed:** Validate transcript length > 0 before saving

---

## 2. AI Coaching Edge Function ❌

### Finding: **NO Edge Function for AI Coaching**

All AI calls are **client-side** via `services/geminiService.ts`:
- `getPatientResponse()` - Direct Gemini API call from browser
- `getFeedbackForTranscript()` - Direct Gemini API call from browser
- `generateCoachingSummary()` - Direct Gemini API call from browser

### ⚠️ **Critical Issues:**

**ISSUE #4: API key exposed in client-side code**
- **Location:** `services/geminiService.ts:137-184`
- **Problem:** `VITE_GEMINI_API_KEY` is bundled into frontend JavaScript
- **Impact:** API key visible to anyone who inspects code
- **Risk:** API key theft, quota abuse, cost overruns
- **Fix Needed:** Move AI calls to Supabase Edge Function, keep API key server-side

**ISSUE #5: No rate limiting protection**
- **Location:** `services/geminiService.ts:424-498`, `690-849`
- **Problem:** Client can make unlimited API calls
- **Impact:** Rate limit errors, quota exhaustion, costs
- **Fix Needed:** Implement rate limiting in Edge Function

**ISSUE #6: Error handling exists but incomplete**
- **Location:** `services/geminiService.ts:460-497`, `777-848`
- **What's Good:**
  - ✅ Try/catch blocks present
  - ✅ Handles missing API key errors
  - ✅ Handles invalid API key errors
  - ✅ Returns fallback feedback on error
- **What's Missing:**
  - ❌ No timeout handling (API could hang)
  - ❌ No rate limit error handling (429 status)
  - ❌ No network error handling (offline scenarios)
  - ❌ No malformed JSON response handling

**ISSUE #7: Loading states during feedback generation**
- **Location:** `PracticeView.tsx:225-230`
- **Status:** ✅ Loading overlay shown (`isEndingSession` state)
- **Problem:** No timeout, could show forever if API hangs
- **Fix Needed:** Add timeout, show error after 30s

**ISSUE #8: Fallback if analysis fails**
- **Location:** `services/geminiService.ts:828-847`
- **Status:** ✅ Fallback Feedback object returned
- **Problem:** Fallback has generic error message in `whatWentRight` field
- **Issue:** `FeedbackView.tsx:204-206` detects error by checking if `whatWentRight` contains "encountered an issue"
- **Risk:** Fragile string matching could break
- **Fix Needed:** Use `analysisStatus: 'error'` field instead of string matching

---

## 3. Subscription Gating ✅⚠️

### Free Tier Limit: **3 sessions per month**

### Enforcement Points:

1. **Dashboard** (`Dashboard.tsx:112`)
   - Button disabled if `!isPremium && displayRemaining === 0`
   - Shows warning card if limit reached

2. **App.tsx** (`App.tsx:174`)
   - `canStartSession()` check before starting practice
   - Redirects to Paywall if limit reached

3. **subscriptionService.ts** (`subscriptionService.ts:111-146`)
   - `canStartSession()` checks monthly limit
   - Premium users: unlimited
   - Free users: `< FREE_TIER_MONTHLY_LIMIT` (3)

### ✅ **What Works:**
- Limit enforced at multiple points
- Works for both authenticated and anonymous users
- Monthly reset logic correct

### ⚠️ **Edge Cases Missing:**

**ISSUE #9: No check if subscription expires mid-session**
- **Location:** None
- **Problem:** User starts session as Premium, subscription expires during practice
- **Impact:** User completes session but may lose premium features in feedback
- **Fix Needed:** Check tier before showing feedback, or lock premium features if expired

**ISSUE #10: Race condition - multiple sessions started simultaneously**
- **Location:** `App.tsx:166-188`
- **Problem:** If user clicks "Start Practice" multiple times quickly, multiple sessions could start
- **Impact:** Could bypass limit check
- **Fix Needed:** Disable button during `handleStartPractice()` execution, or add debounce

**ISSUE #11: No validation that session was actually saved before counting**
- **Location:** `hooks/useSessionManager.ts:164-279`
- **Problem:** Session count updated optimistically, but if Supabase save fails, count still decrements
- **Impact:** User loses session count even if save failed
- **Fix Needed:** Only decrement count after successful save

**ISSUE #12: Free tier limit not enforced server-side**
- **Location:** All checks are client-side
- **Problem:** Malicious user could bypass checks
- **Impact:** Unlimited free sessions
- **Fix Needed:** Add server-side validation in Edge Function (if creating one for sessions)

---

## 4. Error Boundaries ✅⚠️

### Error Boundary Component:
- **Location:** `components/ui/ErrorBoundary.tsx`
- **Status:** ✅ Well-implemented with fallback UI
- **Coverage:** Wraps entire app in `App.tsx`

### Try/Catch Blocks:

**✅ Good Coverage:**
- `services/geminiService.ts:460-497` - `getPatientResponse()` error handling
- `services/geminiService.ts:777-848` - `getFeedbackForTranscript()` error handling
- `services/geminiService.ts:1040-1084` - `generateCoachingSummary()` error handling
- `hooks/useSessionManager.ts:129-156` - Session loading error handling
- `hooks/useSessionManager.ts:197-216` - Session saving error handling

**⚠️ Missing Coverage:**

**ISSUE #13: No try/catch in PracticeView message sending**
- **Location:** `PracticeView.tsx:62-81`
- **Status:** ✅ Has try/catch (line 69-80)
- **Note:** Error handling exists but shows generic patient message

**ISSUE #14: No network failure handling**
- **Location:** Multiple places
- **Problem:** No detection of offline state during API calls
- **Impact:** User sees generic errors, doesn't know if offline
- **Fix Needed:** Check `navigator.onLine` before API calls, show offline message

**ISSUE #15: Auth session expiry mid-flow**
- **Location:** No handling
- **Problem:** If Supabase session expires during practice, save will fail silently
- **Impact:** Session lost, user doesn't know why
- **Fix Needed:** Check auth state before saving, show re-login prompt

**ISSUE #16: Invalid/empty AI responses**
- **Location:** `services/geminiService.ts:452-456`
- **Status:** ✅ Checks `if (!result.text)` and returns fallback
- **Problem:** Fallback message is in-character ("I'm sorry, I lost my train of thought")
- **Issue:** User doesn't know it's a technical error
- **Fix Needed:** Distinguish between API errors and patient responses

---

## 5. Success States ✅⚠️

### After Completing Session:

**✅ What Works:**
1. **Feedback Generation Complete**
   - Loading overlay disappears (`PracticeView.tsx:225-230`)
   - Navigates to FeedbackView automatically

2. **Feedback Display** (`FeedbackView.tsx`)
   - Shows empathy score (free tier: number only, premium: gauge + breakdown)
   - Shows "What Went Right" section
   - Shows skills checklist (free: 2 skills, premium: all)
   - Shows "Next Practice Focus" (premium only)

3. **Clear Next Steps**
   - "Done" button returns to Dashboard
   - "Start a New Practice" button (premium only)
   - Review prompt after 3 sessions

**⚠️ Issues:**

**ISSUE #17: No confirmation that session was saved**
- **Location:** `App.tsx:197-209`
- **Problem:** User doesn't know if session saved successfully
- **Impact:** User may lose session data without knowing
- **Fix Needed:** Show toast/notification on successful save

**ISSUE #18: Insufficient data state handled but could be clearer**
- **Location:** `FeedbackView.tsx:138-188`
- **Status:** ✅ Shows special UI for insufficient data
- **Problem:** User might not understand why (no clinician messages)
- **Fix Needed:** Add explanation: "We didn't capture any of your responses. Make sure to type or speak your responses during practice."

**ISSUE #19: Error state in feedback looks like normal feedback**
- **Location:** `FeedbackView.tsx:204-206`, `368-370`
- **Problem:** Error messages are in `whatWentRight` field, detected by string matching
- **Impact:** Fragile, could break if error message changes
- **Fix Needed:** Use `analysisStatus: 'error'` field consistently

**ISSUE #20: No retry option if feedback generation fails**
- **Location:** `FeedbackView.tsx`
- **Problem:** If feedback fails, user can only go back to Dashboard
- **Impact:** User loses opportunity to get feedback
- **Fix Needed:** Add "Retry Feedback Generation" button

---

## Summary: Critical Issues

### 🔴 **CRITICAL (Must Fix Before Production):**

1. **ISSUE #4:** API key exposed in client-side code - **SECURITY RISK**
2. **ISSUE #1:** No error handling if feedback generation fails - **USER STUCK**
3. **ISSUE #2:** No timeout for feedback generation - **POOR UX**
4. **ISSUE #11:** Session count decrements even if save fails - **DATA LOSS**

### 🟡 **HIGH PRIORITY (Fix Soon):**

5. **ISSUE #5:** No rate limiting - **COST RISK**
6. **ISSUE #6:** Incomplete error handling (timeout, rate limits, network)
7. **ISSUE #9:** No check if subscription expires mid-session
8. **ISSUE #15:** Auth session expiry mid-flow not handled
9. **ISSUE #17:** No confirmation that session was saved

### 🟢 **MEDIUM PRIORITY (Nice to Have):**

10. **ISSUE #10:** Race condition on multiple clicks
11. **ISSUE #12:** Free tier limit not enforced server-side
12. **ISSUE #14:** No network failure detection
13. **ISSUE #20:** No retry option for failed feedback

---

## Recommendations

1. **Move AI calls to Edge Function** - Critical for security and cost control
2. **Add comprehensive error handling** - Timeouts, rate limits, network errors
3. **Add session save confirmation** - Toast notification
4. **Add retry mechanisms** - For failed feedback generation
5. **Add subscription expiry checks** - Before showing premium features
6. **Add server-side validation** - For free tier limits (if creating Edge Function)

---

## Files Requiring Changes

1. `services/geminiService.ts` - Add timeout, better error handling
2. `components/views/PracticeView.tsx` - Add error handling for feedback generation
3. `App.tsx` - Add session save confirmation, subscription expiry checks
4. `hooks/useSessionManager.ts` - Only decrement count after successful save
5. `components/views/FeedbackView.tsx` - Use `analysisStatus` field instead of string matching
6. **NEW:** `supabase/functions/generate-feedback/index.ts` - Move AI calls server-side
7. **NEW:** `supabase/functions/get-patient-response/index.ts` - Move AI calls server-side

---

**Audit Complete** ✅
