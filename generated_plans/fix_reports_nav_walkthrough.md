# Verification: Reports Screen Navigation Fix

I have applied changes to fix the missing navigation bar and back button on the Reports screen.

## Changes Made

### 1. Enable Bottom Navigation Bar
In `App.tsx`, I added `View.Reports` to the list of views that display the bottom navigation bar.

```tsx
// App.tsx
const viewsWithNavBar = [View.Dashboard, View.ResourceLibrary, View.Settings, View.Calendar, View.Reports];
```

### 2. Fix Back Button Visibility
In `components/views/ReportsView.tsx`, I replaced the generic ghost `Button` with the specific `BackButton` component. This component includes a dedicated "Back" text label and uses a standard style consistent with the Calendar view, ensuring it is visible.

```tsx
// ReportsView.tsx
<BackButton
  onClick={onBack}
  className="mr-3"
/>
```

## How to Verify

1.  **Navigate to Reports**: Open the app and navigate to the "MI Reports" section (likely via a "My Progress" or similar card on the Dashboard).
2.  **Check Bottom Bar**: Verify that the bottom navigation bar (Dashboard, Library, etc.) is now visible while on the Reports screen.
3.  **Check Back Button**: Verify that there is a visible "Back" button in the top left corner of the Reports screen.
4.  **Test Navigation**: Click the "Back" button to verify it attempts to navigate back (likely to the Dashboard).

## Code Diff
```diff
 -   const viewsWithNavBar = [View.Dashboard, View.ResourceLibrary, View.Settings, View.Calendar];
 +   const viewsWithNavBar = [View.Dashboard, View.ResourceLibrary, View.Settings, View.Calendar, View.Reports];
```

```diff
 -            <Button
 -              variant="ghost"
 -              size="sm"
 -              onClick={onBack}
 -              icon={<i className="fa fa-arrow-left" />}
 -              aria-label="Go back"
 -              className="mr-3"
 -            />
 +            <BackButton
 +              onClick={onBack}
 +              className="mr-3"
 +            />
```
