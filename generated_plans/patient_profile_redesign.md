# Redesign Patient Profile UI

The user provided a design reference for the "Patient Profile" screen (pre-session). It features a modern, clean layout with a central avatar, key stats, and clear "Clinical Context" and "Session Objectives" sections.

## Proposed Changes

### UI Components
#### [MODIFY] [components/ui/PatientProfileCard.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/ui/PatientProfileCard.tsx)
- **Layout**: Switch to a vertical, centered header design.
- **Avatar**: Add a dynamic avatar image (using a persistent placeholder service like `pravatar` or local assets based on age/sex).
- **Badges**: Use "Pill" styling for Level and Stats (Focus, Stage).
- **Sections**:
    - **Reason for Visit**: Clean text block.
    - **Clinical Context**: 
        - "Usage Pattern" (mapped from `presentingProblem`).
        - "Health Impact" (mapped from `history`).
    - **Session Objectives**: A blue-background card with checklist items (Standard MI objectives like "Resist Righting Reflex", "Explore Ambivalence").

### Logic Updates
- **Data Mapping**: Since the current `PatientProfile` doesn't strictly have "Occupation" or separate "Usage Pattern" fields, we will:
    - Extract/Mock "Occupation" generic based on background (e.g., "Client").
    - Intelligent mapping of long text fields to the new UI cards.
    - Add standard **MI Session Objectives** based on the patient's `stageOfChange`.

## Verification
1.  Generate a new patient (Scenario Selection).
2.  Observe the "Patient Profile" screen before starting chat.
3.  Verify it matches the screenshot's aesthetic (Avatar, Centered Name, Checkmarks).
