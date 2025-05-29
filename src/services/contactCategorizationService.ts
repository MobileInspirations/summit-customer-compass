
import { runCategorizationWorkflow } from "./workflows/categorizationWorkflow";
import { categorizeNewContacts as categorizeNewContactsHelper } from "./helpers/newContactCategorization";

// Re-export the progress interface for backward compatibility
export type { CategorizationProgress } from "./utils/progressTracker";

// Main categorization function - now a thin wrapper around the workflow
export const categorizeContacts = runCategorizationWorkflow;

// Helper function to run categorization on newly uploaded contacts
export const categorizeNewContacts = categorizeNewContactsHelper;
