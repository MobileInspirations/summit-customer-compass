
/**
 * Utility functions for handling contact tags and summit history
 */

export const deduplicateTags = (tags: string[] | null | undefined, summitHistory: string[] | null | undefined): string[] => {
  const existingTags = tags || [];
  const summitHistoryTags = summitHistory || [];
  
  // Create a Set to remove duplicates, then convert back to array
  return [...new Set([...existingTags, ...summitHistoryTags])];
};

export const normalizeTagsForCategorization = (tags: string[] | null | undefined): string[] | null => {
  if (!tags || tags.length === 0) {
    return null;
  }
  
  // Remove duplicates and normalize
  return [...new Set(tags)];
};
