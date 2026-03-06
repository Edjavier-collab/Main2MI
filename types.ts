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
  SkillProgression = 'skillProgression',
  PrintableReport = 'printableReport',
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

export interface BehavioralMetrics {
  reflectionToQuestionRatio: number;
  openQuestions: number;
  closedQuestions: number;
  simpleReflections: number;
  complexReflections: number;
  affirmations: number;
  miAdherentStatements: number;
  miInconsistentStatements: number;
}

export interface WhatWentWellItem {
  quote: string;
  skill: string;
  spiritConnection: string;
}

export interface GrowthOpportunityItem {
  quote: string;
  principle: string;
  alternativePhrasing: string;
}

export interface MissedOpportunityItem {
  patientSaid: string;
  opportunityType: string;
  coachingTip: string;
  exampleResponse: string;
}

export interface CoachingInsightItem {
  pattern: string;
  technique: string;
  rationale: string;
}

export interface Feedback {
  // V3 fields (clinical feedback)
  behavioralMetrics?: BehavioralMetrics;
  whatWentWell?: WhatWentWellItem[];
  growthOpportunities?: GrowthOpportunityItem[];
  missedOpportunities?: MissedOpportunityItem[];
  coachingInsights?: CoachingInsightItem[];
  focusForNextSession?: string;
  skillsDetected?: string[];
  skillCounts?: Record<string, number>;
  analysisStatus?: 'complete' | 'insufficient-data' | 'error';
  analysisMessage?: string;
  // Legacy fields (for reading old stored sessions)
  empathyScore?: number;
  whatWentRight?: string | any[];
  areasForGrowth?: string | any[];
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