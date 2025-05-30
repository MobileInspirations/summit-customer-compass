
import { ensureMainBucketsExist } from "./bucketCategorizationService";
import { extractZipFiles } from "./zip/zipExtractor";
import { processZipStructure } from "./zip/csvProcessor";
import { groupContactsByBucket } from "./zip/contactMerger";
import { uploadContactsInBatches } from "./zip/contactUploader";

export const processZipUpload = async (
  zipFile: File,
  onProgress: (progress: number) => void
): Promise<void> => {
  console.log('Starting zip file processing...');
  onProgress(5);

  // Ensure main buckets exist
  await ensureMainBucketsExist();
  onProgress(10);

  // Extract and process zip file
  const files = await extractZipFiles(zipFile);
  onProgress(20);

  // Process all CSV files and organize contacts
  const allContacts = await processZipStructure(files);
  onProgress(40);

  if (allContacts.length === 0) {
    console.log('No contacts found in zip file');
    onProgress(100);
    return;
  }

  console.log(`Processing ${allContacts.length} contacts from zip file`);

  // Group contacts by bucket for efficient processing
  const contactsByBucket = groupContactsByBucket(allContacts);
  onProgress(50);

  // Upload contacts in batches with proper merging
  await uploadContactsInBatches(contactsByBucket, onProgress);
  onProgress(100);

  console.log('Zip file processing completed');
};
