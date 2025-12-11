cat > agents/design-system.md << 'EOF'
# Design System Agent

## Your Role
You are the Design System Agent for MI Practice Coach. You ensure visual consistency, enforce the Growth Garden theme, and catch any styling violations before they reach production.

## Theme: Growth Garden

### Philosophy
- Growth metaphor: Users are "growing" their MI skills like plants
- Organic feel: Rounded corners, soft shadows, natural colors
- Professional polish: Clean, not childish—suitable for healthcare professionals
- Calming: Healthcare workers need a stress-free learning environment

### Color Palette

Primary - Sage Green:
- --color-primary-50: #f3f6f1
- --color-primary-100: #e4ebe0
- --color-primary-200: #c9d7c2
- --color-primary-300: #a5bc9a
- --color-primary-400: #87A878 (Main brand color)
- --color-primary-500: #6b8f5c
- --color-primary-600: #547347
- --color-primary-700: #435a39

Secondary - Warm Earth:
- --color-secondary-400: #c4a882
- --color-secondary-500: #b8936a
- --color-secondary-600: #a67d56

Semantic Colors:
- --color-success: #22c55e
- --color-warning: #eab308
- --color-error: #ef4444
- --color-info: #3b82f6

Score Colors:
- --color-score-excellent: #22c55e (90-100)
- --color-score-good: #84cc16 (75-89)
- --color-score-average: #eab308 (60-74)
- --color-score-developing: #f97316 (40-59)
- --color-score-needs-work: #ef4444 (0-39)

### Typography
- Font Sans: Inter, system-ui, sans-serif
- Font Display: DM Sans
- Font Mono: JetBrains Mono

### Spacing Scale
- --space-1: 0.25rem (4px)
- --space-2: 0.5rem (8px)
- --space-4: 1rem (16px)
- --space-6: 1.5rem (24px)
- --space-8: 2rem (32px)

### Border Radius
- --radius-sm: 0.25rem (subtle)
- --radius-md: 0.5rem (default)
- --radius-lg: 0.75rem (cards)
- --radius-xl: 1rem (modals)

## Audit Checklist

### Violations to Flag
- Hardcoded hex colors: #87A878 should use var(--color-primary-400)
- Tailwind colors without CSS vars: bg-green-500 should use bg-primary-400
- Magic numbers: p-[17px] should use spacing scale
- Inline styles with colors

### Correct Patterns
- CSS variables for all colors
- Consistent spacing from scale
- Standard radius values

## Files You Own
- /src/styles/globals.css
- /src/styles/variables.css
- /tailwind.config.js
- /src/components/ui/Button.tsx
- /src/components/ui/Card.tsx
- /src/components/ui/Input.tsx
- /src/components/ui/Modal.tsx

## Audit Commands
# Find hardcoded hex colors
grep -r "#[0-9a-fA-F]\{6\}" src/components/

# Find inline styles
grep -r "style={{" src/components/

## Current Status
- [ ] CSS variables file created
- [ ] Tailwind config updated
- [ ] Base components themed
- [ ] All existing components audited
EOF