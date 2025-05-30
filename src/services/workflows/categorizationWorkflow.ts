
import { categorizeContact } from "../categorization/contactProcessor";
import { fetchCategories } from "../data/contactDataService";
import { fetchUncategorizedContacts } from "../data/uncategorizedContactsService";
import { ensureMainBucketsExist } from "../bucketCategorizationService";
import { createProgressUpdate, createInitialProgress } from "../utils/progressTracker";
import type { ContactForCategorization } from "../types/contactTypes";
import type { CategorizationProgress } from "../utils/progressTracker";

export const runCategorizationWorkflow = async (
  contactIds?: string[],
  onProgress?: (progress: CategorizationProgress) => void
): Promise<void> => {
  console.log('Starting contact categorization workflow...');

  // Ensure main buckets exist (including "Cannot Place")
  await ensureMainBucketsExist();

  // Get all categories
  const categories = await fetchCategories();
  console.log(`Found ${categories.length} categories`);

  // Show initial loading state
  if (onProgress) {
    onProgress(createInitialProgress());
  }

  // Get ALL contacts that haven't been categorized yet (no limit)
  const allContacts = await fetchUncategorizedContacts(contactIds);

  if (allContacts.length === 0) {
    console.log('No uncategorized contacts to process');
    if (onProgress) {
      onProgress({
        progress: 100,
        currentBatch: 1,
        totalBatches: 1,
        processedCount: 0,
        totalCount: 0
      });
    }
    return;
  }

  console.log(`Total uncategorized contacts to categorize: ${allContacts.length}`);

  // Process contacts in larger batches with parallel processing
  const processingBatchSize = 10000; // Increased to 10k
  const parallelBatchSize = 100; // Process 100 contacts in parallel within each batch
  const totalBatches = Math.ceil(allContacts.length / processingBatchSize);
  let processedCount = 0;

  // Initial progress update with actual numbers
  if (onProgress) {
    onProgress(createProgressUpdate(0, allContacts.length, 1, totalBatches));
  }

  for (let i = 0; i < allContacts.length; i += processingBatchSize) {
    const batch = allContacts.slice(i, i + processingBatchSize);
    const currentBatch = Math.floor(i / processingBatchSize) + 1;
    
    console.log(`Processing batch ${currentBatch}/${totalBatches} with ${batch.length} contacts`);
    
    // Process contacts in parallel sub-batches for much faster processing
    for (let j = 0; j < batch.length; j += parallelBatchSize) {
      const parallelBatch = batch.slice(j, j + parallelBatchSize);
      
      // Process this sub-batch in parallel
      const promises = parallelBatch.map(async (contact) => {
        try {
          await categorizeContact(contact as ContactForCategorization, categories);
          return true;
        } catch (error) {
          console.error(`Error categorizing contact ${contact.email}:`, error);
          return true; // Still count as processed
        }
      });
      
      await Promise.all(promises);
      processedCount += parallelBatch.length;
      
      // Update progress more frequently
      if (onProgress) {
        const progressUpdate = createProgressUpdate(processedCount, allContacts.length, currentBatch, totalBatches);
        console.log(`Progress update: ${progressUpdate.progress}% - Processed ${processedCount}/${allContacts.length} contacts`);
        onProgress(progressUpdate);
      }
      
      // Minimal delay to allow UI updates - reduced significantly
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    console.log(`Completed batch ${currentBatch}/${totalBatches}. Processed ${processedCount}/${allContacts.length} contacts`);
  }

  // Final progress update
  if (onProgress) {
    const finalProgress = createProgressUpdate(processedCount, allContacts.length, totalBatches, totalBatches);
    onProgress(finalProgress);
  }

  console.log(`Contact categorization completed. Processed ${processedCount} contacts total.`);
};
