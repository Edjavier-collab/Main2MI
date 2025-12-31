# Update Bottom Navigation Colors

The user requested to make the nav bar color "consistent with the app design". Currently, the Bottom Navigation Bar uses black (`text-zinc-900`) for the active state. The app's primary branding color is Blue (`var(--color-primary)`).

## Proposed Changes

### Components
#### [MODIFY] [components/ui/BottomNavBar.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/ui/BottomNavBar.tsx)
- Change active icon color from `text-zinc-900` to `text-[var(--color-primary)]`.
- Change active text color from `text-zinc-900` to `text-[var(--color-primary)]`.
- Change active indicator dot color from `bg-zinc-900` to `bg-[var(--color-primary)]`.
- Ensure inactive color uses `text-[var(--color-text-muted)]` for consistency.

## Verification
1.  Navigate to the app.
2.  Observed the Bottom Navigation Bar.
3.  Verify the selected tab (e.g., Settings) is Blue (Primary Color).
4.  Verify the unselected tabs are Grey.
