# Fix Practice Start Issue

The user reported "cannot start practice". Investigation revealed that the "Start Practice" button in the `Dashboard` was unresponsive because it was silently waiting for the user's subscription tier verification to complete.

## Root Cause
- `useTierManager` has an `isTierVerifying` state that starts as `true` (or becomes true) when validating premium status.
- `handleStartPractice` in `page.tsx` has a guard clause: `if (!userTier || isTierVerifying) return;`.
- The `Dashboard` component and its "Start Practice" button had no knowledge of this loading state, so clicks appeared to do nothing while the verification was in progress.

## Implemented Solution

### Components
#### [MODIFY] [Dashboard.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/Dashboard.tsx)
- Added `isLoadingTier` prop to `DashboardProps`.
- Passed this prop to the `loading` state of the "Start Practice" `Button`.

#### [MODIFY] [ViewRenderer.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/ViewRenderer.tsx)
- Updated `ViewRenderer` to pass the existing `isTierVerifying` prop (received from `AppPage`) down to the `Dashboard` component as `isLoadingTier`.

## Verification
- User verified that the button now shows a loading spinner during verification, providing necessary feedback instead of appearing broken.
