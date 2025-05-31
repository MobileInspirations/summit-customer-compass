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

// Helper function to generate categorization results based on processed contacts
const generateCategorizationResults = async (
  totalProcessed: number, 
  isAI: boolean,
  processedContactIds?: string[]
): Promise<CategorizationResults> => {
  console.log(`Generating results for ${totalProcessed} processed contacts, processedContactIds provided: ${!!processedContactIds}`);
  
  // If we have specific contact IDs that were processed, only count those
  // Otherwise, count all contacts (for backward compatibility)
  let categoryCountsQuery = supabase
    .from('customer_categories')
    .select(`
      id,
      name,
      category_type,
      contact_categories!inner(
        contact_id,
        contacts!inner(id)
      )
    `);

  // If we processed specific contacts, filter to only those
  if (processedContactIds && processedContactIds.length > 0) {
    console.log(`Filtering results to ${processedContactIds.length} processed contacts`);
    categoryCountsQuery = categoryCountsQuery
      .in('contact_categories.contacts.id', processedContactIds);
  }

  const { data: categories, error } = await categoryCountsQuery;

  if (error) {
    console.error('Error fetching categorization results:', error);
    throw error;
  }

  console.log(`Retrieved ${categories?.length || 0} category records`);

  // Count contacts per category
  const categoryCounts = new Map<string, { name: string, type: string, count: number }>();
  
  categories?.forEach(cat => {
    if (!categoryCounts.has(cat.id)) {
      categoryCounts.set(cat.id, {
        name: cat.name,
        type: cat.category_type,
        count: 0
      });
    }
    // Count unique contact_categories entries for this category
    categoryCounts.get(cat.id)!.count = cat.contact_categories?.length || 0;
  });

  console.log('Category counts:', Array.from(categoryCounts.entries()));

  const customerCategories = Array.from(categoryCounts.values())
    .filter(cat => cat.type === 'customer')
    .map(cat => ({
      categoryName: cat.name,
      count: cat.count,
      percentage: totalProcessed > 0 ? Math.round(cat.count / totalProcessed * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const personalityCategories = Array.from(categoryCounts.values())
    .filter(cat => cat.type === 'personality')
    .map(cat => ({
      categoryName: cat.name,
      count: cat.count,
      percentage: totalProcessed > 0 ? Math.round(cat.count / totalProcessed * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  console.log('Final results:', { totalProcessed, customerCategories, personalityCategories });

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
  console.log(`categorizeContacts called with contactLimit: ${contactLimit}, contactIds: ${contactIds?.length || 0}, useAI: ${useAI}`);
  
  let totalProcessed = 0;
  let processedContactIds: string[] | undefined;
  
  if (useAI) {
    const result = await runEnhancedCategorizationWorkflow(contactIds, useAI, openaiApiKey, onProgress, cancellationToken, contactLimit);
    totalProcessed = result.totalProcessed;
    processedContactIds = result.processedContactIds;
  } else {
    const result = await runCategorizationWorkflow(contactIds, onProgress, cancellationToken, contactLimit);
    totalProcessed = result.totalProcessed;
    processedContactIds = result.processedContactIds;
  }

  // Generate and return categorization results using only the processed contacts
  return generateCategorizationResults(totalProcessed, useAI, processedContactIds);
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
  console.log(`categorizeContactsWithAI called with contactLimit: ${contactLimit}, contactIds: ${contactIds?.length || 0}`);
  
  const result = await runEnhancedCategorizationWorkflow(contactIds, true, openaiApiKey, onProgress, cancellationToken, contactLimit);
  return generateCategorizationResults(result.totalProcessed, true, result.processedContactIds);
};
