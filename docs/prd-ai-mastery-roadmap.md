---
title: AI-Powered Mastery Roadmap
feature: AI-Powered Mastery Roadmap
status: draft
date: 2025-12-26
product_owner: Sarah
sections_completed: [goals, user_flows]
last_section: user_flows
---

# PRD: AI-Powered Mastery Roadmap

## Product Overview

**Feature Name:** AI-Powered Mastery Roadmap  
**Product Owner:** Sarah  
**Date:** 2025-12-26  
**Status:** Draft

### Summary

The AI-Powered Mastery Roadmap provides users with a visual representation of their MI skill progression and AI-driven recommendations for their next practice scenario. This feature integrates seamlessly with the existing gamification system (XP, badges, streaks) to create a cohesive, game-like experience that guides users toward mastery.

### Requirements

1. **Visual Roadmap:** Users need a visual (like a progress path or updated radar chart) showing where they are in their mastery.
2. **AI Navigator:** Use the existing Gemini service to analyze user XP and session history to recommend the exact next scenario they should practice.
3. **Integration:** This must tie into the existing useXP and useBadges hooks so it feels like one cohesive "game."

---

## Goals

### Fundamental Truths (First Principles)

**What Mastery Actually Is:**
- Mastery = competency across 6 core MI skills (Reflective Listening, Open Questions, Affirmations, Summarizing, Evoking Change Talk, Rolling with Resistance)
- Mastery is measured by practice quality (empathy scores, skill usage patterns), not quantity (session count, XP)
- Mastery requires deliberate practice targeting specific skill gaps

**What Data We Actually Have:**
- Session feedback contains real mastery indicators: `empathyScore`, `skillsDetected`, `skillCounts`, `areasForGrowth`
- XP/levels measure engagement/consistency, not actual MI competency
- Each session's feedback provides actionable skill gap data

**What Users Actually Need:**
- Clear answer to "What skill should I practice next?"
- Understanding of their current competency level per skill
- Confidence that recommendations are based on their actual performance, not generic advice

### Essential Goals (Must-Have for Mastery Path)

1. **Skill Competency Calculation**
   - Define how to calculate competency level per skill from feedback data
   - Formula: Combine empathy scores + skill usage frequency + skill detection patterns
   - Thresholds: Define "beginner" (0-2), "intermediate" (3-4), "advanced" (4.5-5) per skill
   - **Constraint:** Must use existing feedback data structure (empathyScore, skillsDetected, skillCounts)
   - **Reverse Engineering Insight:** ⚠️ **CRITICAL FOUNDATION** - All other goals depend on this
   - **What If Insight:** Must handle edge cases where user has inconsistent scores across sessions
   - **Dependency:** None (foundational)

2. **Scenario-to-Skill Mapping**
   - Map each patient scenario type to MI skills it exercises
   - Define: "Resistant patient" → targets "Rolling with Resistance" + "Evoking Change Talk"
   - Define: "Ambivalent patient" → targets "Evoking Change Talk" + "Reflective Listening"
   - Create mapping table/database for all scenario types
   - **Constraint:** Must integrate with existing patientService scenario generation
   - **Reverse Engineering Insight:** ⚠️ **MISSING FOUNDATION** - Recommendations impossible without this mapping
   - **What If Insight:** Must include tier availability (Free vs Premium scenarios) in mapping
   - **Dependency:** None (foundational, but must align with patientService)

