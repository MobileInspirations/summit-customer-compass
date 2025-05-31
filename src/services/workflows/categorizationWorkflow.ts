
import { fetchUncategorizedContacts } from "../data/uncategorizedContactsService";
import { fetchCategories } from "../data/contactDataService";
import { categorizeContactBatch } from "../categorization/contactProcessor";
import { ProgressTracker } from "../utils/progressTracker";
import { CancellationToken } from "../utils/cancellationToken";
import { errorLogger, timeOperation } from "../utils/errorLogger";

export const runCategorizationWorkflow = async (
  contactIds?: string[],
  onProgress?: (progress: any) => void,
  cancellationToken?: CancellationToken,
  contactLimit?: number,
  fastMode?: boolean // New parameter for faster processing
): Promise<number> => {
  console.log('Starting categorization workflow...');
  
  const progressTracker = new ProgressTracker(onProgress);
  
  try {
    // Fetch contacts and categories with timing
    const [contacts, categories] = await timeOperation(
      'fetch-data',
      async () => Promise.all([
        contactIds ? 
          fetchUncategorizedContacts().then(all => all.filter(c => contactIds.includes(c.id))) :
          fetchUncategorizedContacts(contactLimit),
        fetchCategories()
      ]),
      { contactIds: contactIds?.length, contactLimit }
    );

    if (!contacts.length) {
      console.log('No contacts to categorize');
      return 0;
    }

    const totalContacts = contacts.length;
    console.log(`Found ${totalContacts} contacts to categorize`);
    
    progressTracker.initialize(totalContacts);

    // Use larger batch sizes for faster processing when in fast mode
    const batchSize = fastMode ? 200 : 50; // Much larger batches for uploads
    const totalBatches = Math.ceil(totalContacts / batchSize);
    let processedCount = 0;

    console.log(`Processing ${totalContacts} contacts in ${totalBatches} batches of ${batchSize}`);

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

      await timeOperation(
        `categorize-batch-${i + 1}`,
        () => categorizeContactBatch(batch, categories),
        { batchSize: batch.length, batchIndex: i + 1 }
      );
      
      processedCount += batch.length;
      progressTracker.updateProgress(processedCount, i + 1, totalBatches);

      // Reduce delay between batches in fast mode
      if (!fastMode && i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay only in normal mode
      }
    }

    console.log(`Categorization workflow completed. Processed ${processedCount} contacts.`);
    return processedCount;
    
  } catch (error) {
    errorLogger.log('categorization-workflow', error as Error, { contactIds: contactIds?.length, contactLimit });
    console.error('Error in categorization workflow:', error);
    throw error;
  }
};
