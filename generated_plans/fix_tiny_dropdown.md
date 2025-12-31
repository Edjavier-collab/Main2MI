# Fix Tiny Dropdown & Text Readability

The user reported that the "substance/behavior dropdown is too small to read". This is likely due to a missing mobile viewport configuration (causing the page to scale down) or the font size being below the readable threshold for iOS inputs (causing zoom or rendering issues).

## Proposed Changes

### Global Configuration
#### [MODIFY] [app/layout.tsx](file:///Users/javi/Antigravity_MI/Main2MI/app/layout.tsx)
- Add `export const viewport` configuration.
- Set `width: 'device-width'`, `initialScale: 1`, `maximumScale: 1`.
- This ensures the app renders at the correct logical pixel size on mobile devices, fixing the "tiny text" issue globally.

### UI Components
#### [MODIFY] [components/views/ScenarioSelectionView.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/ScenarioSelectionView.tsx)
- Add `text-base` (16px) or `text-lg` to the `<select>` inputs.
- Ensure `optgroup` and `option` elements inherit the readable font size.

## Verification
1.  Open Chrome DevTools -> Device Mode (iPhone SE).
2.  Check the "Scenario Selection" view.
3.  Verify the dropdown text is readable (at least 16px).
4.  Verify the page fits the width (no horizontal scrolling or "zoomed out" look).
