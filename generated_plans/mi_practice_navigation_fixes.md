# Navigation & UI Fixes

This plan consolidates several user requests related to the application shell and navigation.

## Objectives
1.  **Fix Nav Visibility**: Ensure the Bottom Navigation Bar remains visible when viewing "Reports".
2.  **Styles**: Update the Navigation Bar active state to use the Primary Blue color.
3.  **Icons**: Fix the missing icons (e.g., Back Button) by ensuring FontAwesome is loaded.

## Proposed Changes

### Core Logic
#### [MODIFY] [app/page.tsx](file:///Users/javi/Antigravity_MI/Main2MI/app/page.tsx)
- Add `View.Reports` to the `viewsWithNavBar` array. This ensures `BottomNavBar` is rendered when `view === 'reports'`.

### Styling
#### [MODIFY] [components/ui/BottomNavBar.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/ui/BottomNavBar.tsx)
- Update `NavItem` active state classes:
    - Text: `text-zinc-900` -> `text-[var(--color-primary)]`
    - Icon: `text-zinc-900` -> `text-[var(--color-primary)]`
    - Dot: `bg-zinc-900` -> `bg-[var(--color-primary)]`

### Assets
#### [MODIFY] [app/layout.tsx](file:///Users/javi/Antigravity_MI/Main2MI/app/layout.tsx)
- Add FontAwesome CDN link to the `head` (or just inside `body` if necessary) to restore icons.
  - Link: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`

## Verification
1.  **Reports Nav**: Click "Reports". Verify the bottom bar stays visible. Verify the "Reports" icon is Blue.
2.  **Icons**: Verify the "Back" arrow on sub-pages (like Scenario Selection or Feedback) is visible.
