# MI Practice Design System Update

## Goal Description
Update the existing web application to match the "MI Practice" professional healthcare PWA design system. This involves replacing the current "Seafoam" theme with a "Primary Blue" (#4A90E2) theme, updating typography to Inter/Roboto, and refining Card and Button components to meet specific visual requirements.

## Proposed Changes

### Design Tokens & Theme
#### [MODIFY] [theme.css](file:///Users/javi/Antigravity_MI/Main2MI/styles/theme.css)
- Update `--color-primary` family to Blue (#4A90E2).
- Update `--color-bg-main` to Off-White (#F8F9FA).
- Update `--color-text-*` variables (Text Dark Grey #333333).
- Update `--radius-*` variables (Card radius 16px, Button radius 12px).
- Update `--font-family` to Inter/Roboto.
- Update shadows to match "slight drop shadow" requirement.

#### [MODIFY] [index.css](file:///Users/javi/Antigravity_MI/Main2MI/index.css)
- Ensure imports are correct and overrides are minimal.

### Components
#### [MODIFY] [Button.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/ui/Button.tsx)
- Ensure Primary variant uses full-width, 12px border-radius, and shadow.
- Ensure Secondary variant uses ghost style with light grey border.

#### [MODIFY] [Card.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/ui/Card.tsx)
- Update base styles to have white background, 1px border (#E1E4E8), and 16px border-radius.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no type errors or build failures with the new styles.

### Manual Verification
- Since this is a visual update, I will need to rely on code correctness.
- Inspect `components/ui/Button.tsx` and `components/ui/Card.tsx` to ensure they use the new CSS variables or Tailwind classes correctly.
