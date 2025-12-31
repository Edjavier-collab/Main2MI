# Implement Custom Select Component

The user is experiencing persistent issues with the native HTML `<select>` element (tiny text, detached positioning). To resolve this definitively, we will replace the native control with a **Custom Select** component. This allows 100% control over styling, font size, and positioning.

## Proposed Changes

### New Component
#### [NEW] [components/ui/CustomSelect.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/ui/CustomSelect.tsx)
- A fully styled React component acting as a dropdown.
- **Trigger**: Looks like a text input, displays current selection.
- **Menu**: An absolute-positioned list that appears directly below the trigger.
- **Styling**: Uses `text-lg` (18px) to match user requirements.
- **Features**: Supports grouped options (for the Topics list).

### View Update
#### [MODIFY] [components/views/ScenarioSelectionView.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/ScenarioSelectionView.tsx)
- Replace all `<select>` and difficulty buttons (optional, but good for consistency) with `<CustomSelect>`.
- Pass the `groupedTopics`, `DifficultyLevel` values, and `StageOfChange` values to the new component.

## Verification
1.  Open Scenario Selection.
2.  Click "Substance / Behavior".
3.  Verify the menu appears **immediately below** the input (attached).
4.  Verify the text is large and readable (18px).
5.  Verify selection updates the state correctly.
