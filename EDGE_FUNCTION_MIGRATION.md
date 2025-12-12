# Edge Function Migration - AI Feedback Analysis

## Summary

Migrated AI feedback generation from client-side Gemini API calls to a secure Supabase Edge Function.

## Changes Made

### 1. Created Edge Function: `supabase/functions/analyze-session/index.ts`

**Features:**
- ✅ JWT authentication validation
- ✅ 30-second timeout protection
- ✅ Comprehensive error handling:
  - Timeout (504)
  - Rate limiting (429)
  - Invalid API key (401/403)
  - Malformed responses (500)
- ✅ Same prompt and schema as client-side
- ✅ Response normalization to match `Feedback` type

**Request Format:**
```typescript
POST /functions/v1/analyze-session
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
Body:
  {
    transcript: ChatMessage[],
    patient: PatientProfile
  }
```

**Response Format:**
```typescript
{
  empathyScore: number,
  empathyBreakdown: string,
  whatWentRight: string,
  areasForGrowth: string,
  skillsDetected: string[],
  skillCounts: Record<string, number>,
  nextFocus: string,
  // ... other Feedback fields
}
```

### 2. Updated `components/views/PracticeView.tsx`

**Changes:**
- ✅ Removed direct import of `getFeedbackForTranscript` from `geminiService.ts`
- ✅ Added `getFeedbackFromEdgeFunction()` function that:
  - Gets auth token from Supabase session
  - Calls Edge Function with proper headers
  - Handles errors with user-friendly messages
- ✅ Added error state management (`feedbackError`, `isRetryingFeedback`)
- ✅ Added retry functionality with "Retry Feedback Generation" button
- ✅ Added "Continue Without Feedback" option as fallback
- ✅ Improved loading states (shows "Retrying..." during retry)

**Error Handling:**
- Maps HTTP status codes to user-friendly messages:
  - 401: "Your session has expired. Please refresh the page and try again."
  - 429: "AI service is busy. Please try again in a moment."
  - 504: "Analysis timed out. Please try again."
  - 500: "AI service error. Please try again later."

## Next Steps

### 1. Set Environment Variable

Set the Gemini API key as a Supabase secret (not VITE_ prefixed):

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:** This is different from the client-side `VITE_GEMINI_API_KEY`. The Edge Function uses `GEMINI_API_KEY` (no VITE_ prefix) because it runs server-side.

### 2. Deploy Edge Function

```bash
supabase functions deploy analyze-session
```

### 3. Test the Integration

1. Start a practice session
2. Complete the session
3. Verify feedback is generated via Edge Function
4. Test error scenarios:
   - Network failure (disconnect internet)
   - Timeout (if possible)
   - Invalid auth token

### 4. Remove Client-Side API Key (Optional)

Once Edge Function is working, you can:
- Remove `VITE_GEMINI_API_KEY` from `.env.local` (if not needed for other features)
- Keep it for development/testing if needed

**Note:** `getPatientResponse()` still uses client-side Gemini API. Consider migrating that to Edge Function as well if needed.

## Security Improvements

✅ **API Key Protection:** Gemini API key is now server-side only, not exposed in client bundle
✅ **Authentication Required:** Edge Function validates JWT token
✅ **Rate Limiting:** Can be enforced server-side (Edge Function level)
✅ **Timeout Protection:** 30-second timeout prevents hanging requests

## Backward Compatibility

- ✅ Anonymous users can still use the feature (uses anon key)
- ✅ Authenticated users use their JWT token
- ✅ Same `Feedback` type structure returned
- ✅ Fallback to error feedback if generation fails

## Files Modified

1. `supabase/functions/analyze-session/index.ts` (NEW)
2. `components/views/PracticeView.tsx` (UPDATED)

## Testing Checklist

- [ ] Edge Function deploys successfully
- [ ] GEMINI_API_KEY secret is set
- [ ] Authenticated user can generate feedback
- [ ] Anonymous user can generate feedback
- [ ] Error handling works (timeout, network error, etc.)
- [ ] Retry button works
- [ ] "Continue Without Feedback" creates fallback feedback
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly

## Rollback Plan

If issues occur, you can temporarily revert `PracticeView.tsx` to use `getFeedbackForTranscript` from `geminiService.ts`:

```typescript
// Revert to:
import { getFeedbackForTranscript } from '../../services/geminiService';

// In handleEndSession:
const feedback = await getFeedbackForTranscript(transcript, patient, userTier);
```

However, this exposes the API key client-side again, so only use as temporary measure.
