
import { type ProcessedContact } from "./csvProcessor";
import { mergeContactsByEmail } from "./contactMerger";
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

  // Upload and assign to buckets (50-100% of progress)
  const uploadPhaseStart = 50;
  const uploadPhaseEnd = 100;
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
        onProgress(Math.min(currentProgress, uploadPhaseEnd - 5)); // Leave room for bucket assignment
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

  onProgress(100);
  console.log('=== uploadContactsInBatches completed ===');
  console.log('Note: No automatic categorization performed - contacts only assigned to main buckets based on folder structure');
};

export const uploadContactsToSelectedBucket = async (
  allContacts: ProcessedContact[],
  selectedBucket: MainBucketId,
  onProgress: (progress: number) => void
): Promise<void> => {
  console.log('=== Starting uploadContactsToSelectedBucket ===');
  console.log(`Uploading ${allContacts.length} contacts to ${selectedBucket} bucket`);

  if (allContacts.length === 0) {
    console.log('No contacts to upload');
    onProgress(100);
    return;
  }

  // Merge contacts by email, combining data from multiple entries
  console.log('Merging contacts by email...');
  const mergedContacts = mergeContactsByEmail(allContacts);
  const contactsToUpload = Object.values(mergedContacts);
  console.log(`After merging: ${contactsToUpload.length} unique contacts`);

  onProgress(50);

  // Use larger batches for faster processing
  const batchSize = 250;
  const uploadedEmails: string[] = [];
  const totalContacts = contactsToUpload.length;
  let processedContacts = 0;

  console.log(`Starting batch upload with batch size: ${batchSize}`);
  for (let i = 0; i < contactsToUpload.length; i += batchSize) {
    const batch = contactsToUpload.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(contactsToUpload.length / batchSize);
    
    console.log(`Processing batch ${batchNumber} of ${totalBatches} (${batch.length} contacts)`);
    
    try {
      await upsertContactBatch(batch);
      uploadedEmails.push(...batch.map(c => c.email));
      processedContacts += batch.length;

      // Update progress (50-90% for upload)
      const uploadProgress = 50 + Math.round((processedContacts / totalContacts) * 40);
      onProgress(Math.min(uploadProgress, 90));
      console.log(`Upload progress: ${uploadProgress}% (${processedContacts}/${totalContacts} contacts)`);
      
    } catch (error) {
      console.error(`Error upserting batch ${batchNumber}:`, error);
      // Try individual fallback for this batch
      console.log('Falling back to individual processing for this batch...');
      for (const contact of batch) {
        try {
          await upsertContactWithProperMerging(contact);
          uploadedEmails.push(contact.email);
          processedContacts++;
        } catch (individualError) {
          console.error(`Error upserting contact ${contact.email}:`, individualError);
        }
      }
    }

    console.log(`Completed batch ${batchNumber}, total processed: ${processedContacts}`);
  }

  onProgress(90);

  // Assign all contacts to the selected bucket
  console.log(`=== Assigning ${uploadedEmails.length} contacts to ${selectedBucket} bucket ===`);
  try {
    await assignContactsToBucketChunked(uploadedEmails, selectedBucket);
    console.log(`Successfully assigned ${uploadedEmails.length} contacts to ${selectedBucket} bucket`);
  } catch (error) {
    console.error(`Error assigning contacts to ${selectedBucket} bucket:`, error);
  }

  onProgress(100);
  console.log('=== uploadContactsToSelectedBucket completed ===');
  console.log(`All contacts have been uploaded and assigned to ${selectedBucket} bucket`);
};
