import { normalizeFeedbackOutput, normalizeCoachingSummary } from '../services/geminiService';
import { Feedback, CoachingSummary } from '../types';

type EvalResult = {
    name: string;
    passed: boolean;
    messages: string[];
};

const feedbackSamples: Array<{ name: string; payload: any }> = [
    {
        name: 'minimal-valid',
        payload: {
            empathyScore: 4,
            empathyBreakdown: 'Showed empathy twice.',
            whatWentRight: 'Used reflections.',
            constructiveFeedback: 'Add more open questions.',
            areasForGrowth: 'Practice change talk.',
            skillsDetected: ['Reflections', 'Open Questions'],
            skillCounts: '{"Reflections":2,"Open Questions":1}',
            nextFocus: 'Use 3 complex reflections next time.'
        }
    },
    {
        name: 'missing-fields',
        payload: {
            empathyScore: '5',
            skillsDetected: ['Reflections', 'UnsupportedSkill'],
        }
    }
];

const coachingSummarySamples: Array<{ name: string; payload: any }> = [
    {
        name: 'minimal-summary',
        payload: {
            strengthsAndTrends: '* Great rapport',
            areasForFocus: 'Use more complex reflections.',
            summaryAndNextSteps: 'Keep building on strengths.',
            skillProgression: [
                { skillName: 'Reflections', totalCount: 4, averagePerSession: 2, trend: 'increasing' }
            ],
            topSkillsToImprove: ['Open Questions'],
            specificNextSteps: ['Ask 3 open questions next session']
        }
    },
    {
        name: 'missing-summary-fields',
        payload: {}
    }
];

const assertFeedback = (data: Feedback): string[] => {
    const issues: string[] = [];
    if (typeof data.empathyScore !== 'number') issues.push('empathyScore missing');
    if (!data.whatWentRight) issues.push('whatWentRight missing');
    if (!data.areasForGrowth) issues.push('areasForGrowth missing');
    if (!data.skillsDetected || data.skillsDetected.length === 0) issues.push('skillsDetected empty');
    if (!data.nextFocus) issues.push('nextFocus missing');
    return issues;
};

const assertCoaching = (data: CoachingSummary): string[] => {
    const issues: string[] = [];
    if (!data.totalSessions) issues.push('totalSessions missing');
    if (!data.dateRange) issues.push('dateRange missing');
    if (!data.strengthsAndTrends) issues.push('strengthsAndTrends missing');
    if (!data.areasForFocus) issues.push('areasForFocus missing');
    if (!data.summaryAndNextSteps) issues.push('summaryAndNextSteps missing');
    return issues;
};

const evaluate = (): EvalResult[] => {
    const results: EvalResult[] = [];

    feedbackSamples.forEach(sample => {
        const normalized = normalizeFeedbackOutput(sample.payload);
        const issues = assertFeedback(normalized);
        results.push({
            name: `feedback:${sample.name}`,
            passed: issues.length === 0,
            messages: issues
        });
    });

    coachingSummarySamples.forEach(sample => {
        const normalized = normalizeCoachingSummary(sample.payload, 3, '01/01/2025', '01/10/2025');
        const issues = assertCoaching(normalized);
        results.push({
            name: `coaching:${sample.name}`,
            passed: issues.length === 0,
            messages: issues
        });
    });

    return results;
};

const main = () => {
    const results = evaluate();
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`AI evaluation checks: ${passed}/${total} passed`);
    results.forEach(r => {
        if (!r.passed) {
            console.log(`❌ ${r.name}: ${r.messages.join('; ')}`);
        } else {
            console.log(`✅ ${r.name}`);
        }
    });
};

// Allow script to be run directly
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();


