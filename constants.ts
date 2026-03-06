import { StageOfChange, PersonalityTrait } from './types';

// Personality traits that affect patient behavior and add complexity
export const PERSONALITY_TRAITS: Array<{
    id: PersonalityTrait;
    label: string;
    description: string;
}> = [
        {
            id: 'defensive',
            label: 'Defensive',
            description: 'Quick to justify behavior, deflects blame, may become guarded when challenged'
        },
        {
            id: 'emotional',
            label: 'Emotional',
            description: 'Expresses feelings openly, may tear up, get frustrated, or show vulnerability'
        },
        {
            id: 'reserved',
            label: 'Reserved',
            description: 'Gives short, guarded answers, finds it hard to open up to strangers'
        },
        {
            id: 'talkative',
            label: 'Talkative',
            description: 'Talks a lot, may go off-topic, shares stories and details freely'
        },
        {
            id: 'intellectualizer',
            label: 'Intellectualizer',
            description: 'Analyzes problems abstractly, avoids emotions, prefers logical discussion'
        },
        {
            id: 'pleaser',
            label: 'People Pleaser',
            description: 'Agrees easily to avoid conflict, but may not follow through on commitments'
        },
    ];

// Helper to get trait by ID
export const getPersonalityTraitById = (id: PersonalityTrait) =>
    PERSONALITY_TRAITS.find(trait => trait.id === id);

// Patient template variant structure for multiple backstories per topic
export interface PatientTemplateVariant {
    variantId: string;
    background: string;
    presentingProblem: string;
    history: string;
    chiefComplaint: string;
    conflictingChiefComplaint?: string;
    ageRange: [number, number];
    typicalTraits?: PersonalityTrait[]; // Suggested personality traits for this variant
}

export interface PatientTopicTemplate {
    topic: string;
    category: 'Alcohol' | 'Nicotine' | 'Cannabis' | 'Opioids' | 'Benzodiazepines' | 'Stimulants' | 'Other Substances' | 'Behavioral' | 'Health';
    variants: PatientTemplateVariant[];
}

export const PATIENT_DATA = {
    names: [
        // Original names
        'Alex Johnson', 'Jordan Smith', 'Taylor Brown', 'Casey Williams', 'Morgan Miller',
        'Riley Jones', 'Cameron Davis', 'Parker Garcia', 'Quinn Lee', 'Rowan Perez',
        'Dakota Hall', 'Avery Nelson', 'Samira Ahmed', 'Leo Chen', 'Sofia Rossi',
        'Javier Rodriguez', 'Chloe Kim', 'Mateo Garcia', 'Jamie Martinez', 'Blake Thompson',
        'River Anderson', 'Phoenix Wright', 'Skylar Moore', 'Sage Johnson', 'Kai Martinez',
        'Emery White', 'Finley Taylor', 'Hayden Clark', 'Reese Adams', 'Ellis Wilson',
        'Drew Mitchell', 'Logan Harris', 'Micah Turner', 'Nico Rodriguez', 'Zoe Patel',
        'Maya Singh', 'Ethan Kim', 'Isabella Chen', 'Lucas O\'Brien', 'Olivia Murphy',
        'Noah Walsh', 'Emma Fitzgerald', 'Liam Gallagher', 'Ava O\'Connor', 'Mason Byrne',

        // Hispanic/Latino
        'Carmen Reyes', 'Diego Morales', 'Lucia Fernandez', 'Rafael Gutierrez', 'Valentina Cruz',
        'Miguel Angel Torres', 'Elena Vazquez', 'Santiago Mendoza', 'Isabela Ramirez', 'Alejandro Vargas',

        // African American
        'Malik Washington', 'Aisha Jackson', 'DeShawn Harris', 'Imani Brooks', 'Tyrell Coleman',
        'Jada Robinson', 'Terrence Hayes', 'Nia Jenkins', 'Darius Carter', 'Ebony Williams',

        // South Asian
        'Priya Sharma', 'Arjun Patel', 'Ananya Gupta', 'Rohan Mehta', 'Kavita Nair',
        'Vikram Singh', 'Diya Reddy', 'Siddharth Malhotra', 'Meera Joshi', 'Dev Narayan',

        // East Asian
        'Wei Zhang', 'Yuki Tanaka', 'Jin-ho Park', 'Mei Lin Wu', 'Hiro Nakamura',
        'Sakura Suzuki', 'Min-jun Kim', 'Li Wei', 'Hana Saito', 'Jun-seo Lee',

        // Middle Eastern
        'Omar Hassan', 'Fatima Al-Rashid', 'Tariq Mansour', 'Layla Khoury', 'Amir Nazari',
        'Zainab Abdullah', 'Youssef Haddad', 'Noor Ibrahim', 'Karim Saliba', 'Rania Farhat',

        // Filipino
        'Maria Santos', 'Jose Reyes', 'Angelica Cruz', 'Mark Villanueva', 'Patricia Bautista',
        'Gabriel Delos Santos', 'Christine Garcia', 'Paolo Ramos', 'Jasmine Tolentino', 'Rico Mendoza'
    ],
    sexes: ['Male', 'Female', 'Non-binary'] as ('Male' | 'Female' | 'Non-binary')[],
    stagesOfChange: [
        StageOfChange.Precontemplation,
        StageOfChange.Contemplation,
        StageOfChange.Preparation,
        StageOfChange.Action,
        StageOfChange.Maintenance,
    ],
};