3. **Skill Gap Identification**
   - Analyze session history to identify weakest MI skills
   - Use calculated competency levels (Goal #1) to find gaps
   - Prioritize skills furthest from mastery
   - **Constraint:** Requires skill competency calculation (Goal #1)
   - **Reverse Engineering Insight:** Essential - user can't practice effectively without knowing gaps
   - **What If Insight:** Must handle cases where user has one skill far behind others (adaptive prioritization)
   - **Dependency:** Requires Goal #1

4. **Skill-Based Progress Visualization**
   - Show calculated competency level across 6 core MI skills
   - Visualize skill gaps using competency calculations
   - Make it clear which skills are strengths vs areas for growth
   - **Constraint:** Must use calculated competency levels (Goal #1)
   - **Trade-off:** Rich skill radar chart (shows all 6 skills) vs simple progress bars (easier to understand)
   - **User Validation:** ✅ All personas want skill visualization; radar chart preferred
   - **Reverse Engineering Insight:** Essential - user must see current state to know what to improve
   - **What If Insight:** Visualization should adapt when one skill is far behind (highlight that skill)
   - **Dependency:** Requires Goal #1

5. **Personalized Scenario Recommendation**
   - Recommend next scenario based on skill gaps (Goal #3) and scenario mapping (Goal #2)
   - Explain why this scenario helps (connect to specific skill gap)
   - Make recommendation feel personalized, not random
   - **Constraint:** Requires skill gap identification + scenario mapping
   - **Trade-off:** AI-generated recommendation (more nuanced) vs rule-based recommendation (more predictable, faster)
   - **User Validation:** ✅ All personas want personalized recommendations
   - **Reverse Engineering Insight:** Essential - this is the actionable output users need
   - **What If Insight:** Should provide top 3 recommendations, not just one (allows user preference)
   - **What If Insight:** Must filter by tier availability (Free users get Free scenarios)
   - **Dependency:** Requires Goals #2 and #3

6. **Recommendation Confidence & Fallbacks**
   - Determine confidence level for recommendations (high/medium/low)
   - Provide fallback recommendations when user has insufficient data (< 3 sessions)
   - Explain when recommendations are based on limited data
   - **Constraint:** Must handle edge cases (new users, sparse data)
   - **Reverse Engineering Insight:** ⚠️ **MISSING** - Need graceful degradation for new users
   - **What If Insight:** Must have rule-based fallback when AI fails (Gemini API down)
   - **What If Insight:** Should show multiple options when confidence is low
   - **Dependency:** Requires Goal #5

### Supporting Goals (Important but Not Blocking)

7. **Data-Driven Skill Gap Analysis**
   - Analyze session history to identify weakest MI skills
   - Use actual feedback data (empathy scores, skill detection patterns) not XP/levels
   - **Constraint:** Must map patient scenarios to MI skills they exercise
   - **Trade-off:** Deep AI analysis of all sessions (accurate, slower) vs rule-based analysis of recent sessions (faster, good enough)
   - **User Validation:** ✅ Advanced users want trend analysis; beginners want simple current state
   - **Reverse Engineering Insight:** Supports Goal #3, but not essential for basic mastery path
   - **What If Insight:** Should analyze last 10-20 sessions for performance, not all sessions

8. **Trend Analysis (Premium Feature)**
   - Show skill progression over time (e.g., "Rolling with Resistance improved 15% over last 10 sessions")
   - Identify improving vs declining skills
   - Help advanced users see patterns beyond single-session feedback
   - **User Validation:** ✅ Advanced users specifically requested this
   - **Reverse Engineering Insight:** Nice-to-have for advanced users, not essential for mastery
   - **What If Insight:** Should detect stagnation patterns and suggest alternative learning approaches

9. **Tier-Appropriate Complexity**
   - Free tier: Simple skill visualization, basic recommendations
   - Premium tier: Advanced trend analysis, detailed explanations, historical patterns
   - **User Validation:** ✅ Different needs by tier
   - **Reverse Engineering Insight:** Improves experience but mastery path works for both tiers
   - **What If Insight:** Must ensure Free tier recommendations only suggest Free-accessible scenarios

10. **Gamification Integration (Reframed)**
    - Use XP/levels/badges for engagement and motivation
    - Use roadmap for actual skill development guidance
    - Keep them separate but complementary: gamification = fun, roadmap = learning
    - **Constraint:** Must not confuse engagement metrics (XP) with mastery metrics (skill competency)
    - **Trade-off:** Tight integration (feels cohesive) vs clear separation (avoids confusion)
    - **User Validation:** ⚠️ **CRITICAL:** All users confused about XP vs mastery
    - **Reverse Engineering Insight:** Important for UX clarity, but not part of mastery achievement path

### Clarity Goals (Critical UX, Not Mastery-Related)

11. **Clarity on Mastery vs Engagement**
    - Make it clear that XP/levels = engagement, roadmap = actual skill development
    - Users should understand both systems serve different purposes
    - Avoid conflating "leveling up" with "becoming more skilled"
    - **User Validation:** ⚠️ **HIGH PRIORITY:** All personas expressed confusion - this is a critical UX requirement
    - **Reverse Engineering Insight:** Prevents confusion but doesn't enable mastery

12. **Actionable Skill Development**
    - Roadmap must lead to specific actions (practice this scenario, focus on this skill)
    - Not just "here's where you are" but "here's what to do next"
    - Recommendations must be specific and explainable
    - **User Validation:** ✅ All personas want actionable next steps
    - **Reverse Engineering Insight:** Covered by Goal #5, but worth emphasizing

13. **Performance & Scalability**
    - Roadmap analysis should not slow down app load times
    - Batch updates after session completion, not on-demand
    - Cache roadmap state to avoid repeated analysis
    - **New Insight:** Can analyze last 10-20 sessions instead of all sessions for faster performance
    - **User Validation:** ✅ No performance concerns raised
    - **Reverse Engineering Insight:** Technical requirement, not a mastery goal

14. **Visual Clarity**
    - Roadmap must complement, not compete with existing gamification
    - Consider placement: separate view vs integrated into Dashboard
    - Ensure visual hierarchy guides user to next action
    - **User Validation:** ✅ Radar chart preferred
    - **Reverse Engineering Insight:** UX requirement, supports Goal #4

### New Goals Revealed Through What If Scenarios

15. **Resilience & Fallbacks**
    - Roadmap must work even when Gemini API fails or is rate-limited
    - Provide rule-based fallback recommendations when AI is unavailable
    - Show last known roadmap state with "last updated" timestamp
    - Clear error messaging when AI services are down
    - **What If Insight:** ⚠️ **CRITICAL** - Feature becomes useless if AI fails without fallback

16. **Recommendation Accuracy Validation**
    - Track whether following recommendations actually improves target skills
    - Allow users to rate recommendation quality ("Was this helpful?")
    - Use feedback to improve recommendation algorithm
    - **What If Insight:** ⚠️ **IMPORTANT** - Need validation loop to ensure recommendations are effective

17. **User Preference Integration**
    - Balance skill gap recommendations with user topic preferences
    - Allow users to filter recommendations by topic (Alcohol, Smoking, etc.)
    - Show top 3 recommendations instead of single recommendation (allows user choice)
    - **What If Insight:** ⚠️ **IMPORTANT** - Users might ignore recommendations that don't match preferences

18. **Tier-Aware Recommendations**
    - Filter recommendations to only suggest scenarios available to user's tier
    - Free users should never see Premium-only scenario recommendations
    - Can use roadmap as upgrade prompt (but must be careful not to frustrate)
    - **What If Insight:** ⚠️ **CRITICAL** - Recommending unavailable scenarios creates frustration

19. **Expectation Management**
    - Set realistic expectations: "Practice this scenario 3-5 times before expecting improvement"
    - Explain that skill development isn't linear (scores may fluctuate)
    - Celebrate practice consistency, not just score increases
    - **What If Insight:** ⚠️ **IMPORTANT** - Users need to understand improvement takes time

20. **Stagnation Detection & Intervention**
    - Detect when users have many sessions but aren't improving
    - Suggest alternative learning approaches (resources, coaching summaries)
    - Celebrate small improvements that might not show in aggregate scores
    - **What If Insight:** ⚠️ **IMPORTANT** - Users need guidance when stuck, not just more practice

---

## User Flows

### Flow 1: Primary Discovery & Practice Flow

**Entry Point:** User on Dashboard sees roadmap widget

**Steps:**
1. **Dashboard View**
   - User sees "Your Mastery Roadmap" card with mini skill radar (6 skills)
   - Recommendation displayed: "Practice with [scenario type] to improve [skill]"
   - User clicks "View Full Roadmap" or recommendation button

2. **Roadmap View Navigation**
   - Full skill radar chart displays (all 6 MI skills)
   - Skill competency bars show levels (Beginner 0-2, Intermediate 3-4, Advanced 4.5-5)
   - Primary recommendation card shows:
     - Scenario name and type
     - Target skill and current competency level
     - Reason: "Your [skill] is at 2.1/5. Practice with [scenario] to improve."
   - (Premium) Top 3 alternative recommendations displayed below primary

3. **Start Practice from Recommendation**
   - User clicks "Start Practice" on recommendation
   - **If Premium:** Navigate to ScenarioSelectionView with recommendation highlighted/banner
   - **If Free:** Generate patient matching recommendation → Navigate to PracticeView
   - Recommendation filters pre-applied (scenario type, difficulty level)

4. **Complete Practice Session**
   - Practice session targets recommended skill gap
   - User receives feedback with skill-specific analysis
   - Feedback highlights progress on target skill

5. **Return to Dashboard/FeedbackView**
   - "Roadmap Updated" notification appears
   - Option to navigate to roadmap to see updated skill levels
   - New recommendation reflects updated skill state

---

### Flow 2: Post-Session Roadmap Update Flow

**Entry Point:** User completes practice session

**Steps:**
1. **Session Completion**
   - FeedbackView displays session feedback
   - Shows empathy score, skills detected, areas for growth
   - Feedback includes skill-specific insights

2. **Roadmap Update Prompt**
   - FeedbackView shows "Roadmap Updated" card
   - Displays which skill was practiced: "You practiced [skill]"
   - Shows competency change if applicable: "[Skill] improved from 2.1 to 2.5"
   - Button: "View Updated Roadmap →"

3. **Navigate to Updated Roadmap**
   - User clicks to view roadmap
   - Skill radar updates with new session data
   - Competency levels recalculated automatically
   - New recommendation generated based on updated skill gaps
   - (If improvement detected) Celebration message: "Your [skill] improved! 🎉"

4. **See Next Recommendation**
   - Updated recommendation reflects new skill state
   - May recommend same skill (if still weak) or pivot to different skill (if improved)
   - Recommendation explains why: "Continue practicing [skill] to reach intermediate level" or "Now focus on [new skill] which is your next gap"

---

### Flow 3: Dashboard Widget Quick Flow

**Entry Point:** User on Dashboard (no navigation needed)

**Steps:**
1. **Dashboard View**
   - User sees Global MI Score card (dark theme, circular progress)
   - Roadmap widget displayed below Quick Stats
   - Mini skill radar shows 6 skills at a glance
   - Recommendation card shows next practice focus with "Practice" button

2. **Direct Practice Start**
   - User clicks recommendation button directly from Dashboard
   - Bypasses full roadmap view for speed
   - Starts practice immediately with recommended scenario
   - Fast path for users who trust recommendations

3. **Post-Practice Update**
   - User completes practice session
   - Returns to Dashboard
   - Roadmap widget updates automatically (no refresh needed)
   - New recommendation appears in widget

---

### Flow 4: New User Onboarding Flow

**Entry Point:** User has 0-2 sessions completed

**Steps:**
1. **Initial Dashboard View**
   - Roadmap widget shows: "Complete 3+ sessions to see your personalized roadmap"
   - Placeholder visualization (empty radar chart with message)
   - Generic encouragement: "Start practicing to build your skill profile"
   - Progress indicator: "0/3 sessions completed"

2. **First Session Completion**
   - FeedbackView shows: "Great start! Complete 2 more sessions to see your skill roadmap"
   - No roadmap update yet (insufficient data threshold)
   - Progress indicator updates: "1/3 sessions completed"

3. **Third Session Completion**
   - FeedbackView shows: "Your roadmap is ready! View it now →"
   - Roadmap now displays initial skill levels
   - Shows first recommendation:
     - **If AI available:** AI-generated personalized recommendation
     - **If AI unavailable:** Rule-based fallback (weakest skill from available data)
   - Onboarding tooltip: "This roadmap shows your skill levels and recommends what to practice next"

---

### Flow 5: Error & Edge Case Flows

#### Scenario A: AI Service Unavailable

**Steps:**
1. **Roadmap View with Fallback**
   - Roadmap loads with cached/last-known state
   - Shows "Last updated: [timestamp]" badge
   - Displays rule-based fallback recommendation
   - Message: "Using rule-based recommendations. AI analysis temporarily unavailable."
   - Skill visualization still works (uses existing session data)

2. **Functional Degradation**
   - User can still use roadmap features
   - Skill competency calculations work (uses existing feedback data)
   - Recommendations use rule-based logic:
     - Identifies weakest skill from skillCounts
     - Maps to scenario type that targets that skill
     - No AI-generated explanations, but still actionable

#### Scenario B: Insufficient Data (< 3 sessions)

**Steps:**
1. **Roadmap View with Limited Data**
   - Shows: "Complete 3+ sessions to see personalized recommendations"
   - Generic encouragement message
   - Progress indicator: "[X]/3 sessions completed"
   - (Optional) Shows generic practice tips or learning resources link

2. **Progressive Disclosure**
   - After 1 session: "Complete 2 more sessions..."
   - After 2 sessions: "Complete 1 more session to unlock your roadmap"
   - After 3 sessions: Full roadmap unlocks

#### Scenario C: User Ignores Recommendation

**Steps:**
1. **Recommendation Displayed**
   - User views recommendation but chooses different scenario
   - User navigates to ScenarioSelectionView
   - Recommendation banner shows but user selects different option

2. **Alternative Practice**
   - User completes practice with different scenario
   - Roadmap still updates with actual practice data
   - System learns from user choice (may influence future recommendations)

3. **Adaptive Recommendation**
   - Next recommendation adapts to what user actually practiced
   - May show: "You practiced [different skill]. Here's how to improve [original target skill] next time."

#### Scenario D: Premium User Sees Free-Only Recommendation

**Steps:**
1. **Tier-Aware Filtering**
   - Roadmap filters recommendations to Premium-accessible scenarios only
   - If all recommendations would be Premium-only, shows upgrade prompt
   - Message: "Upgrade to Premium to access advanced scenarios targeting [skill]"
   - (Alternative) Shows Free alternatives that still help with skill gap

2. **Free User Experience**
   - Free users never see Premium-only scenario recommendations
   - Recommendations only suggest Free-accessible scenarios
   - Upgrade prompts are contextual, not frustrating

---

### Persona-Specific Flow Variations

#### Free Beginner (5 sessions, 2 remaining)
**Flow Modifications:**
- Dashboard widget shows session count context: "Use 1 of 2 remaining sessions to practice [skill]"
- Skill level tooltips explain: "2.1/5 = Beginner level. Practice to reach Intermediate (3.0+)"
- Recommendation includes tier filter: Only suggests Free-accessible scenarios
- Post-session: Shows progress toward unlocking full roadmap features

**Key Enhancements:**
- Clear skill level explanations (Beginner 0-2, Intermediate 3-4, Advanced 4.5-5)
- Session count awareness in recommendations
- Upgrade prompts are contextual, not aggressive

#### Premium Intermediate (25 sessions, active user)
**Flow Modifications:**
- Dashboard quick flow is primary path (one-click practice)
- Full roadmap shows trend indicators: "↑ Improving" or "→ Stable" per skill
- Top 3 alternatives always displayed for flexibility
- Post-session updates show trend: "Your Reflections improved from 3.1 to 3.4 (↑ 0.3)"

**Key Enhancements:**
- Trend visualization (improving/declining/stable) for each skill
- Flexibility to skip recommendation and choose alternative
- Historical context: "This skill has improved 15% over last 10 sessions"

#### Premium Advanced (80+ sessions, skill maintenance)
**Flow Modifications:**
- Roadmap highlights stagnation: "Your [skill] has plateaued. Try alternative approaches."
- Shows declining skills with intervention suggestions
- Recommendations include variety to avoid repetition
- Advanced analytics: Skill progression charts, stagnation detection

**Key Enhancements:**
- Stagnation detection: "No improvement in [skill] over last 5 sessions"
- Alternative learning paths: "Try coaching summaries or resource library for [skill]"
- Variety in recommendations: Rotates scenario types even for same skill

#### Free at Limit (3 sessions used, considering upgrade)
**Flow Modifications:**
- Recommendations show upgrade prompt: "Upgrade to Premium to practice [scenario type]"
- Roadmap remains visible but recommendations are tier-filtered
- Clear value proposition: "Unlock unlimited practice + advanced scenarios"
- Respectful upgrade prompts: Show value, don't frustrate

**Key Enhancements:**
- Never hide roadmap when at limit (frustrating)
- Clear upgrade messaging: "This recommendation requires Premium"
- Show what they're missing: "Premium users get 3 alternative recommendations"

#### New User (1-2 sessions, just starting)
**Flow Modifications:**
- Progressive disclosure: "Complete 3+ sessions to unlock personalized roadmap"
- First-time roadmap view includes guided tooltip tour
- Explains why 3 sessions: "We need 3 sessions to accurately assess your skills"
- Generic encouragement: "Keep practicing to build your skill profile"

**Key Enhancements:**
- Onboarding tooltips: "This radar chart shows your skill levels across 6 core MI skills"
- Progress indicator: "2/3 sessions completed - almost there!"
- First recommendation includes explanation: "Based on your first 3 sessions, we recommend..."

---

### Flow Integration Points

**With Existing App Flows:**
- **Dashboard Integration:** Roadmap widget appears after Quick Stats, before Level Progress
- **Scenario Selection:** Premium users see recommendation banner/highlight in ScenarioSelectionView
- **Feedback View:** Post-session prompt to view updated roadmap
- **Navigation:** New `View.Roadmap` added to View enum, accessible from Dashboard and BottomNavBar
- **Gamification:** Roadmap complements (doesn't replace) XP/levels/badges - clear separation maintained

**Entry Points Summary:**
1. Dashboard widget (mini roadmap + recommendation)
2. Dedicated Roadmap view (full visualization + detailed recommendations)
3. Post-session prompt (after completing practice)
4. Bottom navigation (new "Roadmap" tab option for Premium users)

**Decision Points:**
- User chooses to view full roadmap vs start practice immediately
- User accepts recommendation vs selects alternative scenario
- User views roadmap update vs continues to next session
- Premium vs Free tier determines available scenarios and features
- User at session limit sees upgrade prompts vs hidden recommendations

**Error Handling:**
- AI unavailable → Rule-based fallback with clear messaging
- Insufficient data → Progressive disclosure with progress indicator
- Network failure → Cached state with "last updated" timestamp
- Invalid recommendation → Fallback to generic practice tips
- User at limit → Show recommendations with upgrade prompts (don't hide)

---

### UX Enhancements from Persona Feedback

**Tooltips & Help Text:**
- Skill level explanations: Hover tooltip shows "Beginner (0-2): Developing basic competency"
- Competency score tooltips: "2.1/5 means you're at Beginner level. Practice to reach Intermediate (3.0+)"
- Recommendation explanation: "Why this scenario? It targets [skill] which is your weakest area (2.1/5)"

**Onboarding & Guidance:**
- First-time roadmap tour: Guided tooltips explaining each section
- Progress indicators: "2/3 sessions completed - unlock your roadmap!"
- Why 3 sessions: "We analyze your first 3 sessions to create an accurate skill profile"

**Tier-Aware Messaging:**
- Free users: "This recommendation uses 1 of 2 remaining sessions"
- Free at limit: "Upgrade to Premium to practice this scenario + get unlimited sessions"
- Premium users: "You have 3 alternative recommendations below"

**Trend Visualization (Premium):**
- Skill trend indicators: ↑ Improving, → Stable, ↓ Declining
- Historical context: "This skill improved 15% over last 10 sessions"
- Stagnation alerts: "No improvement detected. Try alternative learning approaches"

**Flexibility & Control:**
- Skip recommendation option: "Practice something else today"
- Alternative recommendations: Always show top 3 (Premium) or 1 alternative (Free)
- Deviation handling: Roadmap updates based on actual practice, not just recommendations

---

### Path Mapping: Decision Trees & Alternative Flows

#### Entry Point 1: Dashboard Widget

**Path 1A: Quick Start (Trust Recommendation) - 40% usage**
```
Dashboard Widget → Click "Practice" → PracticeView → FeedbackView → Dashboard
```
- **Decision:** Trust recommendation immediately
- **Exit:** Back to Dashboard with updated widget
- **User Type:** Power users, regular practitioners
- **Success Metric:** User completes recommended practice session

**Path 1B: Explore First (View Full Roadmap) - 10% usage**
```
Dashboard Widget → Click "View Full" → Roadmap View → [Decision Branch]
  ├─ Accept Recommendation → PracticeView
  ├─ Select Alternative → PracticeView
  └─ Explore Only → Navigate Away
```
- **Decision:** Want more detail before practicing
- **User Type:** Curious users, first-time roadmap viewers
- **Success Metric:** User views full roadmap and takes action

**Path 1C: Ignore (Continue Browsing) - 5% usage**
```
Dashboard Widget → [No action] → Stays on Dashboard → Other actions
```
- **Decision:** Not ready to practice yet
- **Exit:** User navigates elsewhere (Settings, Reports, Resource Library)
- **User Type:** Explorers, users not in practice mode
- **Note:** Non-intrusive UX - roadmap doesn't block other actions

---

#### Entry Point 2: FeedbackView Post-Session

**Path 2A: View Updated Roadmap - 25% usage**
```
FeedbackView → Click "View Updated Roadmap" → Roadmap View → [Decision Branch]
  ├─ Accept New Recommendation → PracticeView
  ├─ Explore Updated Skills → Stay on Roadmap
  └─ Satisfied → Dashboard
```
- **Decision:** Want to see how session affected skills
- **User Type:** Engaged learners, users tracking progress
- **Success Metric:** User views roadmap and sees improvement

**Path 2B: Skip Roadmap (Continue to Dashboard) - 15% usage**
```
FeedbackView → Click "Done" → Dashboard → [Sees updated widget]
```
- **Decision:** Satisfied with feedback, don't need roadmap detail
- **Exit:** Dashboard (roadmap widget auto-updates in background)
- **User Type:** Experienced users, quick session completers
- **Note:** Roadmap still updates, just not viewed immediately

**Path 2C: Start Another Session (Future Enhancement) - 0% usage**
```
FeedbackView → "Practice Again" → PracticeView
```
- **Decision:** Want to practice again immediately
- **Status:** Not currently implemented - potential future enhancement
- **User Type:** Power users, intensive practice sessions
- **Consideration:** May want "Practice Again" button that uses updated recommendation

---

#### Entry Point 3: Bottom Navigation (Premium)

**Path 3A: Direct Roadmap Access - 5% usage**
```
BottomNav "Roadmap" → Roadmap View → [Decision Branch]
  ├─ Accept Recommendation → PracticeView
  ├─ Explore Skills → Stay on Roadmap
  └─ Navigate Elsewhere
```
- **Decision:** User actively seeking roadmap
- **User Type:** Premium users exploring features
- **Success Metric:** User finds value in dedicated roadmap view

**Path 3B: Roadmap → Practice - 3% usage**
```
BottomNav → Roadmap View → Click Recommendation → PracticeView
```
- **Decision:** Found recommendation, ready to practice
- **User Type:** Premium users using roadmap as primary navigation
- **Note:** Less common but important for roadmap-as-hub users

---

#### Entry Point 4: ScenarioSelectionView (Premium)

**Path 4A: Recommendation Banner → Select Recommended - 5% usage**
```
ScenarioSelection → See Recommendation Banner → Click "Select" → PracticeView
```
- **Decision:** Accept recommendation
- **User Type:** Premium users following guidance
- **Success Metric:** User practices recommended scenario

**Path 4B: Recommendation Banner → Select Different - 2% usage**
```
ScenarioSelection → See Recommendation Banner → Select Different Scenario → PracticeView
```
- **Decision:** Prefer different scenario
- **Exit:** PracticeView (roadmap still updates with actual practice)
- **User Type:** Users exercising choice, preference-based selection
- **Note:** System learns from deviation - may influence future recommendations

**Path 4C: No Banner (Edge Case) - <1% usage**
```
ScenarioSelection → No Recommendation → Select Any Scenario → PracticeView
```
- **Decision:** Roadmap unavailable or insufficient data
- **User Type:** New users, users with data issues
- **Handling:** Graceful degradation - scenario selection works normally

---

### Decision Branch Analysis: Roadmap View

When user reaches Roadmap View, multiple paths branch:

**Branch Point: Roadmap View Actions**

**Path A: Accept Primary Recommendation - 60-70% of roadmap visits**
```
Roadmap View → Click "Start Practice" (Primary) → [Tier Branch]
  ├─ Premium → ScenarioSelectionView (with filters) → PracticeView
  └─ Free → PracticeView (direct)
```
- **Decision:** Trust primary recommendation
- **Frequency:** High (most common action)
- **Success Metric:** User completes recommended practice

**Path B: Select Alternative Recommendation (Premium) - 20-30% of roadmap visits**
```
Roadmap View → Click "Start Practice" (Alternative #1/2/3) → ScenarioSelectionView → PracticeView
```
- **Decision:** Prefer alternative scenario
- **Frequency:** Medium (Premium users exercising choice)
- **Success Metric:** User practices alternative but still targets skill gap

**Path C: Explore Skills (No Immediate Action) - 10% of roadmap visits**
```
Roadmap View → View Skills → [No action] → Navigate Away
  ├─ Back to Dashboard
  ├─ To Reports View
  ├─ To Resource Library
  └─ To Settings/Other
```
- **Decision:** Just exploring, not ready to practice
- **Frequency:** Low but important for flexibility
- **Success Metric:** User gains understanding of skill levels

**Path D: Skip Recommendation - 5% of roadmap visits**
```
Roadmap View → See Recommendation → Ignore → Navigate Elsewhere
```
- **Decision:** Not interested in recommendation right now
- **Frequency:** Low (but important for non-intrusive UX)
- **Note:** Roadmap remains available for future use

---

### Exit Point Analysis: Where Users Go After Roadmap

**Exit 1: Practice Session (Primary Goal) - 70-80% of roadmap visits**
- **Frequency:** Highest
- **Success Metric:** User completes recommended practice
- **Follow-up:** Roadmap updates after session completion

**Exit 2: Dashboard (Exploration) - 15-20% of roadmap visits**
- **Frequency:** Medium
- **User Behavior:** Wanted to see roadmap, satisfied with info
- **Follow-up:** Roadmap widget shows updated state on Dashboard

**Exit 3: Other Views (Distraction) - 5-10% of roadmap visits**
- **Frequency:** Low
- **User Behavior:** Got distracted, navigated elsewhere
- **Note:** Normal user behavior - roadmap doesn't force engagement

**Exit 4: Reports/Analytics (Premium) - 5% of roadmap visits**
- **Frequency:** Low
- **User Behavior:** Want deeper analysis
- **Enhancement Opportunity:** Direct Roadmap → Reports integration

---

### Missing Paths Identified

**Path Gap 1: Roadmap → Reports Integration**
```
Roadmap View → "View Detailed Analytics" → Reports View
```
- **Status:** Missing
- **Value:** Medium - Premium users might want deeper analysis
- **Priority:** Nice-to-have
- **Implementation:** Add button/link in Roadmap View for Premium users

**Path Gap 2: Roadmap → Resource Library**
```
Roadmap View → "Learn More About [Skill]" → Resource Library (filtered)
```
- **Status:** Missing
- **Value:** Medium - Users who want to study before practicing
- **Priority:** Nice-to-have
- **Implementation:** Add contextual link to resources for each skill

**Path Gap 3: Practice → Roadmap (Mid-Session)**
```
PracticeView → "View Roadmap" → Roadmap View → Back to Practice
```
- **Status:** Missing (probably not needed)
- **Value:** Low - Users unlikely to check roadmap during practice
- **Priority:** Low
- **Consideration:** May add for power users, but not essential

**Path Gap 4: Reports → Roadmap**
```
Reports View → "View Roadmap" → Roadmap View
```
- **Status:** Missing
- **Value:** Medium - Users exploring analytics might want roadmap
- **Priority:** Nice-to-have
- **Implementation:** Add bidirectional navigation between Reports and Roadmap

---

### Path Prioritization

**Critical Paths (Must Work Perfectly - 85% of usage):**
1. **Dashboard Widget → Quick Practice (Path 1A)** - 40% usage
   - Fastest path, highest volume
   - Must be reliable and fast
   - Success metric: <2 seconds to start practice

2. **FeedbackView → View Updated Roadmap → Practice (Path 2A → Path A)** - 25% usage
   - Post-session engagement
   - Critical for learning loop
   - Success metric: User sees improvement and practices again

3. **Roadmap View → Accept Recommendation → Practice (Path A)** - 20% usage
   - Primary roadmap use case
   - Must be clear and actionable
   - Success metric: User completes recommended practice

**Important Paths (Should Work Well - 10% of usage):**
4. **Dashboard Widget → View Full Roadmap → Practice (Path 1B → Path A)** - 10% usage
   - Exploration path
   - Important for user education
   - Success metric: User understands roadmap and takes action

**Nice-to-Have Paths (Enhancement Opportunities - 5% of usage):**
5. **ScenarioSelection → Accept Recommendation (Path 4A)** - 5% usage
6. **Roadmap → Reports integration** - Future enhancement
7. **Roadmap → Resource Library integration** - Future enhancement
8. **Alternative recommendations (Premium)** - Already implemented

---

### Edge Cases & Error Handling

#### Scenario 1: AI Service Failure During Roadmap Load

**What If:** Gemini API is down or rate-limited when user opens roadmap

**Flow Modification:**
```
Roadmap View → AI Call Fails → Fallback to Rule-Based → Show Recommendation
  ├─ User accepts → PracticeView (works normally)
  ├─ User sees "Last updated: [timestamp]" badge
  └─ "Retry AI Analysis" button appears for when service recovers
```

**Handling:**
- Roadmap loads with cached/last-known state
- Skill visualization works from existing session data
- Recommendation uses rule-based logic (weakest skill → matching scenario)
- Clear messaging: "Using rule-based recommendations. AI analysis temporarily unavailable."
- "Retry AI Analysis" button for when service recovers
- User can still practice normally

---

#### Scenario 2: Inconsistent/Corrupted Session Data

**What If:** User has sessions with missing `skillCounts`, `empathyScore` = 0, or corrupted feedback

**Flow Modification:**
```
Roadmap View → Data Validation → Filter Invalid Sessions → Calculate Competency
  ├─ If < 3 valid sessions → Show "Complete more sessions" message
  ├─ If ≥ 3 valid sessions → Show roadmap with data quality indicator
  └─ Show: "Based on 8 of 10 sessions" (if 2 are invalid)
```

**Handling:**
- Validate all session data before competency calculation
- Filter out sessions with:
  - Missing `empathyScore` or `empathyScore` = 0
  - Missing `skillCounts` (if required for skill analysis)
  - Malformed feedback structure
- Show data quality indicator: "Based on X of Y sessions"
- Graceful degradation: Use available valid data, don't fail entirely
- If too many invalid sessions → Show: "Data quality issue. Contact support."

---

#### Scenario 3: User Ignores Recommendations Repeatedly

**What If:** User consistently selects different scenarios than recommended

**Flow Modification:**
```
Roadmap View → User Ignores Recommendation → Practice Different Scenario
  ├─ Track deviation pattern (recommendation vs actual practice)
  ├─ After 3+ deviations → Show: "You prefer [scenario type]. Here are recommendations for that."
  └─ Adapt recommendation to user's demonstrated preferences
```

**Handling:**
- Track recommendation acceptance rate per user
- Detect pattern: User prefers certain scenario types
- After 3+ deviations from recommendations:
  - Show alternative recommendations aligned with preferences
  - Message: "Based on your practice history, you might prefer [scenario type]"
- Adaptive algorithm learns from user choices
- Option to provide explicit feedback: "Don't recommend this type"

---

#### Scenario 4: All Skills at Same Level

**What If:** User has all skills at 3.0/5 (balanced intermediate) - no clear "weakest"

**Flow Modification:**
```
Roadmap View → All Skills Equal → Tie-Breaking Logic
  ├─ Recommend skill closest to next level threshold (3.0 → 3.5)
  ├─ Recommend least recently practiced skill
  └─ Show: "All your skills are balanced. Let's push [skill] to the next level."
```

**Handling:**
- Detect when all skills are within 0.5 points of each other
- Apply tie-breaking logic:
  1. Skill closest to next threshold (e.g., 3.0 → 3.5)
  2. Least recently practiced skill
  3. Skill with most room for improvement (furthest from 5.0)
- Different messaging: "Balanced profile" vs "Focus on weakest"
- Recommendation explains: "All skills balanced. Targeting [skill] to reach Advanced level."

---

#### Scenario 5: User Practices Offline

**What If:** User is offline when viewing roadmap

**Flow Modification:**
```
Roadmap View → Offline Detection → Use Cached Data
  ├─ Show "Offline - using cached data" badge
  ├─ Show "Last updated: [timestamp]"
  └─ Queue roadmap recalculation for when online
```

**Handling:**
- Detect offline state using `navigator.onLine` or network error detection
- Load roadmap from cached state (localStorage or IndexedDB)
- Show clear offline indicator: "Offline - using cached data"
- Display "Last updated: [timestamp]" so user knows data freshness
- Queue roadmap recalculation for when connectivity restored
- Sync queue processes updates when back online

---

#### Scenario 6: User Dislikes Recommended Scenario Type

**What If:** User has negative experience with "Resistant patient" scenarios

**Flow Modification:**
```
Roadmap View → User Sees Recommendation → "Not Interested" Option
  ├─ User clicks "Not interested" → Show alternative
  ├─ Track preference → Avoid this scenario type in future
  └─ (Premium) Show 3 alternatives immediately
```

**Handling:**
- Add "Not interested in this type" button to recommendations
- Track user preferences (scenario types to avoid)
- Immediately show alternative recommendation when dismissed
- Update recommendation algorithm to avoid disliked types
- (Premium) Show 3 alternatives upfront to reduce need for dismissal
- Allow user to manage preferences in Settings

---

#### Scenario 7: User Upgrades Mid-Session

**What If:** User upgrades to Premium while viewing roadmap

**Flow Modification:**
```
Roadmap View → User Upgrades → Tier Change Detected
  ├─ Refresh roadmap with Premium features
  ├─ Show Premium scenarios in recommendations
  └─ Display "Premium unlocked" celebration
```

**Handling:**
- Detect tier change via `useTierManager` hook or subscription webhook
- Auto-refresh roadmap when tier changes detected
- Show Premium features:
  - Top 3 alternative recommendations
  - Advanced trend analysis
  - Premium-only scenario types
- Display celebration: "Welcome to Premium! Here are advanced scenarios for you."
- Update UI to show Premium badges/indicators

---

#### Scenario 8: Large Dataset (100+ Sessions)

**What If:** User has 150 sessions - analyzing all is slow

**Flow Modification:**
```
Roadmap View → Large Dataset Detected → Performance Optimization
  ├─ Analyze last 20 sessions for quick load
  ├─ Show "Based on recent 20 sessions" indicator
  └─ (Premium) Option to run full analysis in background
```

**Handling:**
- Detect large dataset: > 50 sessions
- Default to analyzing last 20-30 sessions for performance
- Show indicator: "Based on recent 20 sessions for speed"
- (Premium) Option to run full analysis:
  - Background processing
  - Show progress indicator
  - Update roadmap when complete
- Cache analysis results to avoid recalculation
- Lazy load historical data for trend analysis

---

#### Scenario 9: Same Recommendation Repeatedly

**What If:** User practices recommended scenario 5 times, still gets same recommendation

**Flow Modification:**
```
Roadmap View → Same Recommendation 3+ Times → Stagnation Detection
  ├─ Show: "You've practiced this 3 times. Try a different approach."
  ├─ Recommend alternative scenario type for same skill
  └─ Suggest: "Consider reviewing coaching summaries or resources"
```

**Handling:**
- Track recommendation history (last N recommendations)
- Detect when same recommendation appears 3+ times consecutively
- Trigger stagnation detection:
  - Show warning: "You've practiced this scenario 3 times. Try a different approach."
  - Recommend alternative scenario type targeting same skill
  - Suggest alternative learning paths: coaching summaries, resource library
- Enforce variety: Rotate scenario types even for same skill gap
- If no improvement detected after 5+ practices → Suggest different skill focus

---

#### Scenario 10: Corrupted Session Data

**What If:** Some sessions have malformed `skillCounts` or missing required fields

**Flow Modification:**
```
Roadmap View → Data Validation → Detect Corruption
  ├─ Filter out invalid sessions
  ├─ Show: "8 of 10 sessions used (2 had data issues)"
  └─ If too many invalid → Show: "Data quality issue. Contact support."
```

**Handling:**
- Validate session data structure before processing:
  - Required fields present (`empathyScore`, `skillsDetected`)
  - `skillCounts` is valid object (not null, not array)
  - Date is valid ISO string
- Filter invalid sessions silently
- Show data quality indicator: "Based on X of Y sessions"
- If > 50% sessions invalid → Show error: "Data quality issue. Contact support."
- Log corruption for debugging (client-side only, no PII)

---

#### Scenario 11: Topic Bias (Same Scenario Type Repeatedly)

**What If:** User only practices "Alcohol" scenarios, ignoring other topics

**Flow Modification:**
```
Roadmap View → Topic Bias Detection → Variety Encouragement
  ├─ Detect if user practices same topic repeatedly (5+ times)
  ├─ Show: "You've practiced Alcohol scenarios 10 times. Try Smoking to diversify your skills."
  └─ Recommend scenario with different topic but same skill focus
```

**Handling:**
- Track scenario topic distribution in user's practice history
- Detect topic bias: > 70% of sessions are same topic
- Show variety encouragement:
  - "You've practiced [topic] scenarios 10 times. Try [different topic] to diversify your skills."
  - Explain cross-topic skill transfer: "Practicing different topics helps you apply [skill] in various contexts."
- Recommend scenarios with different topics but targeting same skill
- (Premium) Show topic diversity chart in analytics

---

#### Scenario 12: All Scenarios Exhausted

**What If:** User has practiced all available scenarios for their skill gaps

**Flow Modification:**
```
Roadmap View → All Scenarios Practiced → Advanced Recommendations
  ├─ Suggest: "Re-practice [scenario] at Advanced difficulty"
  ├─ Suggest: "Review your coaching summary for deeper insights"
  └─ Suggest: "Explore resource library for [skill] mastery"
```

**Handling:**
- Track which scenarios user has practiced
- Detect when all available scenarios for skill gap have been tried
- Show advanced learning path:
  - "You've practiced all scenarios for [skill]. Try Advanced difficulty."
  - "Review your coaching summary for deeper insights on [skill]"
  - "Explore resource library for [skill] mastery techniques"
- Suggest mastery-level practice: Focus on refinement, not basics
- (Premium) Suggest creating custom scenarios or advanced challenges

---

### Error Recovery Paths Summary

**Critical Error Handling:**
- AI failure → Rule-based fallback (always works)
- Data corruption → Validation and filtering (graceful degradation)
- Offline mode → Cached state with sync queue (seamless experience)
- Network errors → Retry with exponential backoff (resilient)

**User Experience Errors:**
- Repeated recommendations → Stagnation detection (prevents frustration)
- Ignored recommendations → Preference learning (adapts to user)
- Topic bias → Variety encouragement (promotes well-rounded skills)
- All scenarios exhausted → Advanced paths (supports mastery)

**Performance Errors:**
- Large datasets → Recent session analysis (fast load)
- Slow calculations → Background processing (non-blocking)
- Memory issues → Lazy loading (efficient)

---

### Cross-Functional Trade-off Analysis

#### Trade-off 1: Recommendation Generation (AI vs Rule-based)

**Perspectives:**
- **Product:** AI provides better UX and personalization, justifies Premium tier
- **Engineering:** AI adds latency (500ms-2s) and cost ($0.001-0.01 per call)
- **Design:** AI explanations feel more human and trustworthy

**Decision:**
- **Primary:** AI-generated recommendations (Premium, when available)
- **Fallback:** Rule-based recommendations (Free tier, AI unavailable)
- **Hybrid:** Cache AI recommendations for 24 hours, use rule-based for real-time updates

**Implementation:**
- Edge Function: `generate-roadmap-recommendation` (AI-powered)
- Client-side: Rule-based fallback (immediate, no cost)
- Cache: Store AI recommendations in localStorage with timestamp
- Invalidation: Clear cache after new session completion

**Flow Impact:**
- Roadmap View → AI call (if Premium + available) → Show recommendation
- If AI fails → Fallback to rule-based → Show recommendation with "Using rule-based" badge
- Free users → Always rule-based (no AI call)

---

#### Trade-off 2: Competency Calculation Performance

**Perspectives:**
- **Product:** Users want accurate, up-to-date skill levels
- **Engineering:** Calculating from 100+ sessions is slow (500ms-2s)
- **Design:** Users expect instant feedback (<100ms)

**Decision:**
- **Default:** Analyze last 20 sessions (fast, <100ms)
- **Premium Option:** Full analysis in background (shows progress indicator)
- **Cache:** Store competency calculations, invalidate after new session

**Implementation:**
- Function: `calculateSkillCompetency(sessions, options)`
- Options: `{ recentOnly: true, sessionLimit: 20 }`
- Cache key: `roadmap-competency-${userId}-${lastSessionId}`
- Background job: Full analysis for Premium users (optional)

**Flow Impact:**
- Roadmap View → Quick load with recent sessions → Show competency
- (Premium) Option to "Analyze all sessions" → Background processing → Update when complete

---

#### Trade-off 3: Dashboard Widget vs Dedicated View

**Perspectives:**
- **Product:** Widget provides quick access, dedicated view provides education
- **Engineering:** Widget is simpler (no new route), dedicated view needs new View enum
- **Design:** Widget is scannable, dedicated view allows deeper exploration

**Decision:**
- **Phase 1 (MVP):** Dashboard widget only (faster to ship)
- **Phase 2:** Add dedicated Roadmap view (if users request it)
- **Widget:** Shows mini radar + primary recommendation
- **Full View:** Shows detailed radar + all recommendations + trends

**Implementation:**
- Widget: Reuse existing Dashboard components, add roadmap card
- Full View: New `View.Roadmap` enum, new `RoadmapView.tsx` component
- Navigation: "View Full Roadmap" link in widget (Phase 2)

**Flow Impact:**
- **Phase 1:** Dashboard Widget → Quick Practice (no navigation)
- **Phase 2:** Dashboard Widget → "View Full" → Roadmap View → Practice

---

#### Trade-off 4: Skill Visualization (Radar vs Bars)

**Perspectives:**
- **Product:** Radar shows all skills at once (better overview)
- **Engineering:** Radar chart library already exists (recharts), bars are simpler
- **Design:** Radar is visually appealing, bars are easier to understand

**Decision:**
- **Premium:** Radar chart (shows all 6 skills, trend comparison)
- **Free:** Progress bars (simpler, easier to understand)
- **Both:** Use same data, different visualization

**Implementation:**
- Reuse `SkillRadarChart` component (already exists in `components/reports/`)
- Create `SkillProgressBars` component (new, simpler)
- Conditional rendering based on tier: `isPremium ? <SkillRadarChart /> : <SkillProgressBars />`

**Flow Impact:**
- Free users see progress bars (clearer, less overwhelming)
- Premium users see radar chart (comprehensive, shows trends)
- Both show same competency data, different presentation

---

#### Trade-off 5: Recommendation Frequency

**Perspectives:**
- **Product:** Update after every session (most accurate)
- **Engineering:** Recalculating on every session is expensive (AI calls)
- **Design:** Users expect updates immediately after practice

**Decision:**
- **Immediate:** Update skill levels and visualization (client-side calculation)
- **Deferred:** Regenerate AI recommendation in background (after session save)
- **Cache:** Use cached recommendation until new one is ready

**Implementation:**
- Optimistic update: Recalculate competency immediately (no AI call)
- Background job: Queue AI recommendation generation
- Show "Updating recommendation..." indicator while processing
- Use cached recommendation until new one is ready

**Flow Impact:**
- Post-Session → Skill levels update immediately → Recommendation updates in background
- User sees instant feedback (skill improvement) → Recommendation refreshes when ready

---

#### Trade-off 6: Preference Learning Complexity

**Perspectives:**
- **Product:** Learning from user choices improves recommendations
- **Engineering:** Tracking preferences adds data storage and complexity
- **Design:** Users want recommendations to adapt, but don't want to manage preferences

**Decision:**
- **Phase 1:** Simple tracking (which recommendations user accepts vs ignores)
- **Phase 2:** Explicit preferences ("Don't recommend this type")
- **Storage:** Add `user_preferences` table in Supabase (future)

**Implementation:**
- Track in localStorage: `roadmap-preferences-${userId}`
- Simple object: `{ ignoredTypes: [], preferredTypes: [] }`
- Sync to Supabase when online (future enhancement)
- Use preferences to filter recommendations

**Flow Impact:**
- User ignores recommendation → Track in localStorage → Future recommendations avoid this type
- (Phase 2) User clicks "Not interested" → Explicit preference saved → Recommendations adapt

---

### Implementation Phases

#### Phase 1: MVP (Must-Have) - Weeks 1-2

**Features:**
1. Dashboard widget with mini skill visualization
2. Rule-based recommendations (fast, reliable)
3. Skill competency calculation (last 20 sessions)
4. Post-session roadmap update prompt
5. Basic skill progress bars (Free tier)

**Technical Tasks:**
- Create `useRoadmap` hook for competency calculation
- Create `RoadmapWidget` component for Dashboard
- Implement rule-based recommendation algorithm
- Add "Roadmap Updated" card to FeedbackView
- Create `SkillProgressBars` component

**Success Metrics:**
- Roadmap widget loads in <200ms
- Recommendations are actionable (user can start practice)
- 80%+ of users see roadmap after 3 sessions

---

#### Phase 2: Enhanced Features - Weeks 3-4

**Features:**
6. AI-generated recommendations (Premium feature)
7. Dedicated Roadmap view (if users request)
8. Trend indicators (Premium)
9. Alternative recommendations (Premium)
10. Skill radar chart (Premium)

**Technical Tasks:**
- Create Edge Function: `generate-roadmap-recommendation`
- Create `RoadmapView.tsx` component
- Add trend calculation to competency logic
- Implement alternative recommendation generation
- Reuse `SkillRadarChart` for Premium users

**Success Metrics:**
- AI recommendations feel personalized (user validation)
- Premium users see value in advanced features
- Roadmap view usage >20% of Dashboard visits

---

#### Phase 3: Advanced Features - Future

**Features:**
11. Preference learning (track user choices)
12. Full dataset analysis (Premium background job)
13. Stagnation detection
14. Topic diversity tracking
15. Advanced learning paths

**Technical Tasks:**
- Create `user_preferences` table in Supabase
- Implement background job for full analysis
- Add stagnation detection algorithm
- Track topic distribution in practice history
- Create advanced learning path recommendations

**Success Metrics:**
- Recommendations adapt to user preferences
- Stagnation detection prevents user frustration
- Advanced features drive Premium conversions

---

### Technical Constraints & Considerations

**Performance:**
- Competency calculation must complete in <200ms for good UX
- Use `useMemo` to avoid recalculation on every render
- Cache results in localStorage with session-based invalidation
- Analyze last 20 sessions by default (not all sessions)

**Data Structure:**
- Reuse existing `Session[]` type (no schema changes needed)
- Access `session.feedback.empathyScore` (1-5 scale)
- Access `session.feedback.skillCounts` (Record<string, number>)
- Access `session.date` (ISO string)

**API Integration:**
- New Edge Function: `generate-roadmap-recommendation`
- Reuse existing `analyze-session` Edge Function pattern
- Handle AI failures gracefully (fallback to rule-based)
- Cache AI responses to reduce API calls

**State Management:**
- Create `useRoadmap` hook (similar to `useReportData`)
- Store roadmap state in component state (not global)
- Sync to Supabase for cross-device access (future)

**Component Reuse:**
- Reuse `SkillRadarChart` from `components/reports/`
- Reuse `Card` component for recommendation cards
- Reuse `Button` component for actions
- Create new `RoadmapWidget` and `RoadmapView` components

---

### Design Constraints & Considerations

**Visual Hierarchy:**
- Global MI Score (dark card) = Primary metric (top of Dashboard)
- Roadmap Widget = Actionable guidance (below Quick Stats)
- Skill Details = Supporting information (expandable in full view)

**Accessibility:**
- Skill radar needs alt text: "MI Skill Radar showing competency across 6 skills"
- Color coding needs text labels (not color-only indicators)
- Recommendation cards need clear focus states (keyboard navigation)
- Loading states need screen reader announcements: "Loading roadmap recommendations"

**Mobile Considerations:**
- Dashboard widget stacks vertically on mobile (<768px)
- Full roadmap view needs horizontal scroll for radar chart (if needed)
- Recommendation cards need touch-friendly tap targets (min 44x44px)
- Bottom navigation needs roadmap icon (if dedicated view added)

**Tier Differentiation:**
- Free: Progress bars, single recommendation, basic visualization
- Premium: Radar chart, 3 alternatives, trend indicators, advanced analytics
- Visual distinction: Premium features have badge/indicator

**Responsive Breakpoints:**
- Mobile (<768px): Stacked layout, simplified visualization
- Tablet (768px-1024px): Side-by-side layout, full features
- Desktop (>1024px): Optimal layout, all features visible

---

## Technical Requirements

*[To be completed]*

---

## Success Metrics

*[To be completed]*

---

## Open Questions

*[To be completed]*
