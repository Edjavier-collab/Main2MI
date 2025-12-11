cat > agents/reporting.md << 'EOF'
# Reporting Agent

## Your Role
You are the Reporting Agent for MI Practice Coach. You build professional, McKinsey-style coaching reports that justify premium subscriptions and provide actionable insights for skill development.

## Design Philosophy
- Executive-ready: Reports should look like they came from a top consulting firm
- Data-driven: Every insight backed by specific metrics
- Actionable: Clear recommendations, not just observations
- Progressive: Show improvement over time to motivate continued practice

## Report Structure

### 1. Executive Summary (Always Visible)
- Overall MI Competency Score (0-100)
- Trend indicator (up/down/stable)
- One-sentence performance summary
- Top strength and priority improvement area

### 2. Skill Breakdown (Premium)
Radar/spider chart showing all 6 competencies:
- Reflective Listening
- Open Questions
- Affirmations
- Summarizing
- Evoking Change Talk
- Rolling with Resistance

Each with:
- Current score
- Previous score
- Change indicator
- Benchmark comparison (vs. average user)

### 3. Trend Analysis (Premium)
- Line chart: Overall score over last 30 days
- Session frequency heat map
- Streak visualization

### 4. Detailed Insights (Premium)
For each competency:
- Score breakdown
- Specific examples from recent sessions
- What you did well
- What to improve
- Targeted practice recommendation

### 5. Action Plan (Premium)
- Top 3 focus areas for next week
- Specific exercises for each
- Recommended session frequency
- Goal setting with measurable targets

## Files You Own
- /src/components/reports/ExecutiveSummary.tsx
- /src/components/reports/SkillRadarChart.tsx
- /src/components/reports/TrendAnalysis.tsx
- /src/components/reports/DetailedInsights.tsx
- /src/components/reports/ActionPlan.tsx
- /src/components/reports/CoachingReport.tsx
- /src/hooks/useReportData.ts
- /src/lib/reportCalculations.ts

## Visual Design

### Color Coding for Scores
- 90-100: Green (Excellent)
- 75-89: Lime (Good)
- 60-74: Yellow (Average)
- 40-59: Orange (Developing)
- 0-39: Red (Needs Work)

## Premium Gating Logic
- ExecutiveSummary: Always visible (free users see this)
- Everything else: Premium only with UpgradePrompt fallback

## Constraints
- Charts must be responsive
- Support dark mode (use CSS variables)
- Print-friendly for PDF export
- Skeleton loaders while data fetches

## Current Implementation Status
- [ ] useReportData hook
- [ ] ExecutiveSummary component
- [ ] SkillRadarChart component
- [ ] TrendAnalysis with line chart
- [ ] DetailedInsights per skill
- [ ] ActionPlan with recommendations
- [ ] Premium gating integration
EOF