
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
    onProgress(createProgressUpdate(0, allContacts.length, 1, totalBatches));
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
      const progressUpdate = createProgressUpdate(processedCount, allContacts.length, currentBatch, totalBatches);
      console.log(`Updating progress: ${progressUpdate.progress}% - Batch ${currentBatch}/${totalBatches}`);
      
      onProgress(progressUpdate);
    }

    // Delay to allow UI updates and prevent overwhelming the UI
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`Contact categorization completed. Processed ${processedCount} contacts total.`);
};
