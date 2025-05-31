
import type { ContactForRuleCategorization, MandatoryCategorizationResult } from "./categorization/types";
import { 
  MAIN_BUCKET_NAMES, 
  PERSONALITY_BUCKET_NAMES,
  MAIN_BUCKET_KEYWORDS,
  PERSONALITY_BUCKET_KEYWORDS,
  DEFAULT_MAIN_BUCKET,
  DEFAULT_PERSONALITY_BUCKET
} from "./categorization/bucketDefinitions";
import { assignToBestBucket } from "./categorization/bucketAssignmentLogic";

// Re-export types for backward compatibility
export type { ContactForRuleCategorization, MandatoryCategorizationResult };

// --- Main Categorization Function ---
export function categorizeContactMandatoryBuckets(
  contact: ContactForRuleCategorization
): MandatoryCategorizationResult {
  // Handle contacts with no tags
  if (!contact.tags || contact.tags.length === 0) {
    return {
      contactId: contact.id,
      mainBucket: MAIN_BUCKET_NAMES.CANNOT_PLACE,
      personalityBucket: PERSONALITY_BUCKET_NAMES.CANNOT_PLACE,
    };
  }

  const contactTagsLower = contact.tags.map(tag => tag.toLowerCase());

  // Define the actual lists of bucket names (excluding 'Cannot Place')
  const mainBucketNameList = Object.values(MAIN_BUCKET_NAMES).filter(name => name !== MAIN_BUCKET_NAMES.CANNOT_PLACE);
  const personalityBucketNameList = Object.values(PERSONALITY_BUCKET_NAMES).filter(name => name !== PERSONALITY_BUCKET_NAMES.CANNOT_PLACE);
  
  // Determine Main Bucket
  const assignedMainBucket = assignToBestBucket(
    contactTagsLower,
    MAIN_BUCKET_KEYWORDS,
    mainBucketNameList,
    DEFAULT_MAIN_BUCKET
  );

  // Determine Personality Bucket
  const assignedPersonalityBucket = assignToBestBucket(
    contactTagsLower,
    PERSONALITY_BUCKET_KEYWORDS,
    personalityBucketNameList,
    DEFAULT_PERSONALITY_BUCKET
  );

  return {
    contactId: contact.id,
    mainBucket: assignedMainBucket,
    personalityBucket: assignedPersonalityBucket,
  };
}
