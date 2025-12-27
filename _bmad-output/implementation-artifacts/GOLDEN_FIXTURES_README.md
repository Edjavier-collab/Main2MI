# Golden Fixtures - Source of Truth

**Generated:** 2025-12-26  
**Purpose:** These fixtures serve as the "Source of Truth" for the Gemini feedback generation system before Bridge Adapter + Strangler Fig modernization begins.

---

## Fixture Structure

### Analyze-Session Fixtures (10 total)

**Location:** `analyze-session-fixture-001.json` through `analyze-session-fixture-010.json`

**Coverage:**
- **001-008**: Complete feedback responses with varying empathy scores (1-5)
- **009**: Edge case - insufficient data response
- **010**: Balanced approach example

**Key Variations:**
- Empathy scores: 1, 2, 3, 4, 5, 0 (insufficient data)
- Skill combinations: Various MI skill detections
- Feedback quality: From basic to exemplary
- Edge cases: Insufficient data, low scores, high scores

### Coaching-Summary Fixtures (5 total)

**Location:** `coaching-summary-fixture-001.json` through `coaching-summary-fixture-005.json`

**Coverage:**
- **001**: 5 sessions, moderate progression
- **002**: 3 sessions, foundational skills
- **003**: 8 sessions, advanced user with strong trends
- **004**: 4 sessions, improving but needs work
- **005**: 6 sessions, consistent strong performance

**Key Variations:**
- Session counts: 3, 4, 5, 6, 8
- Skill progression: Various trends (increasing/stable/decreasing)
- User levels: Beginner to advanced
- Focus areas: Different improvement themes

---

## Markdown Snapshots

### Analyze-Session Snapshots

**Location:** `analyze-session-snapshot-*.md`

**Coverage:**
- **001-free.md**: Free tier rendering of fixture 001
- **001-premium.md**: Premium tier rendering of fixture 001
- **003-premium.md**: Premium tier rendering of high-score fixture 003
- **009-insufficient-data.md**: Edge case rendering for insufficient data

**Purpose:** Capture exact UI rendering as users see it (both free and premium tiers)

### Coaching-Summary Snapshots

**Location:** `coaching-summary-snapshot-*.md`

**Coverage:**
- **001.md**: Standard 5-session summary rendering
- **003.md**: Advanced 8-session summary rendering

**Purpose:** Capture exact UI rendering of coaching summaries

---

## Contract Structure

### Analyze-Session Contract

**Required Fields:**
- `empathyScore` (integer 1-5, or 0 for insufficient data)
- `empathyBreakdown` (string, explanation)
- `whatWentRight` (string, 2-3 sentences with quotes)
- `areasForGrowth` (string, actionable suggestions)
- `skillsDetected` (string[], array of MI skill names)
- `nextFocus` (string, concise recommendation)
- `analysisStatus` ('complete' | 'insufficient-data' | 'error')

**Optional Fields:**
- `keyTakeaway` (string, single sentence)
- `constructiveFeedback` (string, key area + missed opportunity)
- `keySkillsUsed` (string[], skills used effectively)
- `skillCounts` (Record<string, number>, count per skill)
- `nextPracticeFocus` (string, actionable goal)
- `analysisMessage` (string, status message)

### Coaching-Summary Contract

**Required Fields:**
- `totalSessions` (number)
- `dateRange` (string, "MM/DD/YYYY to MM/DD/YYYY")
- `strengthsAndTrends` (string, markdown-formatted analysis)
- `areasForFocus` (string, 1-2 core themes)
- `summaryAndNextSteps` (string, encouraging summary + action)

**Optional Fields:**
- `skillProgression` (array of skill progression objects)
- `topSkillsToImprove` (string[], 1-2 skill names)
- `specificNextSteps` (string[], 2-3 actionable steps)

---

## Usage in Strangler Fig Process

### Phase 1: Freeze Behavior ✅ (COMPLETE)

These fixtures represent the "Before" state - the exact JSON contracts and rendered outputs that the current system produces.

### Phase 2: Bridge Adapter (NEXT)

Create adapter layer that:
- Accepts new implementation output
- Transforms to match these exact JSON contracts
- Ensures rendered Markdown matches these snapshots

### Phase 3: Dual-Run

Compare new implementation output against:
- **JSON Contracts**: Exact match required (with normalization rules)
- **Markdown Snapshots**: Semantic equivalence required (UI regression check)

### Phase 4: Cutover Gate

After 10 consecutive semantic-equal matches + human approval:
- Switch default to new implementation
- Remove legacy Edge Functions
- Clean up adapter layer

---

## Validation Rules

### JSON Contract Validation

1. **Required fields** must be present and non-empty
2. **Empathy score** must be integer 1-5 (or 0 for insufficient data)
3. **Skills arrays** must only contain valid MI skill names from master list
4. **Skill counts** must match detected skills
5. **Date formats** must match "MM/DD/YYYY" pattern

### Markdown Snapshot Validation

1. **Free tier** must show:
   - Empathy score (numeric) but not breakdown
   - What Went Right (fully visible)
   - Areas for Growth (blurred/locked)
   - First 2 skills only
   - Next Focus (locked card)

2. **Premium tier** must show:
   - Empathy score with circular gauge + breakdown
   - All sections fully visible
   - All detected skills in checklist
   - Next Focus (fully visible)

3. **Insufficient data** must show:
   - Special "Not Enough Data" UI
   - Clear explanation message
   - Action buttons (Start New Practice, Back to Dashboard)

---

## Maintenance

**DO NOT MODIFY** these fixtures once Strangler Fig process begins. They are the Source of Truth.

**If changes needed:**
1. Document why change is needed
2. Create new fixture version (e.g., `analyze-session-fixture-001-v2.json`)
3. Update this README with version notes
4. Get explicit approval before using new fixtures

---

**Status:** ✅ Golden fixtures captured and ready for Bridge Adapter implementation
