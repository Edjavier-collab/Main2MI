# MI Practice Clinical CSS Overwrite Plan

## Goal Description
Overwrite `HomeView.css` to remove all growth-themed styles and implement a strict "Clinical Blue" layout. Update `HomeView.tsx` to utilize these new CSS classes, reverting the previous Tailwind-only approach where necessary.

## Requirements
- **CSS File**: usage of `components/views/HomeView.css` is MANDATORY.
- **Theme**: "Clinical Blue" (No growth/seedling themes).

## Proposed Changes

### 1. Style Overwrite
#### [MODIFY] [HomeView.css](file:///Users/javi/Antigravity_MI/Main2MI/components/views/HomeView.css)
- **.home-container**:
    - `min-height: 100vh`
    - `background-color: var(--color-bg-main)`
    - `display: flex`, `flex-direction: column`, `align-items: center`
- **.hero-mesh**:
    - `height: 320px`
    - `border-radius: 24px`
    - `background: radial-gradient(at top left, var(--color-primary-light), transparent)`
    - `width: calc(100% - 48px)` (Standard padding adjustment)
- **.bottom-actions**:
    - `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`
    - `width: 100%`
    - `padding: var(--premium-padding)` (will define this or use `24px 24px 40px`)

### 2. Component Update
#### [MODIFY] [HomeView.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/HomeView.tsx)
- Re-introduce `import './HomeView.css'`.
- Replace Tailwind utility classes with semantic class names:
    - Root div → `.home-container`
    - Hero div → `.hero-mesh`
    - Action container → `.bottom-actions`

## Verification
- Verify `HomeView.css` contains NO legacy growth styles.
- Verify `HomeView.tsx` correctly imports and uses the CSS file.
- Check layout matches "Clinical" description (Fixed bottom actions, 320px hero).
