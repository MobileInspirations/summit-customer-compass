
import { fetchUncategorizedContacts } from "../data/uncategorizedContactsService";
import { fetchCategories } from "../data/contactDataService";
import { categorizeContactEnhanced } from "../categorization/enhancedContactProcessor";
import { ProgressTracker } from "../utils/progressTracker";
import { CancellationToken } from "../utils/cancellationToken";

export const runEnhancedCategorizationWorkflow = async (
  contactIds?: string[],
  useAI: boolean = false,
  openaiApiKey?: string,
  onProgress?: (progress: any) => void,
  cancellationToken?: CancellationToken,
  contactLimit?: number
): Promise<{ totalProcessed: number; processedContactIds: string[] }> => {
  console.log(`Starting enhanced categorization workflow with AI: ${useAI}, contact limit: ${contactLimit || 'no limit'}`);
  
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
    console.log(`Processing ${totalContacts} contacts with AI: ${useAI}`);
    
    progressTracker.initialize(totalContacts);

    // Process contacts individually for AI categorization (slower but more accurate)
    let processedCount = 0;
    const totalBatches = totalContacts; // Each contact is its own "batch" for AI
    const processedContactIds: string[] = [];

    for (let i = 0; i < totalContacts; i++) {
      // Check for cancellation
      if (cancellationToken?.isCancelled) {
        console.log('Enhanced categorization cancelled by user');
        throw new Error('Operation was cancelled');
      }

      const contact = contacts[i];
      console.log(`Processing contact ${i + 1}/${totalContacts}: ${contact.email}`);

      await categorizeContactEnhanced(contact, categories, useAI);
      
      processedCount++;
      processedContactIds.push(contact.id);
      progressTracker.updateProgress(processedCount, i + 1, totalBatches);
    }

    console.log(`Enhanced categorization workflow completed. Processed ${processedCount} contacts.`);
    return { totalProcessed: processedCount, processedContactIds };
    
  } catch (error) {
    console.error('Error in enhanced categorization workflow:', error);
    throw error;
  }
};
