
import { type ProcessedContact } from "./csvProcessor";
import { mergeContactsByEmail } from "./contactMerger";
import { categorizeNewContacts } from "../helpers/newContactCategorization";
import { type MainBucketId } from "../bucketCategorizationService";
import { upsertContactBatch, upsertContactWithProperMerging } from "./batchOperations";
import { assignContactsToBucketChunked } from "./bucketAssignment";

export const uploadContactsInBatches = async (
  contactsByBucket: Record<MainBucketId, ProcessedContact[]>,
  onProgress: (progress: number) => void
): Promise<void> => {
  console.log('=== Starting uploadContactsInBatches ===');
  const allBuckets = Object.keys(contactsByBucket) as MainBucketId[];
  let totalProcessed = 0;
  const totalContacts = Object.values(contactsByBucket).reduce((sum, contacts) => sum + contacts.length, 0);
  
  console.log(`Total contacts to process: ${totalContacts}`);
  console.log('Contacts by bucket:', Object.keys(contactsByBucket).map(bucket => 
    `${bucket}: ${contactsByBucket[bucket as keyof typeof contactsByBucket].length}`
  ));

  // Phase 1: Upload and merge contacts (50-80% of progress)
  const uploadPhaseStart = 50;
  const uploadPhaseEnd = 80;
  const uploadPhaseRange = uploadPhaseEnd - uploadPhaseStart;

  for (const bucket of allBuckets) {
    const contacts = contactsByBucket[bucket];
    if (contacts.length === 0) {
      console.log(`Skipping empty bucket: ${bucket}`);
      continue;
    }

    console.log(`=== Processing ${contacts.length} contacts for ${bucket} bucket ===`);
    onProgress(uploadPhaseStart + Math.round((totalProcessed / totalContacts) * uploadPhaseRange));

    // Merge contacts by email, combining data from multiple entries
    console.log('Merging contacts by email...');
    const mergedContacts = mergeContactsByEmail(contacts);
    const contactsToUpload = Object.values(mergedContacts);
    console.log(`After merging: ${contactsToUpload.length} unique contacts`);

    // Use larger batches for faster processing
    const batchSize = 250;
    const uploadedEmails: string[] = [];

    console.log(`Starting batch upload with batch size: ${batchSize}`);
    for (let i = 0; i < contactsToUpload.length; i += batchSize) {
      const batch = contactsToUpload.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(contactsToUpload.length / batchSize);
      
      console.log(`Processing batch ${batchNumber} of ${totalBatches} (${batch.length} contacts)`);
      
      try {
        await upsertContactBatch(batch);
        uploadedEmails.push(...batch.map(c => c.email));
        totalProcessed += batch.length;

        // Update progress more frequently for better UX
        const currentProgress = uploadPhaseStart + Math.round((totalProcessed / totalContacts) * uploadPhaseRange);
        onProgress(Math.min(currentProgress, uploadPhaseEnd - 1)); // Never exceed phase end
        console.log(`Progress: ${currentProgress}% (${totalProcessed}/${totalContacts} contacts)`);
        
      } catch (error) {
        console.error(`Error upserting batch ${batchNumber}:`, error);
        // Try individual fallback for this batch
        console.log('Falling back to individual processing for this batch...');
        for (const contact of batch) {
          try {
            await upsertContactWithProperMerging(contact);
            uploadedEmails.push(contact.email);
            totalProcessed++;
          } catch (individualError) {
            console.error(`Error upserting contact ${contact.email}:`, individualError);
          }
        }
      }

      console.log(`Completed batch ${batchNumber}, total processed: ${totalProcessed}`);
    }

    // Assign contacts to their respective buckets with chunked approach
    console.log(`=== Assigning ${uploadedEmails.length} contacts to ${bucket} bucket ===`);
    try {
      await assignContactsToBucketChunked(uploadedEmails, bucket);
      console.log(`Successfully assigned ${uploadedEmails.length} contacts to ${bucket} bucket`);
    } catch (error) {
      console.error(`Error assigning contacts to ${bucket} bucket:`, error);
    }
  }

  // Phase 2: Categorization (80-100% of progress)
  console.log('=== Starting categorization phase ===');
  onProgress(85);
  
  try {
    const allUploadedEmails = Object.values(contactsByBucket)
      .flat()
      .map(contact => contact.email);
    
    console.log(`Starting categorization for ${allUploadedEmails.length} contacts`);
    
    // For large datasets, we'll do a simpler categorization approach
    if (allUploadedEmails.length > 50000) {
      console.log('Large dataset detected, using simplified categorization');
      onProgress(95);
      // Skip automatic categorization for very large datasets to prevent timeouts
      console.log('Skipping automatic categorization for large dataset to prevent timeout');
    } else {
      await categorizeNewContacts(allUploadedEmails);
      console.log('Categorization completed successfully');
    }
    
    onProgress(100);
  } catch (error) {
    console.error('Error during categorization:', error);
    console.log('Categorization failed, but upload was successful');
    onProgress(100); // Still complete the upload even if categorization fails
  }
  
  console.log('=== uploadContactsInBatches completed ===');
};
