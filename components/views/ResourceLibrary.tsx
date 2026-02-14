'use client';

import React, { useState, useMemo } from 'react';
import { UserTier } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Search, BookOpen, Target, Zap, ChevronRight, CheckCircle2, Circle, ArrowLeft, Lock, Unlock, FileText } from 'lucide-react';

interface ResourceLibraryProps {
    onUpgrade: () => void;
    userTier: UserTier;
    onBack: () => void;
}

const resourcesData = [
    {
        category: 'Introductory Principles',
        items: [
            { id: 1, title: 'What is Motivational Interviewing?', description: 'The foundations of MI and why it works', readTime: '3 min', premiumOnly: false },
            { id: 2, title: 'The Spirit of Motivational Interviewing', description: 'Partnership, acceptance, compassion, and evocation', readTime: '4 min', premiumOnly: false },
            { id: 3, title: 'The 5 Stages of Change Explained', description: 'From precontemplation to maintenance and beyond', readTime: '5 min', premiumOnly: false },
            { id: 4, title: 'The Four Processes of MI', description: 'Engaging, focusing, evoking, and planning', readTime: '4 min', premiumOnly: true },
        ]
    },
    {
        category: 'Core Skills (OARS)',
        items: [
            { id: 10, title: 'Open Questions', description: 'When and how to use open-ended questions effectively', readTime: '3 min', premiumOnly: false },
            { id: 11, title: 'Affirmations', description: 'Building patient confidence and recognizing strengths', readTime: '2 min', premiumOnly: false },
            { id: 12, title: 'Reflections', description: 'Simple vs complex reflections and when to use each', readTime: '5 min', premiumOnly: false },
            { id: 13, title: 'Summaries', description: 'Tying conversations together to show understanding', readTime: '3 min', premiumOnly: false },
            { id: 14, title: 'Advanced Reflections', description: 'Deepening the conversation with complex reflections', readTime: '4 min', premiumOnly: true },
            { id: 15, title: 'Developing Discrepancy', description: 'Helping patients see gaps between values and behavior', readTime: '4 min', premiumOnly: true },
        ]
    },
    {
        category: 'Advanced Techniques',
        items: [
            { id: 20, title: 'Eliciting Change Talk', description: 'Drawing out the patient\'s own reasons for change', readTime: '4 min', premiumOnly: true },
            { id: 21, title: 'Responding to Sustain Talk', description: 'Responding to pushback without confrontation', readTime: '4 min', premiumOnly: true },
            { id: 22, title: 'Integrating MI with Other Methods', description: 'Combining MI with CBT, Harm Reduction, and more', readTime: '5 min', premiumOnly: true },
            { id: 23, title: 'MI for Complex Cases', description: 'Navigating difficult clinical scenarios and comorbidities', readTime: '6 min', premiumOnly: true },
            { id: 24, title: 'Using MI with Mandated Clients', description: 'Strategies for working with involuntary clients', readTime: '5 min', premiumOnly: true },
            { id: 25, title: 'Measuring Your MI Fidelity', description: 'Assessing and improving your MI skills', readTime: '3 min', premiumOnly: true },
            { id: 26, title: 'Strengthening Commitment Language', description: 'Moving from preparation to action', readTime: '4 min', premiumOnly: true },
            { id: 27, title: 'MI for Health Behavior Change', description: 'applying MI to chronic disease management', readTime: '5 min', premiumOnly: true },
            { id: 28, title: 'MI in Brief Interventions (SBIRT)', description: 'Effective MI in short clinical encounters', readTime: '4 min', premiumOnly: true },
            { id: 29, title: 'Working with Anger and Defensiveness', description: 'De-escalation techniques using MI principles', readTime: '5 min', premiumOnly: true },
            { id: 30, title: 'Cultural Adaptations of MI', description: 'Tailoring MI for diverse populations', readTime: '4 min', premiumOnly: true },
        ]
    }
];

