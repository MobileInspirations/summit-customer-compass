
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
        currentBatch: 1,
        totalBatches: 1,
        processedCount: 0,
        totalCount: 0
      });
    }
    return;
  }

  console.log(`Total uncategorized contacts to categorize: ${allContacts.length}`);

  // Process contacts with optimized batch sizes
  const batchSize = useAI ? 1000 : 5000; // AI: 1k, Regular: 5k
  const parallelSize = useAI ? 1 : 100; // No parallel for AI due to rate limits
  const totalBatches = Math.ceil(allContacts.length / batchSize);
  let processedCount = 0;

  // Initial progress update with actual numbers
  if (onProgress) {
    onProgress(createProgressUpdate(0, allContacts.length, 1, totalBatches));
  }

  for (let i = 0; i < allContacts.length; i += batchSize) {
    const batch = allContacts.slice(i, i + batchSize);
    const currentBatch = Math.floor(i / batchSize) + 1;
    
    console.log(`Processing batch ${currentBatch}/${totalBatches} with ${batch.length} contacts${useAI ? ' (using AI)' : ''}`);
    
    if (useAI) {
      // Process AI requests sequentially to respect rate limits
      for (let j = 0; j < batch.length; j++) {
        const contact = batch[j];
        try {
          await categorizeContactEnhanced(contact as ContactForCategorization, categories, useAI);
          processedCount++;
          
          // Update progress more frequently for AI (every 10 contacts)
          if (processedCount % 10 === 0 || j === batch.length - 1) {
            if (onProgress) {
              const progressUpdate = createProgressUpdate(processedCount, allContacts.length, currentBatch, totalBatches);
              console.log(`AI Progress update: ${progressUpdate.progress}% - Processed ${processedCount}/${allContacts.length} contacts`);
              onProgress(progressUpdate);
            }
          }
          
          // Minimal delay between AI requests
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (error) {
          console.error(`Error categorizing contact ${contact.email}:`, error);
          processedCount++; // Still count as processed to maintain progress
        }
      }
    } else {
      // Process in parallel sub-batches for non-AI categorization
      for (let j = 0; j < batch.length; j += parallelSize) {
        const parallelBatch = batch.slice(j, j + parallelSize);
        
        // Process this sub-batch in parallel
        const promises = parallelBatch.map(async (contact) => {
          try {
            await categorizeContactEnhanced(contact as ContactForCategorization, categories, useAI);
            return true;
          } catch (error) {
            console.error(`Error categorizing contact ${contact.email}:`, error);
            return true; // Still count as processed
          }
        });
        
        await Promise.all(promises);
        processedCount += parallelBatch.length;
        
        // Update progress frequently
        if (onProgress) {
          const progressUpdate = createProgressUpdate(processedCount, allContacts.length, currentBatch, totalBatches);
          console.log(`Progress update: ${progressUpdate.progress}% - Processed ${processedCount}/${allContacts.length} contacts`);
          onProgress(progressUpdate);
        }
      }
    }
    
    console.log(`Completed batch ${currentBatch}/${totalBatches}. Processed ${processedCount}/${allContacts.length} contacts`);
  }

  // Final progress update
  if (onProgress) {
    const finalProgress = createProgressUpdate(processedCount, allContacts.length, totalBatches, totalBatches);
    onProgress(finalProgress);
  }

  console.log(`Enhanced contact categorization completed. Processed ${processedCount} contacts total.`);
};
