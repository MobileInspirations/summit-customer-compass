
import { type ProcessedContact } from "./csvProcessor";
import { mergeContactsByEmail } from "./contactMerger";
import { type MainBucketId } from "../bucketCategorizationService";
import { upsertContactBatch, upsertContactWithProperMerging } from "./batchOperations";

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

  // Override all contacts' bucket assignment with the selected bucket
  const contactsWithSelectedBucket = allContacts.map(contact => ({
    ...contact,
    bucket: selectedBucket
  }));

  // Merge contacts by email, combining data from multiple entries
  console.log('Merging contacts by email...');
  const mergedContacts = mergeContactsByEmail(contactsWithSelectedBucket);
  const contactsToUpload = Object.values(mergedContacts);
  console.log(`After merging: ${contactsToUpload.length} unique contacts`);

  onProgress(50);

  // Use larger batches for faster processing
  const batchSize = 250;
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
      processedContacts += batch.length;

      // Update progress (50-95% for upload)
      const uploadProgress = 50 + Math.round((processedContacts / totalContacts) * 45);
      onProgress(Math.min(uploadProgress, 95));
      console.log(`Upload progress: ${uploadProgress}% (${processedContacts}/${totalContacts} contacts)`);
      
    } catch (error) {
      console.error(`Error upserting batch ${batchNumber}:`, error);
      // Try individual fallback for this batch
      console.log('Falling back to individual processing for this batch...');
      for (const contact of batch) {
        try {
          await upsertContactWithProperMerging(contact);
          processedContacts++;
        } catch (individualError) {
          console.error(`Error upserting contact ${contact.email}:`, individualError);
        }
      }
    }

    console.log(`Completed batch ${batchNumber}, total processed: ${processedContacts}`);
  }

  onProgress(100);
  console.log('=== uploadContactsToSelectedBucket completed ===');
  console.log(`All contacts have been uploaded and assigned to ${selectedBucket} bucket`);
};