// New variant-based patient templates - each topic has multiple backstory variants
export const PATIENT_TOPIC_TEMPLATES: PatientTopicTemplate[] = [
    // ========== ALCOHOL ==========
    {
        topic: 'Binge Drinking (Beer)',
        category: 'Alcohol',
        variants: [
            {
                variantId: 'beer-tech-worker',
                presentingProblem: 'Patient is here at the urging of their partner after a recent embarrassing incident at a social event due to excessive beer consumption.',
                history: 'History of heavy weekend drinking since college. Recently, consumption has increased to 4-5 nights a week, primarily craft beer. No previous attempts to quit.',
                chiefComplaint: "My partner is overreacting. So I had a few too many IPAs, it's not a big deal. Everyone was drinking. I'm just here to get them off my back.",
                background: "A {age}-year-old software engineer in a competitive startup environment. Social life revolves around brewery visits and after-work drinks with colleagues.",
                ageRange: [26, 32],
                typicalTraits: ['defensive', 'intellectualizer'],
            },
            {
                variantId: 'beer-former-athlete',
                presentingProblem: 'Patient was referred by HR after showing up to work smelling of alcohol on multiple occasions.',
                history: 'Drinking heavily since college days when it was part of the team culture. Beer consumption has become a daily habit, often starting in the afternoon.',
                chiefComplaint: "HR is making this into a bigger deal than it is. I had a few beers at lunch, so what? I can still do my job. This is just team culture, everyone drinks.",
                background: "A {age}-year-old former college football player now working in insurance sales. Drinking is central to his social identity and male bonding rituals.",
                ageRange: [28, 38],
                typicalTraits: ['defensive', 'talkative'],
            },
            {
                variantId: 'beer-lonely-retiree',
                presentingProblem: "Patient's adult children are concerned about their father's daily beer consumption and increasing isolation since retirement.",
                history: 'Moderate drinker most of life, but consumption increased dramatically after retirement and the death of spouse two years ago. Now drinks 6-8 beers daily.',
                chiefComplaint: "My kids worry too much. A few beers help me relax. What else am I supposed to do all day? It's not like I'm hurting anyone.",
                conflictingChiefComplaint: "I've been feeling pretty low since Martha passed. The days just feel so long now. I was hoping to talk about maybe getting something for sleep.",
                background: "A {age}-year-old recently retired factory worker whose wife passed away two years ago. Lives alone and has limited social connections outside of family.",
                ageRange: [65, 75],
                typicalTraits: ['reserved', 'emotional'],
            },
        ],
    },
    {
        topic: 'Daily Wine Consumption',
        category: 'Alcohol',
        variants: [
            {
                variantId: 'wine-stressed-teacher',
                presentingProblem: 'Patient is self-referred due to growing concerns about their nightly habit of drinking a bottle of wine to "unwind" and its impact on their energy levels and sleep.',
                history: 'Started with a glass of wine with dinner, which has gradually escalated to a full bottle or more per night over the past two years. Has tried to cut back but experiences irritability and anxiety.',
                chiefComplaint: "I feel like I need wine to relax after a stressful day, but I wake up feeling groggy and anxious. I'm worried it's becoming a crutch I can't function without.",
                conflictingChiefComplaint: "I'm really struggling with my sleep and stress levels. I was hoping to talk about some strategies for that. The wine is just a symptom, not the real problem.",
                background: "A {age}-year-old high school teacher, married with two teenage children. Experiences significant stress from their job and family responsibilities.",
                ageRange: [42, 50],
                typicalTraits: ['emotional', 'pleaser'],
            },
            {
                variantId: 'wine-empty-nester',
                presentingProblem: "Patient's spouse has expressed concern about the amount of wine being consumed, particularly as it has become a source of marital conflict.",
                history: 'Wine consumption increased after children left for college. What started as "wine with dinner" has become 2-3 bottles throughout the evening, often drinking alone.',
                chiefComplaint: "My husband thinks I drink too much, but he doesn't understand how lonely I feel. The kids are gone, he works all the time... wine is my companion now.",
                background: "A {age}-year-old former stay-at-home mother whose children recently left for college. Struggling with identity and purpose in this new phase of life.",
                ageRange: [50, 58],
                typicalTraits: ['emotional', 'talkative'],
            },
            {
                variantId: 'wine-high-achiever',
                presentingProblem: 'Patient is concerned about memory lapses and weight gain, which they suspect may be related to their wine consumption.',
                history: 'High-powered career with regular client dinners involving wine. Over time, drinking expanded to include a bottle at home every night "to decompress."',
                chiefComplaint: "I pride myself on being sharp, but lately I'm forgetting things. My suits don't fit. I know the wine isn't helping, but it's the only way I can turn off my brain after work.",
                background: "A {age}-year-old corporate lawyer at a prestigious firm. Success-driven and used to being in control, now feeling their drinking may be controlling them.",
                ageRange: [38, 48],
                typicalTraits: ['intellectualizer', 'defensive'],
            },
        ],
    },
    {
        topic: 'Heavy Liquor Use',
        category: 'Alcohol',
        variants: [
            {
                variantId: 'liquor-party-scene',
                presentingProblem: 'Patient was brought in by a friend after a dangerous episode of intoxication involving tequila shots, resulting in a fall. Patient has memory gaps from the event.',
                history: 'Uses liquor as a "party starter" on weekends. This has led to several blackouts, arguments, and risky behaviors in the past year.',
                chiefComplaint: "My friend is freaking out, but I was just having fun. I don't remember falling. Maybe I should slow down, but I don't think I have a 'problem' like they say.",
                background: "A {age}-year-old recent college graduate working in sales. Lives with roommates and frequently goes to bars and clubs.",
                ageRange: [22, 26],
                typicalTraits: ['defensive', 'talkative'],
            },
            {
                variantId: 'liquor-trauma-history',
                presentingProblem: 'Patient presents after their partner threatened to leave if they don\'t address their whiskey consumption, which has led to verbal outbursts.',
                history: 'Started drinking heavily after returning from military service. Uses whiskey to manage nightmares and intrusive thoughts. Drinking has escalated to a fifth every 2-3 days.',
                chiefComplaint: "The whiskey helps me sleep. Without it, the nightmares come back. My girlfriend doesn't get what I've been through. But I don't want to lose her...",
                background: "A {age}-year-old military veteran who served two tours overseas. Works as a security guard and has difficulty connecting with civilians.",
                ageRange: [28, 40],
                typicalTraits: ['reserved', 'defensive'],
            },
            {
                variantId: 'liquor-family-pattern',
                presentingProblem: 'Patient is here at the suggestion of their AA sponsor after multiple relapses involving vodka.',
                history: 'Family history of alcoholism. Has been in and out of AA for 10 years. Recent divorce triggered the current relapse. Hiding vodka around the house.',
                chiefComplaint: "I know I'm an alcoholic. I've been sober before. But when Jennifer left, I just... I couldn't cope. I hate myself for going back to it.",
                conflictingChiefComplaint: "I'm really here because my sponsor said I should check in with someone. I've got this under control now. Just had a rough patch.",
                background: "A {age}-year-old electrician going through a divorce. Grew up with an alcoholic father and swore they'd never end up the same way.",
                ageRange: [42, 52],
                typicalTraits: ['emotional', 'pleaser'],
            },
        ],
    },

    // ========== NICOTINE ==========
    {
        topic: 'Vaping (Nicotine)',
        category: 'Nicotine',
        variants: [
            {
                variantId: 'vape-remote-worker',
                presentingProblem: 'Patient wants to quit vaping due to the high cost and a recent health scare (persistent cough), but finds the cravings overwhelming.',
                history: 'Started vaping to quit smoking cigarettes 3 years ago but is now vaping more heavily than they ever smoked. Uses high-potency nicotine salt e-liquids throughout the day.',
                chiefComplaint: "This thing is attached to my hand from morning till night. It costs a fortune, and this cough is worrying me. I want to quit, I just don't know if I have the willpower.",
                background: "A {age}-year-old graphic designer who works from home. Vaping is heavily integrated into their work routine and moments of stress or creative blocks.",
                ageRange: [28, 35],
                typicalTraits: ['intellectualizer', 'pleaser'],
            },
            {
                variantId: 'vape-teen-peer-pressure',
                presentingProblem: "Patient is a teen whose parents discovered their vaping after finding a device. They're here reluctantly at their parents' insistence.",
                history: 'Started vaping a year ago when friends introduced it as "cool and harmless." Now uses multiple pods per week and experiences irritability without it.',
                chiefComplaint: "Everyone at school vapes. It's not a big deal. My parents are overreacting. It's not like I'm smoking cigarettes or doing drugs.",
                background: "A {age}-year-old high school student who started vaping to fit in with peers. Academically strong but struggles with social confidence.",
                ageRange: [15, 17],
                typicalTraits: ['defensive', 'reserved'],
            },
            {
                variantId: 'vape-pregnant',
                presentingProblem: 'Patient just found out they are pregnant and is worried about the effects of vaping on the baby, but is struggling to quit.',
                history: 'Switched from cigarettes to vaping 2 years ago, believing it to be safer. Now vapes continuously throughout the day and experiences severe cravings when trying to stop.',
                chiefComplaint: "I know I shouldn't be vaping while pregnant. I've tried to stop but I get so anxious and irritable. I'm scared I'm hurting my baby but I don't know how to stop.",
                background: "A {age}-year-old expectant mother in her first trimester. Works as a dental hygienist and is terrified of the stigma of vaping while pregnant.",
                ageRange: [25, 32],
                typicalTraits: ['emotional', 'pleaser'],
            },
        ],
    },
    {
        topic: 'Cigarette Smoking',
        category: 'Nicotine',
        variants: [
            {
                variantId: 'cig-new-parent',
                presentingProblem: 'Patient recently had a child and their partner is insisting they quit smoking. They are ambivalent because smoking is their primary coping mechanism for stress.',
                history: 'Smoker since age 16, about a pack a day. Has made several half-hearted quit attempts in the past but always relapsed during stressful periods.',
                chiefComplaint: "I know it's bad for me, and I don't want the baby breathing it in. But with a newborn, I'm more stressed than ever. A cigarette is the only five minutes of peace I get all day.",
                background: "A {age}-year-old new parent working as a mechanic. Many coworkers smoke, and smoke breaks are a key part of their social routine at work.",
                ageRange: [30, 40],
                typicalTraits: ['reserved', 'defensive'],
            },
            {
                variantId: 'cig-copd-diagnosis',
                presentingProblem: 'Patient was recently diagnosed with early-stage COPD and told by their pulmonologist that they must quit smoking immediately.',
                history: 'Has been smoking 1-2 packs daily for over 30 years. Multiple quit attempts using patches and gum, none lasting more than a few weeks.',
                chiefComplaint: "The doctor showed me my lung scans and it scared me. I don't want to end up on oxygen like my father did. But I've been smoking longer than I haven't. I don't know who I am without cigarettes.",
                background: "A {age}-year-old postal worker who has been smoking since their teenage years. Watched their father die of emphysema.",
                ageRange: [55, 65],
                typicalTraits: ['emotional', 'reserved'],
            },
            {
                variantId: 'cig-social-smoker',
                presentingProblem: "Patient's doctor strongly recommended quitting after their blood pressure readings have been consistently elevated.",
                history: 'Describes self as a "social smoker" but actually smokes half a pack daily. Tends to minimize the habit and doesn\'t consider themselves a "real" smoker.',
                chiefComplaint: "I'm not really a smoker, I just have a few when I'm out with friends or stressed at work. My doctor is making too big a deal of this. Maybe I'll just cut back a little.",
                background: "A {age}-year-old marketing manager who smokes more than they admit to themselves or others. Associates smoking with social situations and work breaks.",
                ageRange: [32, 42],
                typicalTraits: ['defensive', 'intellectualizer'],
            },
        ],
    },

    // ========== CANNABIS ==========
    {
        topic: 'Daily Cannabis Use',
        category: 'Cannabis',
        variants: [
            {
                variantId: 'cannabis-musician',
                presentingProblem: "Patient is experiencing a persistent, phlegmy cough and is worried about their lung health. They also report feeling unmotivated and 'in a rut'.",
                history: 'Has been smoking cannabis daily since college. Now smokes several times a day, from morning to night. Finds it difficult to imagine their life without it.',
                chiefComplaint: "This cough won't go away, and I feel like my lungs are heavy. I also just feel... stuck. I have goals, things I want to do, but I never seem to get around to them.",
                background: "A {age}-year-old musician and gig-worker. Associates cannabis with creativity and relaxation, but is starting to see how it might be hindering their professional progress.",
                ageRange: [27, 34],
                typicalTraits: ['talkative', 'intellectualizer'],
            },
            {
                variantId: 'cannabis-anxiety-self-med',
                presentingProblem: 'Patient uses cannabis daily to manage anxiety but has noticed increasing tolerance and is needing more to achieve the same calming effect.',
                history: 'Started using cannabis for anxiety in early 20s. Now relies on it throughout the day to function. Has tried to take tolerance breaks but experiences severe rebound anxiety.',
                chiefComplaint: "Weed is my medication. It's the only thing that calms my anxiety. But lately it's not working as well, and I'm smoking more and more. I'm spending too much money on it.",
                background: "A {age}-year-old barista who has struggled with anxiety since childhood. Has avoided conventional treatment, preferring to self-medicate with cannabis.",
                ageRange: [24, 30],
                typicalTraits: ['emotional', 'defensive'],
            },
            {
                variantId: 'cannabis-relationship-strain',
                presentingProblem: "Patient's partner has given them an ultimatum about their cannabis use, which they feel is destroying their relationship.",
                history: 'Has been using cannabis daily for over a decade. Partner initially was fine with it but has grown increasingly frustrated with the patient\'s lack of motivation and emotional unavailability.',
                chiefComplaint: "My girlfriend says she can't take it anymore. She says I'm always high and never present. I love her, but I also don't think I can just stop. Weed is how I decompress.",
                conflictingChiefComplaint: "We've been having some relationship issues, communication problems mostly. I think she's using the weed as an excuse when the real issues are deeper.",
                background: "A {age}-year-old warehouse manager in a long-term relationship. Partner is considering leaving if things don't change.",
                ageRange: [32, 40],
                typicalTraits: ['reserved', 'defensive'],
            },
        ],
    },
    {
        topic: 'THC Edibles',
        category: 'Cannabis',
        variants: [
            {
                variantId: 'edibles-work-performance',
                presentingProblem: 'Patient\'s work performance is suffering due to daily use of high-potency THC gummies. They report feeling "in a fog" and unmotivated.',
                history: 'Began using edibles for sleep a year ago. Now uses them throughout the day to manage anxiety, consuming up to 100mg of THC daily. Their recent performance review at work was poor.',
                chiefComplaint: "My boss told me I seem distracted and my work is slipping. The edibles used to help my anxiety, but now I just feel... slow. I don't feel high, just not sharp.",
                background: "A {age}-year-old paralegal under high pressure at a corporate law firm. Is worried about losing their job.",
                ageRange: [32, 40],
                typicalTraits: ['intellectualizer', 'pleaser'],
            },
            {
                variantId: 'edibles-chronic-pain',
                presentingProblem: 'Patient is using increasingly high doses of THC edibles for chronic pain management but is concerned about cognitive side effects.',
                history: 'Started using edibles after back surgery when they wanted to reduce opioid use. Tolerance has built to the point where they need very high doses, which leave them impaired.',
                chiefComplaint: "The edibles help my pain without the scary stuff that comes with pills. But I'm taking so much now that I feel foggy all the time. My kids have noticed. It's affecting my whole life.",
                background: "A {age}-year-old parent of two who had spinal fusion surgery three years ago. Chronic pain persists and they're trying to avoid becoming dependent on prescription opioids.",
                ageRange: [42, 52],
                typicalTraits: ['emotional', 'reserved'],
            },
        ],
    },

    // ========== OPIOIDS ==========
    {
        topic: 'Fentanyl Use (Illicit)',
        category: 'Opioids',
        variants: [
            {
                variantId: 'fentanyl-overdose-survivor',
                presentingProblem: 'Patient is here due to a court mandate following an overdose on what they thought was heroin, but was actually fentanyl. They are terrified of overdosing again but also of withdrawal.',
                history: 'Long history of opioid use, starting with prescription pain pills and progressing to heroin. Recently started using pressed pills sold as "oxys" which are likely illicit fentanyl.',
                chiefComplaint: "I honestly thought I was going to die. I never want to feel that way again. But the thought of getting sick from withdrawal... I can't handle it. I don't see a way out.",
                background: "A {age}-year-old who has been unemployed for a year and is experiencing housing instability, often couch-surfing. Has lost contact with most of their family.",
                ageRange: [25, 34],
                typicalTraits: ['emotional', 'reserved'],
            },
            {
                variantId: 'fentanyl-young-professional',
                presentingProblem: 'Patient was found unresponsive by roommate and revived with Narcan. This is their first time seeking help for substance use.',
                history: 'Started using prescription opioids recreationally in college. Progressed to buying pills that are likely pressed fentanyl. Has been hiding use from friends and family.',
                chiefComplaint: "I never thought I'd be 'that person.' I have a good job, a nice apartment... but I keep doing these pills and I know they're dangerous. When I woke up with the EMTs there, I realized I could have died.",
                background: "A {age}-year-old marketing professional who comes from an upper-middle-class family. Has been functioning at work but living a double life.",
                ageRange: [24, 30],
                typicalTraits: ['intellectualizer', 'pleaser'],
            },
        ],
    },
    {
        topic: 'Prescription Pain Meds (Oxycodone)',
        category: 'Opioids',
        variants: [
            {
                variantId: 'oxy-chronic-pain',
                presentingProblem: 'Patient is running out of their oxycodone prescription early each month and is requesting an increased dose, showing signs of tolerance and dependence.',
                history: 'Prescribed oxycodone for chronic back pain after a car accident 2 years ago. Initially took as prescribed, but now takes extra doses for stress and emotional relief.',
                chiefComplaint: "Doctor, the pills just aren't working like they used to. The pain is breaking through more and more. I think I need a higher dose to manage it properly.",
                background: "A {age}-year-old former construction worker on disability. Lives alone and reports high levels of boredom and depression.",
                ageRange: [48, 58],
                typicalTraits: ['defensive', 'emotional'],
            },
            {
                variantId: 'oxy-post-surgery',
                presentingProblem: 'Patient had surgery six months ago but is still requesting opioid refills. Surgeon has declined and referred patient to discuss other options.',
                history: 'Underwent knee replacement surgery. Was prescribed oxycodone for post-operative pain and has been unable or unwilling to taper off despite the expected healing timeline.',
                chiefComplaint: "The surgeon doesn't understand. The pain is still there. Maybe the surgery didn't work properly. I need more time on the medication before I can even think about stopping.",
                conflictingChiefComplaint: "I'm mostly here to talk about why my knee still hurts so much. I think something went wrong with the surgery. The pills are the only thing that help.",
                background: "A {age}-year-old retired nurse who prided themselves on their medical knowledge. Now feels dismissed by doctors and is becoming increasingly isolated.",
                ageRange: [58, 68],
                typicalTraits: ['intellectualizer', 'defensive'],
            },
        ],
    },

    // ========== BENZODIAZEPINES ==========
    {
        topic: 'Prescription Benzodiazepine Misuse',
        category: 'Benzodiazepines',
        variants: [
            {
                variantId: 'benzo-doctor-shopping',
                presentingProblem: "Patient is seeking a new doctor to get a refill for their alprazolam (Xanax) prescription, after their previous doctor refused.",
                history: 'Prescribed Xanax for panic attacks five years ago. Now takes it daily to manage general anxiety and stress, often taking more than prescribed.',
                chiefComplaint: "My last doctor cut me off. He doesn't understand how bad my anxiety is. I can't sleep, my heart races... I need my medication to just feel normal.",
                background: "A {age}-year-old stay-at-home parent who feels overwhelmed with childcare and household responsibilities. Feels isolated and believes the medication is the only thing holding them together.",
                ageRange: [38, 48],
                typicalTraits: ['emotional', 'pleaser'],
            },
            {
                variantId: 'benzo-executive-function',
                presentingProblem: 'Patient is concerned about memory problems and difficulty concentrating, which may be related to long-term benzodiazepine use.',
                history: 'Has been on clonazepam for generalized anxiety for over 8 years. Dose has gradually increased. Recently noticed significant cognitive issues affecting work performance.',
                chiefComplaint: "I'm forgetting things, losing words mid-sentence. My work is suffering. I read that benzos can cause this but I'm terrified to stop. The anxiety would be unbearable.",
                background: "A {age}-year-old finance executive who manages a large team. The cognitive decline is threatening their career, but anxiety has been a lifelong struggle.",
                ageRange: [45, 55],
                typicalTraits: ['intellectualizer', 'reserved'],
            },
        ],
    },
    {
        topic: 'Recreational Benzodiazepine Use',
        category: 'Benzodiazepines',
        variants: [
            {
                variantId: 'illicit-benzo-college',
                presentingProblem: 'Patient was brought to the campus health center by a resident advisor after being found unresponsive in a dorm hallway. Toxicology confirmed alprazolam.',
                history: 'Has been buying pressed Xanax bars from a dealer on campus for about a year. Uses them at parties and to "take the edge off" before social events. Recently started taking them alone to manage academic stress.',
                chiefComplaint: "I don't know why everyone is making such a big deal. I just took a couple bars at a party and fell asleep. It's not like I'm addicted. Half the people in my dorm do the same thing.",
                conflictingChiefComplaint: "I've been really anxious lately, like panic-attack level. The Xanax helps me feel normal at parties. Without it I just stand in the corner. I don't know how to be social without it.",
                background: "A {age}-year-old college sophomore studying communications. Struggles with social anxiety and uses street-bought Xanax as a social lubricant, particularly before parties and campus events.",
                ageRange: [19, 22],
                typicalTraits: ['defensive', 'reserved'],
            },
            {
                variantId: 'illicit-benzo-pressed-pills',
                presentingProblem: 'Patient presents to an urgent care clinic with severe anxiety and tremors after running out of street-purchased benzodiazepines. A friend drove them in.',
                history: 'Started buying "bars" and pressed pills from social media dealers about two years ago. Has no prescription and has never been evaluated for an anxiety disorder. Uses daily, often not knowing exactly what is in the pills.',
                chiefComplaint: "I ran out of my bars two days ago and I feel like I'm dying. My hands won't stop shaking, my heart is pounding. I just need something to get me through. I'm not a drug addict, I just need them to function.",
                background: "A {age}-year-old warehouse worker who buys pressed benzodiazepine pills through social media contacts. Has developed physical dependence without realizing the danger of abrupt cessation from unknown substances.",
                ageRange: [23, 30],
                typicalTraits: ['emotional', 'defensive'],
            },
        ],
    },
    {
        topic: 'Benzodiazepine Taper & Withdrawal',
        category: 'Benzodiazepines',
        variants: [
            {
                variantId: 'taper-failed-attempt',
                presentingProblem: 'Patient is seeking a new provider after a previous doctor attempted to taper their lorazepam (Ativan) too quickly, resulting in severe withdrawal symptoms including a seizure.',
                history: 'Has been on lorazepam 2mg three times daily for six years for panic disorder. Previous provider attempted a rapid taper over two weeks. Patient experienced tremors, insomnia, and a withdrawal seizure, which traumatized them.',
                chiefComplaint: "The last doctor tried to take me off Ativan cold turkey and I had a seizure. I ended up in the ER. I want to get off these pills eventually, but I'm terrified. I need someone who understands that you can't just rip them away.",
                background: "A {age}-year-old school counselor who has been on benzodiazepines since a period of severe panic attacks after a car accident. The failed taper attempt has left them deeply fearful of any dose reduction.",
                ageRange: [38, 50],
                typicalTraits: ['emotional', 'intellectualizer'],
            },
            {
                variantId: 'taper-long-term-elderly',
                presentingProblem: "Patient's new geriatrician has recommended discontinuing diazepam (Valium) due to fall risk and cognitive concerns, but the patient has been on it for decades and is resistant.",
                history: 'Prescribed Valium in the 1990s for generalized anxiety. Has been on 10mg daily for over 25 years. Multiple doctors have continued the prescription without question until the current geriatrician raised concerns about falls and dementia risk.',
                chiefComplaint: "I've been taking Valium since before some of my doctors were born. It works, and I've never had a problem. Now this new doctor wants to take it away? At my age, why fix what isn't broken?",
                conflictingChiefComplaint: "My daughter keeps reading things online about Valium and dementia and she's worried sick. I don't want to upset her, but I honestly don't think I can manage without it. The anxiety would come roaring back.",
                background: "A {age}-year-old retired postal worker who has been taking diazepam daily for over two decades. Fell twice in the past year and is showing mild cognitive decline that may be medication-related.",
                ageRange: [68, 78],
                typicalTraits: ['defensive', 'reserved'],
            },
        ],
    },
    {
        topic: 'Benzodiazepine & Alcohol Co-Use',
        category: 'Benzodiazepines',
        variants: [
            {
                variantId: 'benzo-alcohol-blackouts',
                presentingProblem: 'Patient is here after their spouse found them unconscious on the kitchen floor. ER visit revealed a combination of clonazepam and alcohol. Spouse insists they get help.',
                history: 'Prescribed clonazepam (Klonopin) 1mg at bedtime for insomnia. Also drinks 2-3 glasses of wine most evenings. Has had multiple blackout episodes in the past six months but attributes them to being "overtired."',
                chiefComplaint: "My wife is overreacting. I just had some wine with dinner and took my regular Klonopin. I must have been extra tired. I don't mix them on purpose, it just... happens. The doctor prescribed the Klonopin, so it must be safe.",
                conflictingChiefComplaint: "Honestly, I know the wine and Klonopin together aren't great. But the Klonopin alone doesn't work anymore, and neither does wine by itself. Together they actually let me sleep. I'm scared to stop either one.",
                background: "A {age}-year-old middle manager at a manufacturing company. Experiences significant work stress and has normalized the nightly combination of wine and prescribed clonazepam as a sleep routine.",
                ageRange: [42, 54],
                typicalTraits: ['defensive', 'pleaser'],
            },
            {
                variantId: 'benzo-alcohol-young-adult',
                presentingProblem: 'Patient was referred by their therapist after disclosing a pattern of mixing alprazolam with heavy drinking on weekends, sometimes losing entire days.',
                history: 'Takes alprazolam prescribed by a psychiatrist for generalized anxiety. On weekends, takes extra doses before going out and drinks heavily. Has had multiple dangerous episodes including unprotected sex, fights, and one car accident.',
                chiefComplaint: "My therapist said I had to come talk to someone about the Xanax and drinking. I know it's dumb to mix them, but when I go out, the anxiety is so bad I need both. I just want to have a normal social life.",
                background: "A {age}-year-old dental hygienist who manages anxiety well during the workweek with prescribed alprazolam but escalates use dramatically on weekends, combining it with binge drinking in social settings.",
                ageRange: [24, 32],
                typicalTraits: ['emotional', 'talkative'],
            },
        ],
    },
    {
        topic: 'Sleep Aid Dependence (Benzodiazepine)',
        category: 'Benzodiazepines',
        variants: [
            {
                variantId: 'sleep-benzo-shift-worker',
                presentingProblem: 'Patient is requesting continued refills of temazepam (Restoril) for insomnia related to rotating shift work. Current provider is concerned about long-term use and tolerance.',
                history: 'Prescribed temazepam 15mg two years ago for shift-work-related insomnia. Has escalated to 30mg nightly and sometimes takes an extra dose when sleep still does not come. Cannot fall asleep without it even on nights off.',
                chiefComplaint: "My schedule rotates between days and nights. Without temazepam I lie there for hours staring at the ceiling. I've tried melatonin, chamomile tea, all that stuff. Nothing else works. Why would you take away the one thing that helps?",
                background: "A {age}-year-old ICU nurse who works rotating 12-hour shifts. The irregular schedule has made natural sleep nearly impossible, and temazepam has become a nightly requirement regardless of shift pattern.",
                ageRange: [30, 42],
                typicalTraits: ['intellectualizer', 'defensive'],
            },
            {
                variantId: 'sleep-benzo-grief-insomnia',
                presentingProblem: "Patient has been using their late spouse's leftover triazolam (Halcion) for insomnia that started after the spouse's death. Now running out and seeking a prescription.",
                history: 'Insomnia began after the death of their spouse eight months ago. Found the spouse\'s triazolam prescription and began taking it nightly. It has been the only thing allowing any sleep. Bottle is nearly empty and patient is anxious about running out.',
                chiefComplaint: "I haven't slept properly since my husband died. I found his sleeping pills and they're the only thing that lets me get a few hours. I know they're not prescribed for me but I'm desperate. I just need sleep to get through this.",
                conflictingChiefComplaint: "I've been having a really hard time since my husband passed. Everything reminds me of him, especially at night. I was hoping you could help me with the insomnia. I've been taking something but it's running out.",
                background: "A {age}-year-old recently widowed librarian who has been self-medicating grief-related insomnia with their deceased spouse's leftover benzodiazepine prescription. The grief remains largely unprocessed.",
                ageRange: [55, 68],
                typicalTraits: ['emotional', 'reserved'],
            },
        ],
    },

    // ========== STIMULANTS ==========
    {
        topic: 'Methamphetamine Use',
        category: 'Stimulants',
        variants: [
            {
                variantId: 'meth-truck-driver',
                presentingProblem: 'Patient presents with severe dental decay, significant weight loss, and paranoia. They were brought in by a family member concerned about their erratic behavior.',
                history: 'Initiated meth use 18 months ago to work longer hours at a manual labor job. Use has escalated to daily, with multi-day binges. Has become socially withdrawn and paranoid.',
                chiefComplaint: "My family is trying to control me. They don't understand the pressure I'm under. I'm fine, I just need everyone to leave me alone. Why are they looking at me like that?",
                background: "A {age}-year-old truck driver who is at risk of losing their job due to missed shifts and strange behavior. Is divorced and has strained relationships with their children.",
                ageRange: [38, 48],
                typicalTraits: ['defensive', 'reserved'],
            },
            {
                variantId: 'meth-gay-scene',
                presentingProblem: 'Patient is concerned about their meth use, which started in the context of the party and chemsex scene. A recent HIV diagnosis has prompted them to reevaluate.',
                history: 'Started using crystal meth at parties about two years ago. Use has become more frequent, associated with sexual encounters. Recently diagnosed with HIV at a routine screening.',
                chiefComplaint: "The diagnosis was a wake-up call. The meth... it's tied up with everything. The parties, the sex, my whole social life. But I can't keep going like this. I could have died.",
                background: "A {age}-year-old flight attendant who is part of an active social scene where meth use is common. Struggling with shame and isolation after the diagnosis.",
                ageRange: [28, 38],
                typicalTraits: ['emotional', 'talkative'],
            },
        ],
    },
    {
        topic: 'Cocaine Use',
        category: 'Stimulants',
        variants: [
            {
                variantId: 'cocaine-finance',
                presentingProblem: 'Patient is in financial crisis due to a weekly cocaine habit that has escalated. They are seeking help after taking out a high-interest loan to cover their drug-related debts.',
                history: 'Casual weekend user for years, but use escalated to 3-4 times a week after a promotion. Spends hundreds of dollars a week on cocaine, hiding the expense from their spouse.',
                chiefComplaint: "I've gotten myself into a real financial mess. I keep telling myself I'll stop, just for the weekends, but then Friday comes... I never thought I'd be in debt over this.",
                background: "A {age}-year-old in finance who associates cocaine use with success and networking. Is married and just bought a new house, adding to financial pressure.",
                ageRange: [35, 45],
                typicalTraits: ['intellectualizer', 'defensive'],
            },
            {
                variantId: 'cocaine-restaurant-industry',
                presentingProblem: 'Patient had a cardiac event (palpitations, chest pain) after a cocaine binge and is shaken. ER doctors told them to stop using immediately.',
                history: 'Works in a restaurant where cocaine use is rampant. Uses multiple times per week to get through long shifts. Has been brushing off warning signs like nosebleeds and heart racing.',
                chiefComplaint: "I thought I was having a heart attack. I'm only 32. The ER doctor said my heart could give out if I keep this up. I'm scared, but everyone at work uses. How do I stop when it's everywhere?",
                background: "A {age}-year-old sous chef at a high-end restaurant. The industry culture normalizes drug use, and long, stressful hours make it feel necessary to keep up.",
                ageRange: [28, 36],
                typicalTraits: ['emotional', 'pleaser'],
            },
        ],
    },
    {
        topic: 'Prescription Stimulant Misuse (Adderall)',
        category: 'Stimulants',
        variants: [
            {
                variantId: 'adderall-grad-student',
                presentingProblem: 'Patient is a graduate student who has been using Adderall obtained from friends to get through exams and deadlines. Use has become daily.',
                history: 'Started using occasionally during undergrad finals. Now uses daily and experiences crashes, irritability, and insomnia. Has never been evaluated for ADHD.',
                chiefComplaint: "I can't focus without it anymore. But I'm not sleeping, I'm losing weight, and I snap at everyone. I don't know if I actually have ADHD or if I've just created a dependency.",
                background: "A {age}-year-old PhD candidate in biology facing intense pressure to publish and complete their dissertation. Academic identity is everything to them.",
                ageRange: [24, 30],
                typicalTraits: ['intellectualizer', 'pleaser'],
            },
            {
                variantId: 'adderall-working-mom',
                presentingProblem: "Patient has been using their child's Adderall prescription to manage the demands of work and parenting. Now experiencing dependence.",
                history: 'Started taking a pill here and there to manage exhaustion. Now takes multiple pills daily and is running through the prescription faster than it can be refilled.',
                chiefComplaint: "I know it's wrong, I'm taking my kid's medication. But I'm a single mom with two jobs. Without it, I literally cannot keep up. I'm terrified of what happens when the bottle runs out.",
                background: "A {age}-year-old single mother of two, working multiple part-time jobs. Exhausted and overwhelmed, with no support system or time for self-care.",
                ageRange: [32, 42],
                typicalTraits: ['emotional', 'defensive'],
            },
        ],
    },

    // ========== OTHER SUBSTANCES ==========
    {
        topic: 'Kratom Dependence',
        category: 'Other Substances',
        variants: [
            {
                variantId: 'kratom-chronic-pain',
                presentingProblem: 'Patient is trying to stop using kratom, which they initially took for chronic pain and energy, but is now experiencing significant withdrawal symptoms.',
                history: 'Started using kratom powder from an online vendor 3 years ago as a "natural" alternative to pain medication. Consumption has grown to 30-40 grams per day.',
                chiefComplaint: "I thought this stuff was like coffee, but now if I try to stop, I feel awful. My whole body aches, I can't sleep, and I'm so irritable. It feels like the flu, but worse.",
                background: "A {age}-year-old librarian who initially used kratom for fibromyalgia. Now feels trapped by the need to dose every few hours to avoid withdrawal.",
                ageRange: [45, 55],
                typicalTraits: ['intellectualizer', 'reserved'],
            },
            {
                variantId: 'kratom-opioid-replacement',
                presentingProblem: 'Patient started using kratom to get off prescription opioids but has developed a new dependence. Seeking guidance on how to taper.',
                history: 'Was on oxycodone for a work injury. Used kratom to self-manage withdrawal and avoid going back to pills. Now uses kratom multiple times daily and can\'t stop.',
                chiefComplaint: "I traded one addiction for another, I guess. At least kratom is legal, but I'm spending a fortune on it and I still don't feel normal. I just want to be free of all of this.",
                background: "A {age}-year-old electrician who was proud of getting off prescription opioids on their own, but now realizes they're dependent on kratom.",
                ageRange: [35, 45],
                typicalTraits: ['defensive', 'pleaser'],
            },
        ],
    },
    {
        topic: 'Ketamine Misuse',
        category: 'Other Substances',
        variants: [
            {
                variantId: 'ketamine-club-scene',
                presentingProblem: 'Patient reports urinary tract issues and cognitive difficulties ("brain fog") after regular, heavy use of illicit ketamine.',
                history: 'Uses ketamine insufflated (snorted) every weekend with friends for its dissociative effects. Recently has been experiencing bladder pain and urgency.',
                chiefComplaint: "I've been having some weird bladder problems, and my memory feels shot lately. I read online it might be from the K. I'm worried I might have done some permanent damage.",
                background: "A {age}-year-old artist and nightlife enthusiast. Their social scene is heavily centered around clubbing and psychedelic/dissociative drug use.",
                ageRange: [23, 29],
                typicalTraits: ['talkative', 'intellectualizer'],
            },
            {
                variantId: 'ketamine-depression-self-treat',
                presentingProblem: 'Patient has been using illicit ketamine to self-treat depression after reading about ketamine therapy. Use has escalated beyond occasional to frequent.',
                history: 'Struggles with treatment-resistant depression. Couldn\'t afford legitimate ketamine therapy so started buying it illegally. Initially helpful, now using multiple times per week.',
                chiefComplaint: "It actually helped my depression at first, more than any antidepressant ever did. But now I'm using so much and the effects aren't the same. I feel stuck between depression and dependence.",
                background: "A {age}-year-old tech worker who has tried multiple antidepressants without success. Researched ketamine therapy but couldn't access or afford it legally.",
                ageRange: [28, 38],
                typicalTraits: ['intellectualizer', 'emotional'],
            },
        ],
    },
    {
        topic: 'Psilocybin (Mushroom) Misuse',
        category: 'Other Substances',
        variants: [
            {
                variantId: 'psilocybin-bad-trip',
                presentingProblem: 'Patient is concerned about recent experiences of heightened anxiety and "feeling disconnected" for days after using psilocybin mushrooms.',
                history: 'Began using mushrooms with friends for recreational and perceived spiritual reasons. Use has become more frequent and solitary. A recent "bad trip" has left them shaken.',
                chiefComplaint: "I thought mushrooms were supposed to be enlightening, but my last trip was terrifying. Ever since, my anxiety is through the roof and I feel weird, like I'm not really here.",
                background: "A {age}-year-old graduate student in philosophy. Was drawn to psychedelics for intellectual and spiritual exploration but is now facing unexpected psychological consequences.",
                ageRange: [22, 28],
                typicalTraits: ['intellectualizer', 'emotional'],
            },
            {
                variantId: 'psilocybin-microdosing',
                presentingProblem: 'Patient has been microdosing psilocybin for productivity and mood but has begun taking larger doses and is questioning where the line is.',
                history: 'Started microdosing after reading about benefits for creativity and focus. Gradually increased doses. Now taking noticeable doses several times a week.',
                chiefComplaint: "It started as microdosing for work, and it really helped. But lately I've been taking more because... I guess I want to feel something? I'm not sure if this is a problem or not.",
                background: "A {age}-year-old startup founder under enormous pressure to perform. Turned to microdosing as a 'biohack' but is now using mushrooms in ways they didn't intend.",
                ageRange: [28, 38],
                typicalTraits: ['intellectualizer', 'defensive'],
            },
        ],
    },
    {
        topic: 'Anabolic Steroid Use',
        category: 'Other Substances',
        variants: [
            {
                variantId: 'steroids-personal-trainer',
                presentingProblem: 'Patient presents with acne, mood swings (irritability and aggression), and concerning lab results (elevated liver enzymes) from a recent physical.',
                history: 'Started using testosterone and other anabolic steroids sourced from a "gym buddy" about a year ago to accelerate muscle gain. Is now on a regular cycle of injectables.',
                chiefComplaint: "My girlfriend says I'm always angry, and my doctor is freaking out about my liver. I've never felt stronger, though. Everyone at the gym is on something.",
                background: "A {age}-year-old personal trainer whose career and self-esteem are tied to their physical appearance. Feels intense pressure to maintain a hyper-masculine physique.",
                ageRange: [24, 30],
                typicalTraits: ['defensive', 'talkative'],
            },
            {
                variantId: 'steroids-body-dysmorphia',
                presentingProblem: "Patient's partner is concerned about their increasingly extreme behavior around exercise, diet, and steroid use.",
                history: 'Has struggled with body image since being bullied as a thin teenager. Started lifting weights obsessively, then added steroids. Can never feel "big enough" despite obvious muscle mass.',
                chiefComplaint: "I know I'm bigger than before, but when I look in the mirror, I still see that skinny kid who got picked on. The steroids help me feel more in control of my body.",
                background: "A {age}-year-old accountant who spends 3+ hours daily at the gym. Social life has narrowed to only gym-related activities and online bodybuilding forums.",
                ageRange: [26, 34],
                typicalTraits: ['emotional', 'reserved'],
            },
        ],
    },

    // ========== BEHAVIORAL ==========
    {
        topic: 'Compulsive Shopping',
        category: 'Behavioral',
        variants: [
            {
                variantId: 'shopping-online-isolation',
                presentingProblem: 'Compulsive online shopping leading to significant credit card debt. Patient is minimizing the issue, which is causing conflict with their partner.',
                history: 'Patient has accumulated significant credit card debt over the past two years from frequent online purchases. They often hide packages from their partner and feel a rush when buying things, followed by guilt.',
                chiefComplaint: "My partner is freaking out about our credit card bills. I don't think it's that bad, I just like to buy nice things. It's my money, why is it such a big deal?",
                background: "Married with one child. Works from home as an accountant and feels isolated. Manages household finances.",
                ageRange: [30, 45],
                typicalTraits: ['defensive', 'pleaser'],
            },
            {
                variantId: 'shopping-emotional-void',
                presentingProblem: "Patient is seeking help after a failed relationship, recognizing that shopping binges often follow emotional distress.",
                history: 'Uses shopping to cope with difficult emotions. After breakups or conflicts, goes on spending sprees that provide temporary relief followed by shame and more distress.',
                chiefComplaint: "Every time something bad happens, I end up at the mall or online with my credit card. I feel better for a moment but then I see the bills and feel even worse. It's a cycle I can't break.",
                background: "A {age}-year-old recently divorced professional. Shopping has become the primary way to fill the emotional void left by the failed marriage.",
                ageRange: [35, 48],
                typicalTraits: ['emotional', 'talkative'],
            },
        ],
    },
    {
        topic: 'Compulsive Sports Betting',
        category: 'Behavioral',
        variants: [
            {
                variantId: 'betting-family-ultimatum',
                presentingProblem: 'Patient is in significant debt from online sports betting. Their partner has discovered the extent of the debt and has given them an ultimatum to seek help.',
                history: 'Started with small, casual bets on games with friends. Escalated over the last year with the accessibility of mobile betting apps. Has chased losses, taken out loans, and maxed out credit cards.',
                chiefComplaint: "I messed up. I thought I had a system, that I could win it all back. Now my partner's threatening to leave. I have to do something, but I don't even know where to start.",
                conflictingChiefComplaint: "My partner and I are having some disagreements about our budget. I think we just need a better financial plan, it's more of a communication issue than anything else.",
                background: "A {age}-year-old car salesman who is highly competitive. Used to play college sports and now channels that energy into betting. Feels immense pressure to provide for his family.",
                ageRange: [35, 45],
                typicalTraits: ['defensive', 'talkative'],
            },
            {
                variantId: 'betting-crypto-gambler',
                presentingProblem: 'Patient has lost significant savings in cryptocurrency trading and sports betting, which they justified as "investing." Now facing financial ruin.',
                history: 'Started with crypto investments, then moved to sports betting for faster returns. Has been taking increasing risks, including using rent money to chase losses.',
                chiefComplaint: "I kept telling myself it was investing, not gambling. But I've lost everything. My rent is due and I have nothing. I feel like I can't stop even though I know I should.",
                background: "A {age}-year-old who works in tech and got caught up in the crypto boom. The line between investing and gambling blurred until the losses became catastrophic.",
                ageRange: [25, 35],
                typicalTraits: ['intellectualizer', 'defensive'],
            },
        ],
    },
    {
        topic: 'Excessive Online Gaming',
        category: 'Behavioral',
        variants: [
            {
                variantId: 'gaming-teen-withdrawal',
                presentingProblem: "Patient's parents are concerned about their social withdrawal, declining grades, and neglect of personal hygiene, all linked to near-constant online gaming.",
                history: 'Always enjoyed video games, but has become completely absorbed in a competitive online multiplayer game over the past year. Stays up all night playing, skips meals, and has lost touch with non-gaming friends.',
                chiefComplaint: "My parents are being dramatic. It's just a game. My online friends are my real friends anyway. School is boring. Why can't they just let me do what I enjoy?",
                background: "A {age}-year-old high school student who feels socially anxious and has found a sense of community and achievement online that they feel is lacking in their 'real' life.",
                ageRange: [15, 18],
                typicalTraits: ['defensive', 'reserved'],
            },
            {
                variantId: 'gaming-adult-escape',
                presentingProblem: "Patient's partner is threatening to leave due to excessive gaming. Patient is gaming 6-8 hours daily after work, neglecting relationship and responsibilities.",
                history: 'Gaming increased dramatically after a stressful job change. Now uses gaming as primary escape from work stress and relationship conflict, creating a vicious cycle.',
                chiefComplaint: "Gaming is the only time I feel relaxed. Work is hell, and honestly, coming home to someone nagging me about gaming just makes me want to game more. But I don't want to lose my partner either.",
                background: "A {age}-year-old software developer in a stressful job. Uses gaming to decompress but it has taken over their life and is threatening their relationship.",
                ageRange: [28, 38],
                typicalTraits: ['reserved', 'intellectualizer'],
            },
        ],
    },

    // ========== HEALTH BEHAVIORS ==========
    {
        topic: 'Poor Diet & Fast Food',
        category: 'Health',
        variants: [
            {
                variantId: 'diet-truck-driver',
                presentingProblem: 'Patient has pre-diabetes and their primary care doctor has strongly recommended dietary changes to avoid developing full-blown Type 2 Diabetes.',
                history: 'Relies heavily on fast food and processed meals due to a busy work schedule and lack of cooking skills. Drinks several sugary sodas per day.',
                chiefComplaint: "My doctor says I have to change how I eat, but with my job, I barely have time to breathe, let alone cook. A burger and fries is just easy. I know it's not good for me, but changing everything feels impossible.",
                background: "A {age}-year-old long-haul truck driver who eats most meals on the road. Struggles with healthy options and time constraints.",
                ageRange: [45, 55],
                typicalTraits: ['reserved', 'defensive'],
            },
            {
                variantId: 'diet-emotional-eating',
                presentingProblem: 'Patient has gained significant weight and is struggling with emotional eating, often consuming large quantities of comfort food when stressed or sad.',
                history: 'Food has always been a source of comfort since childhood. Weight has steadily increased over the years. Multiple failed diet attempts have left them feeling hopeless.',
                chiefComplaint: "I know I eat my feelings. When I'm stressed or sad, food is the only thing that makes me feel better. Diets never work for me. I always end up right back where I started, or worse.",
                background: "A {age}-year-old office worker who grew up in a household where food was love. Uses food to cope with difficult emotions and has struggled with weight their entire adult life.",
                ageRange: [32, 45],
                typicalTraits: ['emotional', 'pleaser'],
            },
        ],
    },
    {
        topic: 'Sedentary Lifestyle',
        category: 'Health',
        variants: [
            {
                variantId: 'sedentary-desk-job',
                presentingProblem: 'Patient reports chronic fatigue, weight gain, and general low mood. Their doctor suggested that increasing physical activity could help significantly.',
                history: 'Used to be active in school but has fallen into a sedentary routine with a desk job and long commute. Evenings are spent on the couch watching TV.',
                chiefComplaint: "I just feel tired all the time. I know I should exercise, but by the time I get home from work, I have zero energy. The idea of going to a gym is intimidating. I wouldn't even know what to do.",
                conflictingChiefComplaint: "I've been having this persistent lower back pain and was hoping to get it checked out. I think if I could just get rid of this pain, I'd have a lot more energy.",
                background: "A {age}-year-old IT support specialist who works long hours at a desk. Lives alone and lacks social support for engaging in physical activities.",
                ageRange: [35, 45],
                typicalTraits: ['reserved', 'intellectualizer'],
            },
            {
                variantId: 'sedentary-post-injury',
                presentingProblem: "Patient stopped exercising after an injury and has struggled to return to physical activity despite being cleared by doctors months ago.",
                history: 'Was moderately active before injuring their knee. The injury healed but fear of re-injury and lost fitness have prevented return to exercise.',
                chiefComplaint: "I used to enjoy walking and swimming, but after the injury, I got scared. Now I'm so out of shape that trying to exercise feels overwhelming. I don't know how to get back to where I was.",
                background: "A {age}-year-old retired teacher whose social activities used to revolve around fitness classes. Now isolated and deconditioned, missing the community and health benefits.",
                ageRange: [58, 68],
                typicalTraits: ['emotional', 'pleaser'],
            },
        ],
    },
    {
        topic: 'Medication Non-Adherence (Type 2 Diabetes)',
        category: 'Health',
        variants: [
            {
                variantId: 'diabetes-denial',
                presentingProblem: 'Patient with Type 2 Diabetes presents with consistently high A1c levels. They admit to frequently forgetting or skipping their oral diabetes medication.',
                history: 'Diagnosed two years ago. Was initially diligent but has become complacent. Finds the daily routine of medication and monitoring to be a frustrating reminder of their condition.',
                chiefComplaint: "I feel fine, so I don't see the big deal if I miss a pill here and there. Checking my blood sugar is a pain. I hate that I have to do all this stuff. I just want to forget I have diabetes.",
                conflictingChiefComplaint: "These diabetes pills have been giving me some unpleasant side effects, and I'm not even sure they're helping. I wanted to discuss if there are other medications we could try.",
                background: "A {age}-year-old retired office manager who feels their health is declining. Is frustrated by the chronic nature of their illness and sometimes feels hopeless about it.",
                ageRange: [62, 72],
                typicalTraits: ['defensive', 'reserved'],
            },
            {
                variantId: 'diabetes-cost-barriers',
                presentingProblem: 'Patient with diabetes is not taking medication consistently due to cost concerns, leading to poor blood sugar control.',
                history: 'Has been rationing insulin and skipping doses of other medications to make them last longer. Too embarrassed to discuss financial struggles with doctor.',
                chiefComplaint: "Do you know how much these medications cost? I'm on a fixed income. Sometimes I have to choose between groceries and insulin. I know it's dangerous but what am I supposed to do?",
                background: "A {age}-year-old on disability who struggles financially. Has been cutting corners on medication due to cost and is now facing worsening health complications.",
                ageRange: [55, 65],
                typicalTraits: ['emotional', 'reserved'],
            },
        ],
    },
];

// Legacy flat template format for backward compatibility
// This flattens all variants into individual templates
export const PATIENT_PROFILE_TEMPLATES = PATIENT_TOPIC_TEMPLATES.flatMap(topicTemplate =>
    topicTemplate.variants.map(variant => ({
        topic: topicTemplate.topic,
        category: topicTemplate.category,
        ...variant,
    }))
);


export const STAGE_DESCRIPTIONS: Record<StageOfChange, string> = {
    [StageOfChange.Precontemplation]: "Not currently considering change. Unaware or under-aware of their problems.",
    [StageOfChange.Contemplation]: "Ambivalent about change. Aware a problem exists but not committed to action.",
    [StageOfChange.Preparation]: "Getting ready to change. Intends to take action soon and may have a plan.",
    [StageOfChange.Action]: "Actively modifying behavior. Has made specific overt modifications in their lifestyle.",
    [StageOfChange.Maintenance]: "Sustaining new behavior. Working to prevent relapse into old habits.",
};

export const FREE_SESSION_DURATION = 90; // seconds
export const PREMIUM_SESSION_DURATION = 300; // seconds