const RESOURCE_CONTENT: { [key: number]: any } = {
    1: {
        title: 'What is Motivational Interviewing?',
        content: [
            { type: 'heading', text: 'A Patient-Centered Approach' },
            { type: 'paragraph', text: 'Motivational Interviewing (MI) is a collaborative conversation style for strengthening a person’s own motivation and commitment to change. It is a guiding, not directing, style of communication that helps patients explore and resolve their own ambivalence about behavior change.' },
        ]
    },
    2: {
        title: 'The Spirit of Motivational Interviewing',
        content: [
            { type: 'heading', text: 'The Four Pillars of MI' },
            {
                type: 'list', items: [
                    'Partnership: Work collaboratively and avoid the "expert" role. MI is done "with" and "for" a person, not "on" or "to" them.',
                    'Acceptance: Respect the patient\'s autonomy, potential, and perspective. This includes absolute worth, accurate empathy, autonomy support, and affirmation.',
                    'Compassion: Actively promote the other’s welfare, to give priority to the other’s needs.',
                    'Evocation: The motivation for change resides within the patient and is not imposed from outside. Your job is to "draw it out".',
                ]
            },
        ]
    },
    3: {
        title: 'The 5 Stages of Change Explained',
        content: [
            { type: 'heading', text: 'Understanding the Journey' },
            { type: 'paragraph', text: 'The Transtheoretical Model, or Stages of Change, describes the process people go through when making a behavior change. Recognizing a patient\'s stage helps tailor your approach.' },
            { type: 'subheading', text: '1. Precontemplation' },
            { type: 'paragraph', text: 'The patient is not considering change. They may be unaware or under-aware of their problem. Goal: Raise doubt & increase awareness.' },
            { type: 'subheading', text: '2. Contemplation' },
            { type: 'paragraph', text: 'The patient is ambivalent, weighing the pros and cons of change. They are aware a problem exists but not committed to action. Goal: Tip the balance towards change.' },
            { type: 'subheading', text: '3. Preparation' },
            { type: 'paragraph', text: 'The patient is ready to change and intends to take action soon. They may have a plan. Goal: Help the patient create a realistic plan.' },
            { type: 'subheading', text: '4. Action' },
            { type: 'paragraph', text: 'The patient is actively modifying their behavior and has made specific changes. Goal: Support the patient in taking steps.' },
            { type: 'subheading', text: '5. Maintenance' },
            { type: 'paragraph', text: 'The patient is working to sustain the new behavior and prevent relapse. Goal: Help the patient identify and use strategies to prevent relapse.' },
        ]
    },
    4: {
        title: "The Four Processes of MI",
        content: [
            { type: "heading", text: "A Sequential Roadmap" },
            { type: "paragraph", text: "The four processes of MI provide a structure for the conversation. They are sequential but also recursive—you may revisit earlier processes as needed." },
            { type: "subheading", text: "1. Engaging" },
            { type: "paragraph", text: "The foundation of the relationship. The goal is to establish a trusting and mutually respectful working relationship. This is where OARS skills are critical." },
            { type: "subheading", text: "2. Focusing" },
            { type: "paragraph", text: "The process of developing and maintaining a specific direction in the conversation about change. It involves clarifying a target behavior from a broader conversation." },
            { type: "subheading", text: "3. Evoking" },
            { type: "paragraph", text: "Eliciting the patient's own motivations for change. This is the heart of MI, where you listen for and strategically respond to change talk." },
            { type: "subheading", text: "4. Planning" },
            { type: "paragraph", text: "Developing a specific change plan that the patient agrees to and is willing to implement. This process bridges the gap between talking about change and taking action." }
        ]
    },
    10: {
        title: 'Open Questions',
        content: [
            { type: 'heading', text: 'Inviting the Story' },
            { type: 'paragraph', text: 'Open-ended questions invite the patient to tell their story and explore their thoughts and feelings. They avoid simple "yes" or "no" answers and encourage deeper conversation.' },
            { type: 'subheading', text: 'Example: Closed vs. Open' },
            {
                type: 'dialogue', lines: [
                    { speaker: 'Clinician (Closed)', text: "So, you're not exercising?" },
                    { speaker: 'Patient', text: "No." },
                ]
            },
            {
                type: 'dialogue', lines: [
                    { speaker: 'Clinician (Open)', text: "What's gotten in the way of you being more active lately?" },
                    { speaker: 'Patient', text: "Well, with my new work schedule, by the time I get home I'm just exhausted. And the kids need my attention right away..." },
                ]
            },
        ],
    },
    11: {
        title: 'Affirmations',
        content: [
            { type: 'heading', text: 'Building Confidence' },
            { type: 'paragraph', text: "Affirmations recognize and acknowledge the patient's strengths, efforts, and past successes. This builds self-efficacy and reinforces their ability to change. It's not cheerleading, but a genuine acknowledgment." },
            { type: 'subheading', text: 'Example in Context' },
            {
                type: 'dialogue', lines: [
                    { speaker: 'Patient', text: "I tried to cut back last month, but it only lasted a few days. It was just so hard." },
                    { speaker: 'Clinician', text: "That's a significant step to even try. It shows how much you're thinking about this and that you have the determination to make a change, even if it didn't stick the first time." },
                ]
            },
        ],
    },
    12: {
        title: 'Reflections',
        content: [
            { type: 'heading', text: 'Active Listening in Action' },
            { type: 'paragraph', text: "Reflective listening is the cornerstone of MI. It involves carefully listening to the patient and reflecting back what they are saying in the form of a statement. This shows you are listening, helps the patient hear themselves, and can guide the conversation." },
            { type: 'subheading', text: 'Example: Simple Reflection' },
            { type: 'paragraph', text: 'A simple reflection repeats or slightly rephrases what the patient said.' },
            {
                type: 'dialogue', lines: [
                    { speaker: 'Patient', text: "I'm just not happy with how much I've been drinking." },
                    { speaker: 'Clinician', text: "You're feeling unhappy about your drinking." },
                ]
            },
            { type: 'subheading', text: 'Example: Complex Reflection' },
            { type: 'paragraph', text: 'A complex reflection makes a guess at the underlying feeling or meaning.' },
            {
                type: 'dialogue', lines: [
                    { speaker: 'Patient', text: "I know I should quit smoking for my kids, but it's the only thing that calms me down when I'm stressed." },
                    { speaker: 'Clinician', text: "You're feeling torn between your role as a parent and your need for a coping tool that works for you right now." },
                ]
            },
        ],
    },
    13: {
        title: 'Summaries',
        content: [
            { type: 'heading', text: 'Connecting the Dots' },
            { type: 'paragraph', text: "Summaries pull together several of the patient's own statements about change. A well-timed summary can reinforce their motivation, highlight their ambivalence, and prepare them to take the next step. It's often followed by an open question." },
            { type: 'subheading', text: 'Example: Highlighting Ambivalence' },
            {
                type: 'dialogue', lines: [
                    { speaker: 'Clinician', text: "So, let me see if I've got this right. On the one hand, you've said that fast food is quick and easy, and it's what you're used to. On the other hand, you're starting to worry about your pre-diabetes diagnosis and you're feeling tired all the time. Did I get that right?" },
                    { speaker: 'Patient', text: "Yeah, that's pretty much it. When you put it like that, it sounds... not great." },
                ]
            },
        ],
    },
    14: {
        title: "Advanced Reflections",
        content: [
            { type: "heading", text: "Beyond Simple Restatements" },
            { type: "paragraph", text: "While simple reflections are foundational, complex reflections can deepen the conversation and accelerate change by adding meaning or emphasis." },
            { type: "subheading", text: "Types of Complex Reflections" },
            {
                type: "list", items: [
                    "Reflection of Feeling: 'You're feeling hopeless about this situation.'",
                    "Amplified Reflection: Gently exaggerating what the patient said to encourage them to argue less for sustain talk. 'So there are no downsides to your current behavior at all.'",
                    "Double-Sided Reflection: Captures both sides of ambivalence. 'On the one hand, [sustain talk], and on the other hand, [change talk].'",
                    "Metaphor: Using an image or analogy. 'It's like you're stuck in a tug-of-war with this habit.'"
                ]
            }
        ]
    },
    15: {
        title: "Developing Discrepancy",
        content: [
            { type: "heading", text: "The Engine of Change" },
            { type: "paragraph", text: "Motivation for change is created when a person perceives a discrepancy between their present behavior and their important personal goals or values. Your role is not to create this discrepancy, but to help the patient become aware of it themselves." },
            { type: "subheading", text: "Techniques for Highlighting Discrepancy" },
            {
                type: "list", items: [
                    "Exploring Values: 'What are the most important things to you in your life? ... How does your [behavior] fit in with that?'",
                    "A Typical Day: Ask the patient to walk you through a typical day, which can naturally highlight the impact of their behavior on their routine and goals.",
                    "Information Exchange: Use the 'Elicit-Provide-Elicit' model. Ask permission, provide neutral information, and then ask for the patient's interpretation. 'Would it be okay if I shared some information about...? ... What do you make of that?'"
                ]
            }
        ]
    },
    20: {
        title: "Eliciting Change Talk",
        content: [
            { type: "heading", text: "The Heart of MI" },
            { type: "paragraph", text: "Change talk is any speech by the patient that favors movement toward change. Your primary goal in MI is to elicit and reinforce it. People are more likely to be persuaded by what they hear themselves say." },
            { type: "subheading", text: "Recognizing DARN CATs (The Types of Change Talk)" },
            {
                type: "list", items: [
                    "Preparatory Change Talk (DARN): Desire, Ability, Reasons, Need.",
                    "Mobilizing Change Talk (CAT): Commitment, Activation, Taking Steps."
                ]
            },
            { type: "subheading", text: "Evocative Questions to Ask" },
            {
                type: "list", items: [
                    "Ask for Elaboration: 'Tell me more about that.'",
                    "Looking Forward: 'If you did decide to make a change, what would the benefits be?'",
                    "Querying Extremes: 'What's the worst thing that could happen if you don't change?'",
                    "Using Rulers: 'On a scale of 0 to 10, how important is it for you to change?' Then, 'Why did you pick a 4 and not a 2?'"
                ]
            }
        ]
    },
    21: {
        title: "Responding to Sustain Talk",
        content: [
            { type: "heading", text: "Rolling with 'Resistance'" },
            { type: "paragraph", text: "Sustain talk is the patient's argument for not changing. It's natural and not 'bad'. Instead of challenging it, roll with it." },
            {
                type: "list", items: [
                    "Simple Reflection: 'You feel that now isn't the right time to quit.'",
                    "Amplified Reflection: 'So you see absolutely no reason to change at all.' (Use with care)",
                    "Double-Sided Reflection: 'On the one hand, you enjoy smoking, and on the other, you're worried about your cough.'",
                    "Shifting Focus: Move the conversation away from the roadblock. 'I hear that you're not ready to talk about quitting. Can we talk about what makes this habit important to you?'"
                ]
            }
        ]
    },
    22: {
        title: "Integrating MI with Other Methods",
        content: [
            { type: "heading", text: "A Versatile Approach" },
            { type: "paragraph", text: "MI is not a standalone therapy but a communication style that can be integrated with other therapeutic models. It is particularly effective when used before another treatment to enhance engagement and motivation." },
            { type: "subheading", text: "MI + CBT (Cognitive Behavioral Therapy)" },
            { type: "paragraph", text: "Use MI in the initial sessions to explore ambivalence and build motivation for change. Once the patient is in the Action stage, structured CBT techniques can be introduced as a concrete plan they have chosen to follow." },
            { type: "subheading", text: "MI + Harm Reduction" },
            { type: "paragraph", text: "For patients not ready for abstinence, MI is an ideal approach to explore harm reduction goals. It honors autonomy and supports any positive step the patient is willing to take to reduce harm associated with their behavior." },
        ]
    },
    23: {
        title: "MI for Complex Cases",
        content: [
            { type: "heading", text: "Co-Occurring Disorders" },
            { type: "paragraph", text: "When a patient has both a substance use disorder and a mental health condition, ambivalence can be layered and complex. MI provides a framework to explore change across both domains without being confrontational." },
        ]
    },
    24: {
        title: "Using MI with Mandated Clients",
        content: [
            { type: "heading", text: "Honoring Autonomy Under Pressure" },
            { type: "paragraph", text: "Clients mandated to treatment often begin in Precontemplation. A confrontational approach is rarely effective. MI's focus on empathy and autonomy is key." },
        ]
    },
    25: {
        title: "Measuring Your MI Fidelity",
        content: [
            { type: "heading", text: "From Competence to Proficiency" },
            { type: "paragraph", text: "Moving beyond simply 'doing MI' to doing it well requires feedback. The Motivational Interviewing Treatment Integrity (MITI) code is a behavioral coding system that assesses MI practice. A good self-assessment is to record a session and have at least twice as many reflections as questions." },
        ]
    },
    26: {
        title: "Strengthening Commitment Language",
        content: [
            { type: "heading", text: "From 'Maybe' to 'I Will'" },
            { type: "paragraph", text: "The goal of evoking is to not just hear change talk, but to guide the patient from preparatory language (Desire, Ability, Reasons, Need) to mobilizing language (Commitment, Activation, Taking Steps). This section covers techniques to bridge that gap." },
            { type: "subheading", text: "Key Questions" },
            {
                type: "list", items: [
                    "After hearing preparatory talk, ask: 'So what do you think you'll do?'",
                    "Use a summary: 'So you've said you want to change for your health, you believe you can do it, and you need to for your family. The next step seems to be deciding on a plan. What does that look like to you?'",
                    "Directly ask for commitment: 'What are you prepared to do this week?'"
                ]
            }
        ]
    },
    27: {
        title: "MI for Health Behavior Change",
        content: [
            { type: "heading", text: "Beyond Substance Use" },
            { type: "paragraph", text: "MI is a powerful tool for any behavior change, not just addiction. It is highly effective for promoting medication adherence, dietary changes, increasing physical activity, and managing chronic diseases like diabetes." },
            { type: "subheading", text: "Example: Medication Adherence" },
            { type: "paragraph", text: "Instead of telling a patient they must take their medication, explore their ambivalence. Ask: 'What are some of the things that get in the way of taking your medication as prescribed?' and 'On the other side, what are the benefits you notice when you do take it regularly?'" }
        ]
    },
    28: {
        title: "MI in Brief Interventions (SBIRT)",
        content: [
            { type: "heading", text: "Making Every Moment Count" },
            { type: "paragraph", text: "Screening, Brief Intervention, and Referral to Treatment (SBIRT) is a public health approach to deliver early intervention for individuals with or at risk of developing substance use disorders. MI is the core of the 'Brief Intervention' part." },
            { type: "subheading", text: "The 5-Minute Intervention" },
            { type: "paragraph", text: "In a busy ER or primary care setting, you may only have minutes. The key is to: Raise the subject, provide feedback from screening results, enhance motivation using a ruler or exploring pros and cons, and negotiate a plan. Even a small goal, like agreeing to think about it, is progress." }
        ]
    },
    29: {
        title: "Working with Anger and Defensiveness",
        content: [
            { type: "heading", text: "De-escalation and Engagement" },
            { type: "paragraph", text: "Anger and defensiveness are often signs of a patient feeling unheard or judged. Instead of confronting it, MI principles offer a way to 'roll with' this energy and maintain the therapeutic alliance." },
            { type: "subheading", text: "Techniques" },
            {
                type: "list", items: [
                    "Reflect the feeling: 'You're feeling very angry about being here.'",
                    "Apologize if appropriate: 'I can see I've overstepped. I apologize. Let's back up.'",
                    "Shift focus: Move away from the sensitive topic temporarily. 'Let's put that aside for a moment. Can we talk about what's been going well for you this week?'",
                    "Affirm autonomy: 'Ultimately, you're in control here, and I can't make you do anything you don't want to do.'"
                ]
            }
        ]
    },
    30: {
        title: "Cultural Adaptations of MI",
        content: [
            { type: "heading", text: "Respectful and Relevant Conversations" },
            { type: "paragraph", text: "While MI principles are broadly applicable, their expression must be culturally sensitive. What works as an affirmation in one culture might be inappropriate in another. It's crucial to adapt your approach to be respectful of the patient's cultural background, values, and communication style." },
            { type: "subheading", text: "Key Considerations" },
            {
                type: "list", items: [
                    "Family and Community: In collectivist cultures, decisions are often made with family or community input. Explore these influences: 'How does your family feel about this?'",
                    "Communication Styles: Be mindful of directness vs. indirectness, eye contact, and personal space.",
                    "Values: Frame the discrepancy between behavior and values that are culturally relevant to the patient."
                ]
            }
        ]
    },
};

