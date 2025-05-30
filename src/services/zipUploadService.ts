
import { ensureMainBucketsExist } from "./bucketCategorizationService";
import { extractZipFiles } from "./zip/zipExtractor";
import { processZipStructure } from "./zip/csvProcessor";
import { groupContactsByBucket } from "./zip/contactMerger";
import { uploadContactsInBatches } from "./zip/contactUploader";

export const processZipUpload = async (
  zipFile: File,
  onProgress: (progress: number) => void
): Promise<void> => {
  try {
    console.log('Starting zip file processing...');
    onProgress(5);

    // Ensure main buckets exist
    console.log('Ensuring main buckets exist...');
    await ensureMainBucketsExist();
    onProgress(10);

    // Extract and process zip file
    console.log('Extracting ZIP files...');
    const files = await extractZipFiles(zipFile);
    console.log(`Extracted ${files.length} files from ZIP`);
    onProgress(20);

    // Process all CSV files and organize contacts
    console.log('Processing ZIP structure...');
    const allContacts = await processZipStructure(files);
    console.log(`Processed ${allContacts.length} contacts from ZIP`);
    onProgress(40);

    if (allContacts.length === 0) {
      console.log('No contacts found in zip file');
      onProgress(100);
      return;
    }

    console.log(`Processing ${allContacts.length} contacts from zip file`);

    // Group contacts by bucket for efficient processing
    console.log('Grouping contacts by bucket...');
    const contactsByBucket = groupContactsByBucket(allContacts);
    console.log('Contacts grouped by bucket:', Object.keys(contactsByBucket).map(bucket => 
      `${bucket}: ${contactsByBucket[bucket as keyof typeof contactsByBucket].length}`
    ));
    onProgress(50);

    // Upload contacts in batches with proper merging
    console.log('Starting batch upload...');
    await uploadContactsInBatches(contactsByBucket, onProgress);
    onProgress(100);

    console.log('Zip file processing completed successfully');
  } catch (error) {
    console.error('Error during ZIP processing:', error);
    throw error;
  }
};
