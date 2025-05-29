
import { runCategorizationWorkflow } from "./workflows/categorizationWorkflow";
import { runEnhancedCategorizationWorkflow } from "./workflows/enhancedCategorizationWorkflow";
import { categorizeNewContacts as categorizeNewContactsHelper } from "./helpers/newContactCategorization";

// Re-export the progress interface for backward compatibility
export type { CategorizationProgress } from "./utils/progressTracker";

// Main categorization function - now supports AI categorization
export const categorizeContacts = async (
  contactIds?: string[],
  onProgress?: (progress: any) => void,
  useAI: boolean = false,
  openaiApiKey?: string
) => {
  if (useAI && openaiApiKey) {
    return runEnhancedCategorizationWorkflow(contactIds, useAI, openaiApiKey, onProgress);
  } else {
    return runCategorizationWorkflow(contactIds, onProgress);
  }
};

// Helper function to run categorization on newly uploaded contacts
export const categorizeNewContacts = categorizeNewContactsHelper;

// New function specifically for AI categorization
export const categorizeContactsWithAI = async (
  openaiApiKey: string,
  contactIds?: string[],
  onProgress?: (progress: any) => void
) => {
  return runEnhancedCategorizationWorkflow(contactIds, true, openaiApiKey, onProgress);
};
