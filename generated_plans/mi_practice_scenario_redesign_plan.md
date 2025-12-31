# MI Practice Scenario Selection Redesign Plan

## Goal Description
Redesign `ScenarioSelectionView.tsx` to replace the complex dropdown filters with a streamlined, clinical-style vertical list of "Patient Profile" cards. Each card will represent a specific scenario with visual tags for difficulty and category.

## Requirements
- **Layout**: Single-column vertical list.
- **Card Design**:
    - Styling: `var(--radius-md)`, `var(--shadow-sm)`.
    - Content: Left placeholder avatar/icon, Title, Description.
    - Spacing: Generous whitespace (`.space-premium` class).
- **Tags**:
    - **Difficulty**: Pill-shaped badges (Bg: `var(--color-primary-light)`, Text: `var(--color-primary-darker)`).
    - **Category**: Optional additional badge for substance type (Alcohol, etc.).
- **Data Logic**:
    - Map existing `PATIENT_PROFILE_TEMPLATES` to cards.
    - **Smart Tagging**: Infer "Difficulty" based on `typicalTraits` (e.g., *Defensive* → **Advanced**, *Pleaser* → **Beginner**).

## Proposed Changes

### 1. Component Logic (`ScenarioSelectionView.tsx`)
- **Remove**: `CustomSelect` component and state (`selectedTopic`, `selectedStage`, etc.).
- **Add**: Helper function `getDifficultyFromTraits(traits: string[])` to assign badges dynamicallly.
- **Render**: Map `PATIENT_PROFILE_TEMPLATES` to a list of cards.

### 2. Styles
- Define `.space-premium` in a local style block or CSS file (if using explicit classes) or use Tailwind `space-y-6`.
- styling for badges using the requested variables.

### 3. Card Interaction
- Clicking a card triggers `onStartPractice` with the specific `topic` and the *inferred* (or default) `difficulty` and `stage`.

## Mockup Structure
```tsx
<div className="max-w-2xl mx-auto space-y-6 p-6">
  {PATIENT_PROFILE_TEMPLATES.map(profile => (
    <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6 flex gap-4 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => handleSelect(profile)}>
       {/* Left Icon */}
       <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
         <UserIcon />
       </div>
       
       {/* Content */}
       <div className="flex-1">
         <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-900">{profile.topic}</h3>
            <span className="bg-[var(--color-primary-light)] text-[var(--color-primary-darker)] px-2 py-1 rounded-full text-xs font-semibold">
              {getDifficultyFromTraits(profile.typicalTraits)}
            </span>
         </div>
         <p className="text-gray-500 text-sm mt-1">{profile.presentingProblem}</p>
       </div>
    </div>
  ))}
</div>
```
