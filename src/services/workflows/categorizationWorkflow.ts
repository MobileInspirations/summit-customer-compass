import { categorizeContact } from "../categorization/contactProcessor";
import { fetchCategories } from "../data/contactDataService";
import { fetchUncategorizedContacts } from "../data/uncategorizedContactsService";
import { ensureMainBucketsExist } from "../bucketCategorizationService";
import { createProgressUpdate, createInitialProgress } from "../utils/progressTracker";
import type { ContactForCategorization } from "../types/contactTypes";
import type { CategorizationProgress } from "../utils/progressTracker";
import { CancellationToken } from "../utils/cancellationToken";

export const runCategorizationWorkflow = async (
  contactIds?: string[],
  onProgress?: (progress: CategorizationProgress) => void,
  cancellationToken?: CancellationToken
): Promise<void> => {
  console.log('Starting contact categorization workflow...');

  try {
    // Check for cancellation at the start
    cancellationToken?.throwIfCancelled();

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
    console.log('Fetching uncategorized contacts...');
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

    // Optimized processing - larger batches with higher parallelism
    const batchSize = 2000; // Larger batches for better throughput
    const parallelSize = 200; // Higher parallel processing
    const totalBatches = Math.ceil(allContacts.length / batchSize);
    let processedCount = 0;

    // Initial progress update with actual numbers
    if (onProgress) {
      onProgress(createProgressUpdate(0, allContacts.length, 1, totalBatches));
    }

    for (let i = 0; i < allContacts.length; i += batchSize) {
      // Check for cancellation before each batch
      cancellationToken?.throwIfCancelled();

      const batch = allContacts.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      console.log(`Processing batch ${currentBatch}/${totalBatches} with ${batch.length} contacts`);
      
      // Process contacts in parallel sub-batches for much faster processing
      for (let j = 0; j < batch.length; j += parallelSize) {
        // Check for cancellation before each sub-batch
        cancellationToken?.throwIfCancelled();

        const parallelBatch = batch.slice(j, j + parallelSize);
        
        // Process this sub-batch in parallel
        const promises = parallelBatch.map(async (contact) => {
          try {
            // Check for cancellation before processing each contact
            cancellationToken?.throwIfCancelled();

            await categorizeContact(contact as ContactForCategorization, categories);
            return true;
          } catch (error) {
            if (error instanceof Error && error.message === 'Operation was cancelled') {
              throw error; // Re-throw cancellation errors
            }
            console.error(`Error categorizing contact ${contact.email}:`, error);
            return true; // Still count as processed
          }
        });
        
        await Promise.all(promises);
        processedCount += parallelBatch.length;
        
        // Update progress frequently for better UX
        if (onProgress) {
          const progressUpdate = createProgressUpdate(processedCount, allContacts.length, currentBatch, totalBatches);
          console.log(`Progress update: ${progressUpdate.progress}% - Processed ${processedCount}/${allContacts.length} contacts`);
          onProgress(progressUpdate);
        }
      }
      
      console.log(`Completed batch ${currentBatch}/${totalBatches}. Processed ${processedCount}/${allContacts.length} contacts`);
    }

    // Final progress update
    if (onProgress) {
      const finalProgress = createProgressUpdate(processedCount, allContacts.length, totalBatches, totalBatches);
      onProgress(finalProgress);
    }

    console.log(`Contact categorization completed. Processed ${processedCount} contacts total.`);
  } catch (error) {
    if (error instanceof Error && error.message === 'Operation was cancelled') {
      console.log('=== Categorization was cancelled by user ===');
      throw error;
    }
    console.error('=== ERROR in categorization workflow ===', error);
    throw error;
  }
};
