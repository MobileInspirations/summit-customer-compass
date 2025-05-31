
import { runCategorizationWorkflow } from "./workflows/categorizationWorkflow";
import { runEnhancedCategorizationWorkflow } from "./workflows/enhancedCategorizationWorkflow";
import { categorizeNewContacts as categorizeNewContactsHelper } from "./helpers/newContactCategorization";
import { CancellationToken } from "./utils/cancellationToken";

// Re-export the progress interface for backward compatibility
export type { CategorizationProgress } from "./utils/progressTracker";
export { CancellationToken } from "./utils/cancellationToken";

// Main categorization function - now supports AI categorization, cancellation, and contact limits
export const categorizeContacts = async (
  contactIds?: string[],
  onProgress?: (progress: any) => void,
  useAI: boolean = false,
  openaiApiKey?: string,
  cancellationToken?: CancellationToken,
  contactLimit?: number
) => {
  if (useAI) {
    return runEnhancedCategorizationWorkflow(contactIds, useAI, openaiApiKey, onProgress, cancellationToken, contactLimit);
  } else {
    return runCategorizationWorkflow(contactIds, onProgress, cancellationToken, contactLimit);
  }
};

// Helper function to run categorization on newly uploaded contacts
export const categorizeNewContacts = categorizeNewContactsHelper;

// New function specifically for AI categorization
export const categorizeContactsWithAI = async (
  openaiApiKey: string,
  contactIds?: string[],
  onProgress?: (progress: any) => void,
  cancellationToken?: CancellationToken,
  contactLimit?: number
) => {
  return runEnhancedCategorizationWorkflow(contactIds, true, openaiApiKey, onProgress, cancellationToken, contactLimit);
};
