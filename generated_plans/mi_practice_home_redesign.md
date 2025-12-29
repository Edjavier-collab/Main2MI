# MI Practice Home View Redesign

## Goal Description
Redesign the `HomeView.tsx` screen to match the "Empathy in Practice" landing page requirements. This involves layout changes, removing old decorations, implementing a mesh gradient hero, and restyling the typography and buttons.

## Proposed Changes

### Views
#### [MODIFY] [HomeView.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/HomeView.tsx)
- **Header**: Remove `BranchDecoration`. Replace `GrowthLogo` with centered Logo + "MI Practice" text.
- **Hero**: Create a container with rounded corners and mesh gradient (`#D1F2FF`, `#F8F9FA`).
- **Typography**: 
    - H1: "Empathy in Practice" centered. Highlight "Practice" in Primary Blue.
    - Body: Centered paragraph, `text-secondary`.
- **Actions**: Move buttons to bottom, stacked vertically.
    - "Start Practicing": Full-width Primary Button.
    - "I already have an account": Full-width Ghost Button (with light border).
- **Footer**: "Designed for Clinicians" label with blue check icon.

### Assets
- Ensure "check icon" is available (use Lucide-React `Check` or `CheckCircle`).

## Verification Plan

### Manual Verification
- Verify the layout matches the description:
    - Logo centered at top.
    - Gradient hero section.
    - "Empathy in Practice" title correctly colored.
    - Buttons stacked at bottom.
    - Footer present.
