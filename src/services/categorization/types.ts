
// Define the structure for a contact's tags for this specific categorization
export interface ContactForRuleCategorization {
  id: string;
  tags: string[] | null | undefined; // Expecting an array of tag strings
}

// Define the structure for the categorization result
export interface MandatoryCategorizationResult {
  contactId: string;
  mainBucket: string;
  personalityBucket: string;
}
