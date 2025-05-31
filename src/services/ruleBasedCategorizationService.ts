
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
  // Handle contacts with no tags - assign to default bucket instead of "Cannot Place"
  if (!contact.tags || contact.tags.length === 0) {
    return {
      contactId: contact.id,
      mainBucket: DEFAULT_MAIN_BUCKET, // Use default instead of "Cannot Place"
      personalityBucket: DEFAULT_PERSONALITY_BUCKET,
    };
  }

  const contactTagsLower = contact.tags.map(tag => tag.toLowerCase());

  // Define the actual lists of bucket names (excluding 'Cannot Place' entirely)
  const mainBucketNameList = [
    MAIN_BUCKET_NAMES.BUSINESS_OPERATIONS,
    MAIN_BUCKET_NAMES.HEALTH,
    MAIN_BUCKET_NAMES.SURVIVALIST
  ];
  const personalityBucketNameList = Object.values(PERSONALITY_BUCKET_NAMES).filter(name => name !== PERSONALITY_BUCKET_NAMES.CANNOT_PLACE);
  
  // Determine Main Bucket - never assign to "Cannot Place"
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
