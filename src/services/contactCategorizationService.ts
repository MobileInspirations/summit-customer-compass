
import { fetchAllContacts, getContactsCount, clearExistingCategorizations, fetchCategories } from "./data/contactDataService";
import { categorizeContact } from "./categorization/contactProcessor";
import { ensureMainBucketsExist } from "./bucketCategorizationService";
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

  // Ensure main buckets exist (including "Cannot Place")
  await ensureMainBucketsExist();

  // Get all categories
  const categories = await fetchCategories();
  console.log(`Found ${categories.length} categories`);

  // Show initial loading state
  if (onProgress) {
    onProgress({
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      processedCount: 0,
      totalCount: 0
    });
  }

  // Get contacts that haven't been categorized yet (limit to 5000)
  const allContacts = await fetchUncategorizedContacts(contactIds, 5000);

  if (allContacts.length === 0) {
    console.log('No uncategorized contacts to process');
    if (onProgress) {
      onProgress({
        progress: 100,
        currentBatch: 0,
        totalBatches: 0,
        processedCount: 0,
        totalCount: 0
      });
    }
    return;
  }

  console.log(`Total uncategorized contacts to categorize: ${allContacts.length}`);

  // Process contacts in smaller batches to avoid overwhelming the database
  const processingBatchSize = 50;
  const totalBatches = Math.ceil(allContacts.length / processingBatchSize);
  let processedCount = 0;

  // Initial progress update with actual numbers
  if (onProgress) {
    onProgress({
      progress: 0,
      currentBatch: 1,
      totalBatches,
      processedCount: 0,
      totalCount: allContacts.length
    });
  }

  // Small delay to ensure the initial progress is shown
  await new Promise(resolve => setTimeout(resolve, 200));

  for (let i = 0; i < allContacts.length; i += processingBatchSize) {
    const batch = allContacts.slice(i, i + processingBatchSize);
    const currentBatch = Math.floor(i / processingBatchSize) + 1;
    
    console.log(`Processing batch ${currentBatch}/${totalBatches} with ${batch.length} contacts`);
    
    const categorizationPromises = batch.map(contact => 
      categorizeContact(contact as ContactForCategorization, categories)
    );

    await Promise.all(categorizationPromises);
    processedCount += batch.length;
    
    console.log(`Processed ${processedCount}/${allContacts.length} contacts`);

    // Update progress after each batch with a small delay
    if (onProgress) {
      const progress = Math.round((processedCount / allContacts.length) * 100);
      console.log(`Updating progress: ${progress}% - Batch ${currentBatch}/${totalBatches}`);
      
      onProgress({
        progress,
        currentBatch,
        totalBatches,
        processedCount,
        totalCount: allContacts.length
      });
    }

    // Delay to allow UI updates and prevent overwhelming the UI
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`Contact categorization completed. Processed ${processedCount} contacts total.`);
};

// Improved function to fetch only uncategorized contacts using a more efficient query
const fetchUncategorizedContacts = async (contactIds?: string[], limit: number = 5000) => {
  console.log(`Fetching uncategorized contacts with limit: ${limit}`);
  
  // If specific contact IDs are provided, filter by them
  if (contactIds && contactIds.length > 0) {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id, 
        email, 
        full_name, 
        company, 
        summit_history
      `)
      .in('id', contactIds)
      .limit(limit);

    if (error) {
      console.error('Error fetching specific contacts:', error);
      throw error;
    }

    console.log(`Found ${contacts?.length || 0} specific contacts`);
    return contacts || [];
  }

  // Use a LEFT JOIN approach to find uncategorized contacts more efficiently
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select(`
      id, 
      email, 
      full_name, 
      company, 
      summit_history,
      contact_categories!left (contact_id)
    `)
    .is('contact_categories.contact_id', null)
    .limit(limit);

  if (error) {
    console.error('Error fetching uncategorized contacts:', error);
    throw error;
  }

  // Transform the data to remove the join column
  const uncategorizedContacts = contacts?.map(contact => ({
    id: contact.id,
    email: contact.email,
    full_name: contact.full_name,
    company: contact.company,
    summit_history: contact.summit_history
  })) || [];

  console.log(`Fetched ${uncategorizedContacts.length} uncategorized contacts (limit was ${limit})`);
  return uncategorizedContacts;
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
