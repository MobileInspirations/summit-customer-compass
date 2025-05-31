
import { fetchUncategorizedContacts } from "../data/uncategorizedContactsService";
import { fetchCategories } from "../data/contactDataService";
import { categorizeContactBatch } from "../categorization/contactProcessor";
import { ProgressTracker } from "../utils/progressTracker";
import { CancellationToken } from "../utils/cancellationToken";

export const runCategorizationWorkflow = async (
  contactIds?: string[],
  onProgress?: (progress: any) => void,
  cancellationToken?: CancellationToken,
  contactLimit?: number
): Promise<number> => {
  console.log('Starting categorization workflow...');
  
  const progressTracker = new ProgressTracker(onProgress);
  
  try {
    // Fetch contacts and categories
    const [contacts, categories] = await Promise.all([
      contactIds ? 
        fetchUncategorizedContacts().then(all => all.filter(c => contactIds.includes(c.id))) :
        fetchUncategorizedContacts(contactLimit),
      fetchCategories()
    ]);

    if (!contacts.length) {
      console.log('No contacts to categorize');
      return 0;
    }

    const totalContacts = contacts.length;
    console.log(`Found ${totalContacts} contacts to categorize`);
    
    progressTracker.initialize(totalContacts);

    // Process contacts in batches
    const batchSize = 50;
    const totalBatches = Math.ceil(totalContacts / batchSize);
    let processedCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      // Check for cancellation
      if (cancellationToken?.isCancelled) {
        console.log('Categorization cancelled by user');
        throw new Error('Operation was cancelled');
      }

      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, totalContacts);
      const batch = contacts.slice(startIdx, endIdx);

      console.log(`Processing batch ${i + 1}/${totalBatches} (${batch.length} contacts)`);

      await categorizeContactBatch(batch, categories);
      
      processedCount += batch.length;
      progressTracker.updateProgress(processedCount, i + 1, totalBatches);
    }

    console.log(`Categorization workflow completed. Processed ${processedCount} contacts.`);
    return processedCount;
    
  } catch (error) {
    console.error('Error in categorization workflow:', error);
    throw error;
  }
};