const ResourceDetailView: React.FC<{ resourceId: number; onBack: () => void; }> = ({ resourceId, onBack }) => {
    const resource = RESOURCE_CONTENT[resourceId];

    if (!resource) {
        return <div className="p-4">Resource not found.</div>;
    }

    const renderContent = () => {
        return resource.content.map((item: any, index: number) => {
            switch (item.type) {
                case 'heading':
                    return <h3 key={index} className="text-xl font-bold text-[var(--color-text-primary)] mt-6 mb-2">{item.text}</h3>;
                case 'subheading':
                    return <h4 key={index} className="text-lg font-semibold text-[var(--color-text-primary)] mt-4 mb-1">{item.text}</h4>;
                case 'paragraph':
                    return <p key={index} className="text-[var(--color-text-secondary)] leading-relaxed mb-4 text-[15px]">{item.text}</p>;
                case 'list':
                    return (
                        <ul key={index} className="space-y-2 pl-4 text-[var(--color-text-secondary)] mb-4">
                            {item.items.map((li: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-[15px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                                    <span>{li}</span>
                                </li>
                            ))}
                        </ul>
                    );
                case 'dialogue':
                    return (
                        <Card key={index} variant="accent" padding="sm" className="border-l-4 border-[var(--color-primary)] my-4 bg-gray-50/50">
                            {item.lines.map((line: { speaker: string, text: string }, i: number) => (
                                <p key={i} className="mb-2 last:mb-0 text-[15px]">
                                    <span className={`font-semibold ${line.speaker.includes('Patient') ? 'text-[var(--color-error)]' : 'text-[var(--color-primary)]'}`}>{line.speaker}: </span>
                                    <span className="text-[var(--color-text-secondary)]">"{line.text}"</span>
                                </p>
                            ))}
                        </Card>
                    );
                default:
                    return null;
            }
        });
    };

    return (
        <div className="min-h-screen bg-transparent pb-24 px-4 sm:px-6">
            <header className="flex items-center mb-6 pt-6">
                <Button
                    variant="ghost"
                    size="icon-only"
                    onClick={onBack}
                    className="mr-3 text-[var(--color-text-primary)] hover:bg-black/5"
                    aria-label="Go back"
                >
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] line-clamp-1">{resource.title}</h1>
            </header>
            <main className="pb-8 max-w-3xl mx-auto">
                <Card variant="elevated" padding="lg" className="shadow-sm">
                    {renderContent()}
                </Card>
            </main>
        </div>
    );
};

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ onUpgrade, userTier, onBack }) => {
    const [viewingResourceId, setViewingResourceId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    // Initialize openCategory to "Introductory Principles" if it exists, otherwise null
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'Introductory Principles': true // Default open
    });

    const isPremium = userTier === UserTier.Premium;

    const toggleCategory = (categoryName: string) => {
        setOpenCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return resourcesData;
        const lowercasedFilter = searchTerm.toLowerCase();

        // When searching, we want to return categories that have matching items
        // And we should automatically expand categories with matches
        const results = resourcesData
            .map(category => ({
                ...category,
                items: category.items.filter(item =>
                    item.title.toLowerCase().includes(lowercasedFilter) ||
                    (item as any).description?.toLowerCase().includes(lowercasedFilter)
                ),
            }))
            .filter(category => category.items.length > 0);

        return results;
    }, [searchTerm]);

    // Auto-expand categories when searching
    useMemo(() => {
        if (searchTerm) {
            const newOpenState: Record<string, boolean> = {};
            filteredData.forEach(cat => {
                newOpenState[cat.category] = true;
            });
            setOpenCategories(newOpenState);
        }
    }, [searchTerm, filteredData]);

    const handleItemClick = (item: { id: number; premiumOnly: boolean; }) => {
        if (item.premiumOnly && !isPremium) {
            onUpgrade();
        } else {
            setViewingResourceId(item.id);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Introductory Principles':
                return <BookOpen size={24} className="text-[var(--color-primary)]" />;
            case 'Core Skills (OARS)':
                return <Target size={24} className="text-[var(--color-primary)]" />;
            case 'Advanced Techniques':
                return <Zap size={24} className="text-[var(--color-primary)]" />;
            default:
                return <FileText size={24} className="text-[var(--color-primary)]" />;
        }
    };

    if (viewingResourceId) {
        return <ResourceDetailView resourceId={viewingResourceId} onBack={() => setViewingResourceId(null)} />;
    }

    return (
        <div className="min-h-screen bg-transparent pb-24 flex flex-col max-w-2xl mx-auto w-full">
            {/* 1. Page Header */}
            <header className="px-4 pt-6 mb-8">
                <div className="flex items-center mb-2">
                    <Button
                        variant="ghost"
                        size="icon-only"
                        onClick={onBack}
                        className="mr-3 -ml-2 text-[#333] hover:bg-black/5"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={24} />
                    </Button>
                    <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                        Resource Library
                    </h1>
                </div>
                <p className="text-[14px] text-[var(--color-text-muted)] pl-1">
                    Learn the foundations and techniques of Motivational Interviewing
                </p>
            </header>

            {/* 2. Search Bar */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors"
                        size={20}
                    />
                    <input
                        type="text"
                        placeholder="Search topics, skills, techniques..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all placeholder:text-gray-400 text-[15px]"
                    />
                </div>
            </div>

            {/* 3. Content */}
            <main className="px-4 space-y-4">
                {filteredData.length > 0 ? (
                    filteredData.map(category => {
                        const isOpen = openCategories[category.category] || false;

                        return (
                            <div key={category.category} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-200">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(category.category)}
                                    className="w-full flex items-center p-5 text-left hover:bg-[#FAFAFA] transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mr-4 flex-shrink-0">
                                        {getCategoryIcon(category.category)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
                                            {category.category}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
                                            {category.items.length} articles
                                        </span>
                                        <ChevronRight
                                            size={20}
                                            className={`text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                                        />
                                    </div>
                                </button>

                                {/* Article Rows (Expanded) */}
                                {isOpen && (
                                    <div className="border-t border-[#F0F0F0]">
                                        {category.items.map((item: any, index) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleItemClick(item)}
                                                className={`group flex items-center p-4 cursor-pointer hover:bg-[#FAFAFA] transition-colors border-b border-[#F0F0F0] last:border-b-0 relative ${index === 0 ? 'pt-5' : ''} ${index === category.items.length - 1 ? 'pb-5' : ''}`}
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h3 className={`text-[15px] font-medium truncate ${item.premiumOnly && !isPremium ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                                                            {item.title}
                                                        </h3>
                                                        {item.premiumOnly && !isPremium && (
                                                            <Lock size={12} className="text-[var(--color-text-muted)]" />
                                                        )}
                                                    </div>
                                                    <p className="text-[13px] text-[var(--color-text-muted)] line-clamp-1">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    {item.readTime && (
                                                        <span className="text-[12px] text-[var(--color-text-muted)] hidden sm:block">
                                                            {item.readTime}
                                                        </span>
                                                    )}
                                                    <ChevronRight size={16} className="text-[#D4D4D4] group-hover:text-[var(--color-text-secondary)] transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-[16px] font-medium text-[var(--color-text-primary)] mb-1">
                            No resources found
                        </h3>
                        <p className="text-[14px] text-[var(--color-text-muted)]">
                            Try a broader search term
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ResourceLibrary;
