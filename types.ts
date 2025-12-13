// FIX: Removed self-import of `StageOfChange` which was causing a circular dependency
// and conflicting declarations. The enum is defined within this file.

export enum UserTier {
  Free = 'free',
  Premium = 'premium',
}

export enum View {
  Login = 'login',
  ForgotPassword = 'forgotPassword',
  ResetPassword = 'resetPassword',
  EmailConfirmation = 'emailConfirmation',
  Dashboard = 'dashboard',
  Practice = 'practice',
  Feedback = 'feedback',
  History = 'history',
  ResourceLibrary = 'resourceLibrary',
  Paywall = 'paywall',
  Settings = 'settings',
  ScenarioSelection = 'scenarioSelection',
  Calendar = 'calendar',
  CoachingSummary = 'coachingSummary',
  Reports = 'reports',
  PrivacyPolicy = 'privacyPolicy',
  TermsOfService = 'termsOfService',
  SubscriptionTerms = 'subscriptionTerms',
  CookiePolicy = 'cookiePolicy',
  Disclaimer = 'disclaimer',
  Support = 'support',
  CancelSubscription = 'cancelSubscription',
}

export enum StageOfChange {
  Precontemplation = 'Precontemplation',
  Contemplation = 'Contemplation',
  Preparation = 'Preparation',
  Action = 'Action',
  Maintenance = 'Maintenance',
}

export enum DifficultyLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

// Personality traits that affect patient behavior and add complexity
export type PersonalityTrait = 
  | 'defensive'
  | 'emotional'
  | 'reserved'
  | 'talkative'
  | 'intellectualizer'
  | 'pleaser';

export interface PatientProfile {
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Non-binary';
  background: string;
  presentingProblem: string;
  topic: string;
  history: string;
  chiefComplaint: string;
  stageOfChange: StageOfChange;
  personalityTrait?: PersonalityTrait; // Affects patient behavior (e.g., defensive, emotional)
  variantId?: string; // Tracks which backstory variant was used
}

export interface PatientProfileFilters {
  topic?: string;
  stageOfChange?: StageOfChange;
  difficulty?: DifficultyLevel;
}

export interface ChatMessage {
    author: 'user' | 'patient';
    text: string;
}

export interface Feedback {
    whatWentRight: string; // Stays for free tier compatibility and as a premium summary
    keyTakeaway?: string;
    empathyScore: number; // Always generated (1-5)
    empathyBreakdown?: string; // Explanation of why that score
    constructiveFeedback?: string; // Formerly areasForGrowth (kept for backward compatibility)
    areasForGrowth?: string; // Specific suggestions for growth
    keySkillsUsed?: string[]; // Changed from string to string[] (kept for backward compatibility)
    skillsDetected?: string[]; // Array of skill names that were used
    skillCounts?: Record<string, number>; // Object with count per skill, e.g., {"Reflections": 4, "Open Questions": 2}
    nextPracticeFocus?: string; // Kept for backward compatibility
    nextFocus?: string; // Next practice recommendation
    analysisStatus?: 'complete' | 'insufficient-data';
    analysisMessage?: string;
}

export interface Session {
    id: string;
    date: string;
    patient: PatientProfile;
    transcript: ChatMessage[];
    feedback: Feedback;
    tier: UserTier;
}

export interface CoachingSummary {
    totalSessions: number;
    dateRange: string;
    strengthsAndTrends: string;
    areasForFocus: string;
    summaryAndNextSteps: string;
    skillProgression?: Array<{
        skillName: string;
        totalCount: number;
        averagePerSession: number;
        trend: 'increasing' | 'stable' | 'decreasing';
    }>;
    topSkillsToImprove?: string[];
    specificNextSteps?: string[];
}

export interface SubscriptionDetails {
    customerId: string;
    subscriptionId: string;
    plan: 'monthly' | 'annual' | 'unknown';
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    currentPrice: number;
    originalPrice: number;
    discountPercent: number;
    hasRetentionDiscount: boolean;
}