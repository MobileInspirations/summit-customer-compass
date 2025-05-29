
import { categorizeContactEnhanced } from "../categorization/enhancedContactProcessor";
import { fetchCategories } from "../data/contactDataService";
import { fetchUncategorizedContacts } from "../data/uncategorizedContactsService";
import { ensureMainBucketsExist } from "../bucketCategorizationService";
import { ensurePersonalityBucketsExist, initializeOpenAI } from "../ai/openaiCategorizationService";
import { createProgressUpdate, createInitialProgress } from "../utils/progressTracker";
import type { ContactForCategorization } from "../types/contactTypes";
import type { CategorizationProgress } from "../utils/progressTracker";

export const runEnhancedCategorizationWorkflow = async (
  contactIds?: string[],
  useAI: boolean = false,
  openaiApiKey?: string,
  onProgress?: (progress: CategorizationProgress) => void
): Promise<void> => {
  console.log('Starting enhanced contact categorization workflow...');

  // Initialize OpenAI if using AI categorization
  if (useAI && openaiApiKey) {
    initializeOpenAI(openaiApiKey);
    console.log('OpenAI client initialized for AI categorization');
  }

  // Ensure main buckets exist (including "Cannot Place")
  await ensureMainBucketsExist();

  // Ensure personality type buckets exist if using AI
  if (useAI) {
    await ensurePersonalityBucketsExist();
  }

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
        currentBatch: 0,
        totalBatches: 0,
        processedCount: 0,
        totalCount: 0
      });
    }
    return;
  }

  console.log(`Total uncategorized contacts to categorize: ${allContacts.length}`);

  // Process contacts in larger batches - 5,000 for regular categorization, 1,000 for AI to respect rate limits
  const processingBatchSize = useAI ? 1000 : 5000;
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
    
    console.log(`Processing batch ${currentBatch}/${totalBatches} with ${batch.length} contacts${useAI ? ' (using AI)' : ''}`);
    
    if (useAI) {
      // Process AI requests sequentially to respect rate limits
      for (const contact of batch) {
        await categorizeContactEnhanced(contact as ContactForCategorization, categories, useAI);
        processedCount++;
        
        // Add delay between AI requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else {
      // Process in parallel for non-AI categorization
      const categorizationPromises = batch.map(contact => 
        categorizeContactEnhanced(contact as ContactForCategorization, categories, useAI)
      );
      await Promise.all(categorizationPromises);
      processedCount += batch.length;
    }
    
    console.log(`Processed ${processedCount}/${allContacts.length} contacts`);

    // Update progress after each batch with a small delay
    if (onProgress) {
      const progressUpdate = createProgressUpdate(processedCount, allContacts.length, currentBatch, totalBatches);
      console.log(`Updating progress: ${progressUpdate.progress}% - Batch ${currentBatch}/${totalBatches}`);
      
      onProgress(progressUpdate);
    }

    // Delay to allow UI updates and prevent overwhelming the UI
    await new Promise(resolve => setTimeout(resolve, useAI ? 500 : 200));
  }

  console.log(`Enhanced contact categorization completed. Processed ${processedCount} contacts total.`);
};
