# FeedbackView Snapshot - Insufficient Data (Edge Case)
**Fixture:** `analyze-session-fixture-009.json`  
**Empathy Score:** 0/5  
**Tier:** Free  
**Status:** insufficient-data

---

## Rendered Output (Insufficient Data)

### Header
[Warning icon in circle]

**Not Enough Data**

We didn't receive any clinician responses, so there isn't enough information to interpret this encounter. Try another session when you're ready to practice.

---

### Footer Actions
[Upgrade to Premium] [Primary button, Award icon] (if free tier)

[Start a New Practice] [Primary button] (if onStartPractice provided)

[Back to Dashboard] [Ghost button]

---

## Key Behaviors Observed

1. **Special UI**: Shows warning icon and special "Not Enough Data" card instead of normal feedback layout
2. **Clear Message**: Explains why feedback couldn't be generated
3. **Actionable Next Steps**: Provides clear guidance to try another session
4. **No Feedback Sections**: None of the normal feedback sections are shown
5. **Tier-Aware**: Still shows upgrade CTA if free tier, but primary action is to start new practice

---

## Edge Case Handling

- **analysisStatus**: 'insufficient-data' triggers special UI
- **analysisMessage**: Used as the main explanation text
- **Empty Skills**: skillsDetected is empty array, skillCounts is empty object
- **Zero Score**: empathyScore is 0 (not a real score, just placeholder)
