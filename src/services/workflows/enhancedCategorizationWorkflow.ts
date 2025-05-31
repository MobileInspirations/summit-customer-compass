
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
  console.log('=== Starting enhanced contact categorization workflow ===');
  console.log('Parameters:', { contactIds: contactIds?.length || 'all', useAI, hasApiKey: !!openaiApiKey });

  try {
    // Initialize OpenAI if using AI categorization
    if (useAI && openaiApiKey) {
      console.log('Initializing OpenAI for AI categorization...');
      initializeOpenAI(openaiApiKey);
      console.log('OpenAI client initialized for AI categorization');
    } else if (useAI && !openaiApiKey) {
      throw new Error('AI categorization requested but no API key provided');
    }

    // Ensure main buckets exist (including "Cannot Place")
    console.log('Ensuring main buckets exist...');
    await ensureMainBucketsExist();

    // Ensure personality type buckets exist if using AI
    if (useAI) {
      console.log('Ensuring personality buckets exist...');
      await ensurePersonalityBucketsExist();
    }

    // Get all categories
    console.log('Fetching categories...');
    const categories = await fetchCategories();
    console.log(`Found ${categories.length} categories`);

    // Show initial loading state
    if (onProgress) {
      onProgress(createInitialProgress());
    }

    // Get contacts that haven't been categorized yet
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

    // Use smaller batches for AI to prevent getting stuck
    const batchSize = useAI ? 25 : 500; // Smaller AI batches
    const parallelSize = useAI ? 3 : 50; // Lower parallel processing for AI
    const totalBatches = Math.ceil(allContacts.length / batchSize);
    let processedCount = 0;

    console.log(`Processing with batch size: ${batchSize}, parallel size: ${parallelSize}`);

    // Initial progress update with actual numbers
    if (onProgress) {
      onProgress(createProgressUpdate(0, allContacts.length, 1, totalBatches));
    }

    for (let i = 0; i < allContacts.length; i += batchSize) {
      const batch = allContacts.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      console.log(`=== Processing batch ${currentBatch}/${totalBatches} with ${batch.length} contacts${useAI ? ' (using AI)' : ''} ===`);
      
      // Process in parallel sub-batches
      for (let j = 0; j < batch.length; j += parallelSize) {
        const parallelBatch = batch.slice(j, j + parallelSize);
        
        console.log(`Processing parallel batch: ${j + 1}-${j + parallelBatch.length} of ${batch.length}`);
        
        // Process this sub-batch in parallel
        const promises = parallelBatch.map(async (contact, index) => {
          try {
            console.log(`Processing contact ${j + index + 1}/${batch.length}: ${contact.email}`);
            await categorizeContactEnhanced(contact as ContactForCategorization, categories, useAI);
            console.log(`Successfully categorized: ${contact.email}`);
            return true;
          } catch (error) {
            console.error(`Error categorizing contact ${contact.email}:`, error);
            return true; // Still count as processed to avoid infinite loops
          }
        });
        
        await Promise.all(promises);
        processedCount += parallelBatch.length;
        
        // Update progress more frequently for better UX
        if (onProgress) {
          const progressUpdate = createProgressUpdate(processedCount, allContacts.length, currentBatch, totalBatches);
          console.log(`Progress update: ${progressUpdate.progress}% - Processed ${processedCount}/${allContacts.length} contacts`);
          onProgress(progressUpdate);
        }
        
        // Add delay for AI to respect rate limits and prevent getting stuck
        if (useAI) {
          console.log('Waiting 200ms before next AI batch...');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`Completed batch ${currentBatch}/${totalBatches}. Total processed: ${processedCount}/${allContacts.length} contacts`);
    }

    // Final progress update
    if (onProgress) {
      const finalProgress = createProgressUpdate(processedCount, allContacts.length, totalBatches, totalBatches);
      onProgress(finalProgress);
    }

    console.log(`=== Enhanced contact categorization completed. Processed ${processedCount} contacts total. ===`);
  } catch (error) {
    console.error('=== ERROR in enhanced categorization workflow ===', error);
    throw error;
  }
};
