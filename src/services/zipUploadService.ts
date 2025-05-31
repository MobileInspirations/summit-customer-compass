
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
    console.log('=== Starting ZIP file processing ===');
    console.log(`ZIP file: ${zipFile.name}, Size: ${zipFile.size} bytes`);
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

    // Upload contacts and assign to main buckets only (no categorization)
    console.log('=== Starting batch upload phase (main bucket assignment only) ===');
    try {
      await uploadContactsInBatches(contactsByBucket, onProgress);
      console.log('Batch upload completed successfully');
    } catch (uploadError) {
      console.error('Error during batch upload:', uploadError);
      throw new Error(`Failed during contact upload: ${uploadError.message}`);
    }
    
    onProgress(100);
    console.log('=== ZIP file processing completed successfully ===');
    console.log('Note: Contacts have been uploaded and assigned to main buckets only. No automatic categorization was performed.');
  } catch (error) {
    console.error('=== ERROR during ZIP processing ===', error);
    throw error;
  }
};
