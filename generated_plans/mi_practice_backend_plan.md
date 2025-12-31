# Backend Reconnection Plan (Local Integration)

## Goal
Enable functional AI chat by connecting the "Practice" view to a local Next.js API route that uses the Gemini API, bypassing the need for deployed Supabase Edge Functions for the chat loop.

## Proposed Changes

### 1. New Service: Gemini Integration
#### [NEW] [services/geminiService.ts](file:///Users/javi/Antigravity_MI/Main2MI/services/geminiService.ts)
- Import `@google/genai` (already installed).
- Implement `generatePatientResponse` function.
- **Logic**: Construct a prompt includes:
    - Patient Persona (Name, Age, Background, Traits).
    - Session History (Transcript).
    - Current User Message.
    - System Instructions (Be concise, honest, reflect stage of change).

### 2. New API Route (Local Proxy)
#### [NEW] [app/api/chat/route.ts](file:///Users/javi/Antigravity_MI/Main2MI/app/api/chat/route.ts)
- **POST** endpoint.
- Validates user session (optional or rigid based on auth).
- Calls `geminiService.generatePatientResponse`.
- Returns JSON `{ response: string }`.
- **Security**: Uses `process.env.GEMINI_API_KEY` server-side, keeping the key safe.

### 3. Update Frontend Consumer
#### [MODIFY] [components/views/PracticeView.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/PracticeView.tsx)
- Change `getPatientResponseFromEdgeFunction` to `getPatientResponse`.
- **Logic**:
    - Try calling `POST /api/chat` (Local Next.js API).
    - Fallback: Throw error if API key missing or call fails.
- **Benefits**: Works locally without `supabase start` or Edge Functions.

## Verification
1.  **Environment**: User must set `GEMINI_API_KEY` in `.env.local`.
2.  **Test**: Start a practice session. Send a message.
3.  **Success**: Receive a relevant, persona-based response from the AI.
