
// --- Bucket Definitions and Keywords ---

// 1. Main Buckets
export const MAIN_BUCKET_NAMES = {
  BIZ_OPS: 'Business Operations',
  HEALTH: 'Health',
  SURVIVALIST: 'Survivalist',
  CANNOT_PLACE: 'Cannot Place', // Only for contacts with NO tags
} as const;

export type MainBucketName = typeof MAIN_BUCKET_NAMES[keyof typeof MAIN_BUCKET_NAMES];

export const MAIN_BUCKET_KEYWORDS: Record<Exclude<MainBucketName, 'Cannot Place'>, string[]> = {
  [MAIN_BUCKET_NAMES.BIZ_OPS]: [
    'leadership summit', '2020 leadership', '2019 leadership', 'ai mastery', 
    'copywriting summit', 'internet business formula', 'speakerfest', 'affiliate', 'jv',
    'kbs', 'mms summit', 'hero summit', 'nonfiction secrets', 'publicity summit', 
    'systems and marketing', 'growth hacking', 'webinar workshop', 'online privacy', 
    'prs summit', 'advertiser', 'business formula', 'coachingfest', 'client', 'ceo', 
    'founder', 'customer', 'sm 3.0 member', 'lead generation', 'attendee', 'registrant', 
    'registration', 'masterclass', // General business/event terms
    'six figure masterclass', 'business affiliates'
  ],
  [MAIN_BUCKET_NAMES.HEALTH]: [
    'health', 'wellness', 'medical', 'nutrition', 'fitness', 'thyroid', 'slimming', 
    'diet', 'keto', 'essential oils', 'eo summit', 'doterra', 'long covid', 'emf', 
    'hss attendee', 'common sense reg', 'ops registration', 'trauma recovery', 
    'holistic sleep', 'got mold', 'dog summit', 'breathwork', 'yoga', 'kids brain', 
    'chiro', 'blood sugar', 'energy blueprint', 'ptsd', 'save my thyroid', 'doctor',
    'clinic', 'healing', 'therapy', 'mental health', 'emotional well-being', 'emfhbm',
    'slimming registration', 'slim down conference', 'emf masterclass'
  ],
  [MAIN_BUCKET_NAMES.SURVIVALIST]: [
    'survival', 'preparedness', 'emergency', 'prepper', 'self-reliance', 'homesteading', 
    'tactical', 'bug out', 'water system', 'seed', 'patriot', 'food4patriots', 
    'off-grid', 'survival medical system', 'shtf', 'bunker', 'first aid', 'self-defense',
    'survival summit', 'survivalist'
  ],
};

// 2. Personality Type Buckets
export const PERSONALITY_BUCKET_NAMES = {
  DIGITAL_MARKETING: 'Digital Marketing & Content Creation Skills',
  ENTREPRENEURSHIP: 'Entrepreneurship & Business Development',
  FITNESS_NUTRITION: 'Fitness, Nutrition & Weight Management',
  HOLISTIC_WELLNESS: 'Holistic Wellness & Natural Living',
  INVESTING_FINANCE: 'Investing, Finance & Wealth Creation',
  LONGEVITY_REGENERATIVE: 'Longevity & Regenerative Health',
  MENTAL_EMOTIONAL_WELLBEING: 'Mental & Emotional Well-being',
  SELF_RELIANCE_PREPAREDNESS: 'Self-Reliance & Preparedness',
  TARGETED_HEALTH_SOLUTIONS: 'Targeted Health Solutions & Disease Management',
  WOMENS_HEALTH_COMMUNITY: "Women's Health & Community",
  CANNOT_PLACE: 'Cannot Place', // Only for contacts with NO tags
} as const;

export type PersonalityBucketName = typeof PERSONALITY_BUCKET_NAMES[keyof typeof PERSONALITY_BUCKET_NAMES];

