import { PatientProfile, StageOfChange, PatientProfileFilters, DifficultyLevel, PersonalityTrait } from '../types';
import { PATIENT_DATA, PATIENT_TOPIC_TEMPLATES, PERSONALITY_TRAITS, PatientTopicTemplate, PatientTemplateVariant } from '../constants';

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Shuffle array using Fisher-Yates algorithm for better randomization
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Track recently used names to avoid repeats
const RECENT_NAMES_KEY = 'mi-coach-recent-patient-names';
const RECENT_NAMES_MAX = 7; // Track last 7 sessions

// Track recently used variants per topic to avoid repetition
const RECENT_VARIANTS_KEY = 'mi-coach-recent-variants';
const RECENT_VARIANTS_MAX = 10; // Track last 10 variants across all topics

const getRecentNames = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_NAMES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addRecentName = (name: string): void => {
  try {
    const recent = getRecentNames();
    recent.push(name);
    // Keep only the most recent N names
    if (recent.length > RECENT_NAMES_MAX) {
      recent.shift(); // Remove oldest
    }
    localStorage.setItem(RECENT_NAMES_KEY, JSON.stringify(recent));
  } catch {
    // Ignore localStorage errors
  }
};

const selectNameAvoidingRecent = (allNames: string[]): string => {
  const recent = getRecentNames();
  const available = allNames.filter(name => !recent.includes(name));
  
  // If all names have been used recently, reset and use any name
  if (available.length === 0) {
    console.log('[patientService] All names used recently, resetting recent names');
    localStorage.removeItem(RECENT_NAMES_KEY);
    return getRandomElement(allNames);
  }
  
  return getRandomElement(available);
};

// Track recently used variants to avoid showing the same backstory
const getRecentVariants = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_VARIANTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addRecentVariant = (variantId: string): void => {
  try {
    const recent = getRecentVariants();
    recent.push(variantId);
    // Keep only the most recent N variants
    if (recent.length > RECENT_VARIANTS_MAX) {
      recent.shift(); // Remove oldest
    }
    localStorage.setItem(RECENT_VARIANTS_KEY, JSON.stringify(recent));
  } catch {
    // Ignore localStorage errors
  }
};

const selectVariantAvoidingRecent = (variants: PatientTemplateVariant[]): PatientTemplateVariant => {
  const recent = getRecentVariants();
  const available = variants.filter(v => !recent.includes(v.variantId));
  
  // If all variants have been used recently, use the shuffled full list
  if (available.length === 0) {
    console.log('[patientService] All variants used recently, selecting from full list');
    return getRandomElement(shuffleArray(variants));
  }
  
  return getRandomElement(shuffleArray(available));
};

// Select personality trait - prefer variant's suggested traits but with some randomization
const selectPersonalityTrait = (variant: PatientTemplateVariant): PersonalityTrait => {
  // If variant has suggested traits, use one of them 70% of the time
  if (variant.typicalTraits && variant.typicalTraits.length > 0) {
    if (Math.random() < 0.7) {
      return getRandomElement(variant.typicalTraits);
    }
  }
  // Otherwise, pick a random trait
  return getRandomElement(PERSONALITY_TRAITS).id;
};

export const generatePatientProfile = (filters?: PatientProfileFilters): PatientProfile => {
  // 1. Find available topic templates based on filters
  let availableTopicTemplates: PatientTopicTemplate[] = PATIENT_TOPIC_TEMPLATES;

  if (filters?.topic) {
    // Filter to specific topic
    availableTopicTemplates = PATIENT_TOPIC_TEMPLATES.filter(t => t.topic === filters.topic);
    // Fallback if no templates match (should not happen with good UI)
    if (availableTopicTemplates.length === 0) {
      availableTopicTemplates = PATIENT_TOPIC_TEMPLATES;
    }
  }

  // 2. Select a topic template (shuffle for randomization)
  const shuffledTopics = shuffleArray(availableTopicTemplates);
  const topicTemplate = getRandomElement(shuffledTopics);

  // 3. Select a variant from the topic, avoiding recently used ones
  const variant = selectVariantAvoidingRecent(topicTemplate.variants);
  addRecentVariant(variant.variantId);

  // 4. Generate an age within the variant's specified range
  const [minAge, maxAge] = variant.ageRange;
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;

  // Replace the age placeholder in the background text
  const background = variant.background.replace('{age}', age.toString());
  
  // 5. Decide whether to use a conflicting chief complaint (50% chance)
  let chiefComplaint = variant.chiefComplaint;
  if (variant.conflictingChiefComplaint && Math.random() < 0.5) {
    chiefComplaint = variant.conflictingChiefComplaint;
  }
  
  // 6. Determine stage of change based on filters
  let stageOfChange: StageOfChange;

  if (filters?.stageOfChange) {
      // A specific stage selection takes highest priority
      stageOfChange = filters.stageOfChange;
  } else if (filters?.difficulty) {
      // If no stage is chosen, use difficulty to determine the pool of stages
      let possibleStages: StageOfChange[];
      switch (filters.difficulty) {
          case DifficultyLevel.Beginner:
              possibleStages = [StageOfChange.Preparation, StageOfChange.Action, StageOfChange.Maintenance];
              break;
          case DifficultyLevel.Intermediate:
              possibleStages = [StageOfChange.Contemplation];
              break;
          case DifficultyLevel.Advanced:
              possibleStages = [StageOfChange.Precontemplation];
              break;
          default:
              possibleStages = PATIENT_DATA.stagesOfChange as StageOfChange[];
      }
      stageOfChange = getRandomElement(possibleStages);
  } else {
      // If no filters are provided, select a random stage
      stageOfChange = getRandomElement(PATIENT_DATA.stagesOfChange) as StageOfChange;
  }

  // 7. Select personality trait (prefers variant's suggested traits)
  const personalityTrait = selectPersonalityTrait(variant);

  // 8. Select name avoiding recently used ones
  const selectedName = selectNameAvoidingRecent(PATIENT_DATA.names);
  addRecentName(selectedName);

  return {
    // Core details from the variant
    topic: topicTemplate.topic,
    presentingProblem: variant.presentingProblem,
    history: variant.history,
    chiefComplaint: chiefComplaint,
    background: background,

    // Randomized demographic details
    name: selectedName,
    age: age,
    sex: getRandomElement(PATIENT_DATA.sexes),
    stageOfChange: stageOfChange,
    
    // New fields for variety
    personalityTrait: personalityTrait,
    variantId: variant.variantId,
  };
};