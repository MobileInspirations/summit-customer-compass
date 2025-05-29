
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

  // Process contacts in batches of 5,000 to improve performance
  const processingBatchSize = 5000;
  const totalBatches = Math.ceil(allContacts.length / processingBatchSize);
  let processedCount = 0;

  // Initial progress update with actual numbers
  if (onProgress) {
    onProgress(createProgressUpdate(0, allContacts.length, 1, totalBatches));
  }

  // Small delay to ensure the initial progress is shown
  await new Promise(resolve => setTimeout(resolve, 100));

  for (let i = 0; i < allContacts.length; i += processingBatchSize) {
    const batch = allContacts.slice(i, i + processingBatchSize);
    const currentBatch = Math.floor(i / processingBatchSize) + 1;
    
    console.log(`Processing batch ${currentBatch}/${totalBatches} with ${batch.length} contacts`);
    
    // Process each contact individually to track progress better
    for (let j = 0; j < batch.length; j++) {
      const contact = batch[j];
      try {
        await categorizeContact(contact as ContactForCategorization, categories);
        processedCount++;
        
        // Update progress more frequently (every 100 contacts or end of batch)
        if (processedCount % 100 === 0 || j === batch.length - 1) {
          if (onProgress) {
            const progressUpdate = createProgressUpdate(processedCount, allContacts.length, currentBatch, totalBatches);
            console.log(`Progress update: ${progressUpdate.progress}% - Processed ${processedCount}/${allContacts.length} contacts`);
            onProgress(progressUpdate);
          }
          // Small delay to allow UI updates
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error(`Error categorizing contact ${contact.email}:`, error);
        processedCount++; // Still count as processed to maintain progress
      }
    }
    
    console.log(`Completed batch ${currentBatch}/${totalBatches}. Processed ${processedCount}/${allContacts.length} contacts`);

    // Delay between batches to prevent overwhelming the system
    if (currentBatch < totalBatches) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Final progress update
  if (onProgress) {
    const finalProgress = createProgressUpdate(processedCount, allContacts.length, totalBatches, totalBatches);
    onProgress(finalProgress);
  }

  console.log(`Contact categorization completed. Processed ${processedCount} contacts total.`);
};