export const PERSONALITY_BUCKET_KEYWORDS: Record<Exclude<PersonalityBucketName, 'Cannot Place'>, string[]> = {
  [PERSONALITY_BUCKET_NAMES.DIGITAL_MARKETING]: [
    'copywriting summit', 'internet business formula', 'nonfiction secrets', 
    'publicity summit', 'webinar workshop', 'online privacy', 'digital marketing', 
    'content creation', 'seo', 'social media', 'advertising', 'email marketing', 
    'funnels', 'audience', 'branding', 'analytics', 'growth hacking'
  ],
  [PERSONALITY_BUCKET_NAMES.ENTREPRENEURSHIP]: [
    'leadership summit', 'kbs', 'ai mastery', 'six figure masterclass', 'affiliate fest', 
    'speakerfest', 'coachingfest', 'mms summit', 'hero summit', 'sm 3.0 member', 
    'entrepreneur', 'business development', 'startup', 'business growth', 'sales', 
    'founder', 'ceo', 'networking', 'customer acquisition', 'scaling', 
    'systems and marketing', 'business affiliates'
  ],
  [PERSONALITY_BUCKET_NAMES.FITNESS_NUTRITION]: [
    'fitness', 'nutrition', 'weight management', 'slimming registration', 'diet', 
    'exercise', 'keto', 'sports', 'training', 'healthy eating', 'fat loss', 
    'bodybuilding', 'slim down conference'
  ],
  [PERSONALITY_BUCKET_NAMES.HOLISTIC_WELLNESS]: [
    'hss attendee', 'emfhmb registration', 'emf masterclass', 'trauma recovery', 
    'essential oils', 'eo summit', 'holistic sleep', 'breathwork summit', 
    'yoga summit', 'doterra', 'energy blueprint', 'holistic wellness', 'natural living', 
    'organic', 'mindfulness', 'meditation', 'herbalism', 'detox', 'cleanse',
    'got mold'
  ],
  [PERSONALITY_BUCKET_NAMES.INVESTING_FINANCE]: [
    'investing', 'finance', 'wealth creation', 'crypto', 'bitcoin', 'stocks', 'forex', 
    'real estate', 'financial planning', 'tax lien', 'money', 'trading', 'assets', 
    'passive income', 'budgeting', 'future of crypto'
  ],
  [PERSONALITY_BUCKET_NAMES.LONGEVITY_REGENERATIVE]: [
    'longevity', 'regenerative health', 'anti-aging', 'biohacking', 'healthspan', 
    'stem cells', 'genetics', 'long covid masterclass'
  ],
  [PERSONALITY_BUCKET_NAMES.MENTAL_EMOTIONAL_WELLBEING]: [
    'mental health', 'emotional well-being', 'stress management', 'psychology', 
    'therapy', 'trauma recovery', 'mindset', 'anxiety', 'depression', 'counseling', 
    'self-care', 'resilience', 'ptsd masterclass', 'holistic sleep'
  ],
  [PERSONALITY_BUCKET_NAMES.SELF_RELIANCE_PREPAREDNESS]: [
    'self-reliance', 'preparedness', 'survival', 'homesteading', 'emergency planning', 
    'off-grid living', 'prepper', 'shtf', 'bunker', 'food storage', 'water filtration', 
    'first aid', 'self-defense', 'tactical gear', 'survival medical system', 
    'survivalist', 'survival summit',
    'emfhbm'
  ],
  [PERSONALITY_BUCKET_NAMES.TARGETED_HEALTH_SOLUTIONS]: [
    'thyroid', 'save my thyroid', 'long covid', 'diabetes', 'cancer', 'autoimmune', 
    'brain health', 'kids brain reg', 'gut health', 'heart disease', 'pain management', 
    'chronic illness', 'disease management', 'medical treatment', 'doctor', 'clinic', 
    'ops registration',
    'hss attendee',
    'dog summit'
  ],
  [PERSONALITY_BUCKET_NAMES.WOMENS_HEALTH_COMMUNITY]: [
    'women health', 'motherhood', 'pregnancy', 'female health', 'hormone balance women', 
    'menopause', 'fertility', 'goddess', 'she means business'
  ],
};

// --- Default Buckets for contacts WITH tags but NO keyword matches ---
export const DEFAULT_MAIN_BUCKET: Exclude<MainBucketName, 'Cannot Place'> = MAIN_BUCKET_NAMES.BIZ_OPS;
export const DEFAULT_PERSONALITY_BUCKET: Exclude<PersonalityBucketName, 'Cannot Place'> = PERSONALITY_BUCKET_NAMES.ENTREPRENEURSHIP;
