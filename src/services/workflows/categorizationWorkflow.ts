
import { fetchUncategorizedContacts } from "../data/uncategorizedContactsService";
import { fetchCategories } from "../data/contactDataService";
import { categorizeContact } from "../categorization/contactProcessor";
import { ProgressTracker } from "../utils/progressTracker";
import { CancellationToken } from "../utils/cancellationToken";

export const runCategorizationWorkflow = async (
  contactIds?: string[],
  onProgress?: (progress: any) => void,
  cancellationToken?: CancellationToken,
  contactLimit?: number
): Promise<{ totalProcessed: number; processedContactIds: string[] }> => {
  console.log(`Starting categorization workflow with contact limit: ${contactLimit || 'no limit'}`);
  
  const progressTracker = new ProgressTracker(onProgress);
  
  try {
    // Fetch contacts and categories
    let contacts;
    if (contactIds && contactIds.length > 0) {
      // If specific contact IDs are provided, fetch all uncategorized and filter
      const allContacts = await fetchUncategorizedContacts();
      contacts = allContacts.filter(c => contactIds.includes(c.id));
      console.log(`Filtered to ${contacts.length} specific contacts from ${allContacts.length} total`);
    } else {
      // Apply the contact limit directly when fetching
      contacts = await fetchUncategorizedContacts(contactLimit);
      console.log(`Fetched ${contacts.length} contacts with limit: ${contactLimit || 'no limit'}`);
    }

    const categories = await fetchCategories();

    if (!contacts.length) {
      console.log('No contacts to categorize');
      return { totalProcessed: 0, processedContactIds: [] };
    }

    const totalContacts = contacts.length;
    console.log(`Processing ${totalContacts} contacts`);
    
    progressTracker.initialize(totalContacts);

    // Process contacts in batches for better performance
    const batchSize = 100;
    const totalBatches = Math.ceil(totalContacts / batchSize);
    let processedCount = 0;
    const processedContactIds: string[] = [];

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // Check for cancellation
      if (cancellationToken?.isCancelled) {
        console.log('Categorization cancelled by user');
        throw new Error('Operation was cancelled');
      }

      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalContacts);
      const batchContacts = contacts.slice(startIndex, endIndex);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches}: ${batchContacts.length} contacts`);

      // Process each contact in the batch
      for (const contact of batchContacts) {
        await categorizeContact(contact, categories);
        processedCount++;
        processedContactIds.push(contact.id);
      }
      
      progressTracker.updateProgress(processedCount, batchIndex + 1, totalBatches);
    }

    console.log(`Categorization workflow completed. Processed ${processedCount} contacts.`);
    return { totalProcessed: processedCount, processedContactIds };
    
  } catch (error) {
    console.error('Error in categorization workflow:', error);
    throw error;
  }
};
