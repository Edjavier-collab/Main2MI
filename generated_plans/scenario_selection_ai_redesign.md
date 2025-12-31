# Redesign Scenario Selection with AI Generation

The user wants to replace the current card-based scenario selection with a form-based approach where they can configure specific parameters (Substance/Behavior, Difficulty, Stage of Change) and have the AI generate a unique patient scenario dynamically.

## User Review Required
> [!IMPORTANT]
> This change replaces the static list of scenarios with a "Configure & Generate" UI. Users will no longer browse pre-set cards but will instead build a scenario.

## Proposed Changes

### Backend
#### [NEW] [app/api/generate-scenario/route.ts](file:///Users/javi/Antigravity_MI/Main2MI/app/api/generate-scenario/route.ts)
- Create a new API endpoint that accepts `topic`, `difficulty`, and `stageOfChange`.
- Validates the request and calls `geminiService` to generate the profile.

### Services
#### [MODIFY] [services/geminiService.ts](file:///Users/javi/Antigravity_MI/Main2MI/services/geminiService.ts)
- Add `generatePatientProfile(topic, difficulty, stage)` function.
- Implement a system prompt to instruct Gemini to generate a JSON `PatientProfile` matching the parameters.

### UI Components
#### [MODIFY] [components/views/ScenarioSelectionView.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/ScenarioSelectionView.tsx)
- **Complete Redesign**: Remove the grid of cards.
- Add a Form with 3 Dropdowns (Select inputs):
    1.  **Substance / Behavior** (Populated from `PATIENT_TOPIC_TEMPLATES`).
    2.  **Difficulty** (Beginner, Intermediate, Advanced).
    3.  **Stage of Change** (Precontemplation, Contemplation, etc.).
- Add a "Generate Scenario" button with loading state.
- On success, pass the *generated* profile to `onStartPractice`.

#### [MODIFY] [components/views/ViewRenderer.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/ViewRenderer.tsx)
- Update `onStartFilteredPractice` prop to accept an optional `patientProfile`.

### Logic & State
#### [MODIFY] [app/page.tsx](file:///Users/javi/Antigravity_MI/Main2MI/app/page.tsx)
- Update `handleStartFilteredPractice` to checking if a `patientProfile` was passed.
    - If yes, use it directly.
    - If no, continue using the existing template generator (fallback).

## Verification Plan

### Manual Verification
1.  Navigate to "Practice Now" / "Scenario Selection".
2.  Verify the new Form UI appears.
3.  Select "Alcohol", "Advanced", "Precontemplation".
4.  Click "Generate".
5.  Verify a loading spinner appears.
6.  Verify the Practice View loads with a *new*, AI-generated patient matching the criteria (e.g., check the name and backstory in the chat context).
