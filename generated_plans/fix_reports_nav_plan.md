# Fix Missing Navigation Bar in Reports Screen

The user reported that the navigation bar disappears on the Reports screen, and the back button is missing. This makes it impossible to navigate away from the screen effectively.

## User Review Required

> [!NOTE]
> I am enabling the Bottom Navigation Bar for the Reports screen (`View.Reports`). This aligns it with other main views like Dashboard and Calendar.

## Proposed Changes

### Top-level Application Logic

#### [MODIFY] [App.tsx](file:///Users/javi/Antigravity_MI/Main2MI/App.tsx)
- Add `View.Reports` to `viewsWithNavBar` array. This ensures the bottom navigation persists when viewing reports.

### Reports View Component

#### [MODIFY] [ReportsView.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/ReportsView.tsx)
- Import `BackButton` component.
- Replace the existing `Button` (ghost variant) with `BackButton`. this ensures consistency with `CalendarView` and ensures the button is visible (with "Back" label).

## Verification Plan

### Manual Verification
- I will verify the fix by checking the code changes.
- Since I cannot run the app interactively to click "Reports", I rely on the code structure being identical to the working `CalendarView`.
- I will examine the usage of `fa-solid` vs `fa` classes. `BackButton` uses `fa` but has text fallback. `ReportsView` was using `fa` in a ghost button with NO text, which likely caused it to be invisible if the font didn't load or if `fa` class was insufficient for the icon set used.
