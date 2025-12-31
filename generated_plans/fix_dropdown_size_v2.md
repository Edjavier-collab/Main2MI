# Fix Dropdown Font Size (v2)

The user reports the dropdown text is still too small despite the viewport fix. This suggests we need to explicitly increase the font size of the input elements to match user expectations and ensure optimal mobile rendering.

## Proposed Changes

### Component Styling
#### [MODIFY] [components/views/ScenarioSelectionView.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/ScenarioSelectionView.tsx)
- Update the `<select>` elements for Topic, Difficulty, and Stage of Change.
- Change `text-base` (16px) to `text-lg` (18px).
- Add `style={{ fontSize: '18px' }}` to explicitly force the size (sometimes helps with native controls).

## Verification
1.  Reload the app on mobile.
2.  Open the dropdown.
3.  Confirm the text "Binge Drinking" etc. is significantly larger and readable.
