
import { supabase } from "@/integrations/supabase/client";

export type MainBucketId = 'biz-op' | 'health' | 'survivalist';

export interface MainBucket {
  id: MainBucketId;
  name: string;
  description: string;
}

export const MAIN_BUCKETS: Record<MainBucketId, MainBucket> = {
  'biz-op': {
    id: 'biz-op',
    name: 'Business Operations',
    description: 'Business and entrepreneurship focused contacts'
  },
  'health': {
    id: 'health',
    name: 'Health',
    description: 'Health and wellness focused contacts'
  },
  'survivalist': {
    id: 'survivalist',
    name: 'Survivalist',
    description: 'Survivalist and preparedness focused contacts'
  }
};

// Summit mapping based on the provided structure
export const SUMMIT_MAPPING = {
  // Biz Summits
  'AI Mastery': 'biz-op',
  'Copywriting Summit': 'biz-op',
  'EPIK SUMMIT': 'biz-op',
  'FUTURE OF CRYPTO': 'biz-op',
  'GOLD SUMMIT': 'biz-op',
  'Health Coaching Summit': 'biz-op',
  'Leadership Summit': 'biz-op',
  'Privacy Summit': 'biz-op',
  'Publicity Summit': 'biz-op',
  'Summit talks': 'biz-op',

  // Health Summits
  '360 Health': 'health',
  '7 Figure Chiropractor': 'health',
  'Autoimmune Supertools': 'health',
  'Beyond The Cancer': 'health',
  'Biohacker LIVE': 'health',
  'Brain Regeneration Summit': 'health',
  'Breathwork Blueprint': 'health',
  'Caregiver Conference': 'health',
  'EMF Hazards': 'health',
  'ENERGY BLUEPRINT': 'health',
  'GOT MOLD': 'health',
  'Green Plant Summit': 'health',
  'GUT HEALTH SUMMIT': 'health',
  'Happy Vagine': 'health',
  'Healthy Aging Summit': 'health',
  'Healthy Vibrant Women': 'health',
  'Holistic Sleep Summit': 'health',
  'Inspired Mom': 'health',
  'Keto Summit': 'health',
  'Kids Brain Summit': 'health',
  'Metaphysically Fit': 'health',
  'Optimal Performance Summit': 'health',
  'Pain Solution Summit': 'health',
  'Pandemic Recovery': 'health',
  'Reverse Autoimmune Disease Summit': 'health',
  'Science of Slimming Summit': 'health',
  'Self-love Summit': 'health',
  'Speakerfest': 'health',
  'Thrive State': 'health',
  'Trauma Recovery Summit': 'health',
  'Women\'s Balance Summit': 'health',
  'Yoga Summit': 'health',

  // Survivalist Summit
  'Common Sense (Survivalist)': 'survivalist'
} as const;

export const ensureMainBucketsExist = async (): Promise<void> => {
  // Since main buckets are now stored directly in the contacts table,
  // we don't need to create separate bucket records
  console.log('Main buckets are now handled as contact column values');
};
