
import { fetchAllContacts, getContactsCount, clearExistingCategorizations, fetchCategories } from "./data/contactDataService";
import { categorizeContact } from "./categorization/contactProcessor";
import type { ContactForCategorization } from "./types/contactTypes";
import { supabase } from "@/integrations/supabase/client";

export interface CategorizationProgress {
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

export const categorizeContacts = async (
  contactIds?: string[], 
  onProgress?: (progress: CategorizationProgress) => void
): Promise<void> => {
  console.log('Starting contact categorization...');

  // Get all categories
  const categories = await fetchCategories();
  console.log(`Found ${categories.length} categories`);

  // Get total contact count first
  const totalContacts = await getContactsCount();
  console.log(`Total contacts in database: ${totalContacts}`);

  // Get contacts to categorize
  const allContacts = await fetchAllContacts(contactIds);

  if (allContacts.length === 0) {
    console.log('No contacts to categorize');
    return;
  }

  console.log(`Total contacts to categorize: ${allContacts.length}`);

  // Clear existing categorizations if we're doing a full categorization
  if (!contactIds || contactIds.length === 0) {
    await clearExistingCategorizations();
  }

  // Process contacts in smaller batches to avoid overwhelming the database
  const processingBatchSize = 50;
  const totalBatches = Math.ceil(allContacts.length / processingBatchSize);
  let processedCount = 0;

  for (let i = 0; i < allContacts.length; i += processingBatchSize) {
    const batch = allContacts.slice(i, i + processingBatchSize);
    const currentBatch = Math.floor(i / processingBatchSize) + 1;
    
    // Update progress
    if (onProgress) {
      onProgress({
        progress: (processedCount / allContacts.length) * 100,
        currentBatch,
        totalBatches,
        processedCount,
        totalCount: allContacts.length
      });
    }
    
    const categorizationPromises = batch.map(contact => 
      categorizeContact(contact as ContactForCategorization, categories)
    );

    await Promise.all(categorizationPromises);
    processedCount += batch.length;
    
    console.log(`Processed ${processedCount}/${allContacts.length} contacts`);

    // Final progress update
    if (onProgress) {
      onProgress({
        progress: (processedCount / allContacts.length) * 100,
        currentBatch,
        totalBatches,
        processedCount,
        totalCount: allContacts.length
      });
    }
  }

  console.log(`Contact categorization completed. Processed ${processedCount} contacts total.`);
};

// Helper function to run categorization on newly uploaded contacts
export const categorizeNewContacts = async (contactEmails: string[]): Promise<void> => {
  if (!contactEmails || contactEmails.length === 0) return;

  console.log(`Getting contact IDs for ${contactEmails.length} emails...`);
  
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id')
    .in('email', contactEmails);

  if (error) {
    console.error('Error fetching contact IDs:', error);
    throw error;
  }

  if (contacts && contacts.length > 0) {
    const contactIds = contacts.map(c => c.id);
    await categorizeContacts(contactIds);
  }
};
