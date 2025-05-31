
import { runCategorizationWorkflow } from "./workflows/categorizationWorkflow";
import { runEnhancedCategorizationWorkflow } from "./workflows/enhancedCategorizationWorkflow";
import { categorizeNewContacts as categorizeNewContactsHelper } from "./helpers/newContactCategorization";
import { CancellationToken } from "./utils/cancellationToken";
import { supabase } from "@/integrations/supabase/client";

// Re-export the progress interface for backward compatibility
export type { CategorizationProgress } from "./utils/progressTracker";
export { CancellationToken } from "./utils/cancellationToken";

export interface CategorizationResults {
  totalProcessed: number;
  customerCategories: Array<{
    categoryName: string;
    count: number;
    percentage: number;
  }>;
  personalityCategories: Array<{
    categoryName: string;
    count: number;
    percentage: number;
  }>;
  isAI: boolean;
}

// Helper function to generate categorization results
const generateCategorizationResults = async (totalProcessed: number, isAI: boolean): Promise<CategorizationResults> => {
  // Fetch all categories with their counts
  const { data: categories, error } = await supabase
    .from('customer_categories')
    .select(`
      id,
      name,
      category_type,
      contact_categories(count)
    `);

  if (error) {
    console.error('Error fetching categorization results:', error);
    throw error;
  }

  const customerCategories = categories
    ?.filter(cat => cat.category_type === 'customer')
    ?.map(cat => ({
      categoryName: cat.name,
      count: cat.contact_categories?.length || 0,
      percentage: totalProcessed > 0 ? Math.round((cat.contact_categories?.length || 0) / totalProcessed * 100) : 0
    }))
    ?.sort((a, b) => b.count - a.count) || [];

  const personalityCategories = categories
    ?.filter(cat => cat.category_type === 'personality')
    ?.map(cat => ({
      categoryName: cat.name,
      count: cat.contact_categories?.length || 0,
      percentage: totalProcessed > 0 ? Math.round((cat.contact_categories?.length || 0) / totalProcessed * 100) : 0
    }))
    ?.sort((a, b) => b.count - a.count) || [];

  return {
    totalProcessed,
    customerCategories,
    personalityCategories,
    isAI
  };
};

// Main categorization function - now supports AI categorization, cancellation, and contact limits
export const categorizeContacts = async (
  contactIds?: string[],
  onProgress?: (progress: any) => void,
  useAI: boolean = false,
  openaiApiKey?: string,
  cancellationToken?: CancellationToken,
  contactLimit?: number
): Promise<CategorizationResults> => {
  let totalProcessed = 0;
  
  if (useAI) {
    totalProcessed = await runEnhancedCategorizationWorkflow(contactIds, useAI, openaiApiKey, onProgress, cancellationToken, contactLimit);
  } else {
    totalProcessed = await runCategorizationWorkflow(contactIds, onProgress, cancellationToken, contactLimit);
  }

  // Generate and return categorization results
  return generateCategorizationResults(totalProcessed, useAI);
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
): Promise<CategorizationResults> => {
  const totalProcessed = await runEnhancedCategorizationWorkflow(contactIds, true, openaiApiKey, onProgress, cancellationToken, contactLimit);
  return generateCategorizationResults(totalProcessed, true);
};
