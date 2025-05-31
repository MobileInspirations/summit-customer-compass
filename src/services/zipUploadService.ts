
import { ensureMainBucketsExist } from "./bucketCategorizationService";
import { extractZipFiles } from "./zip/zipExtractor";
import { processZipStructure } from "./zip/csvProcessor";
import { uploadContactsToSelectedBucket } from "./zip/contactUploader";
import type { MainBucketId } from "./bucketCategorizationService";

export const processZipUpload = async (
  zipFile: File,
  selectedBucket: MainBucketId,
  onProgress: (progress: number) => void
): Promise<void> => {
  try {
    console.log('=== Starting ZIP file processing ===');
    console.log(`ZIP file: ${zipFile.name}, Size: ${zipFile.size} bytes`);
    console.log(`Selected bucket: ${selectedBucket}`);
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

    // Process all CSV files and organize contacts (ignore folder structure for bucket assignment)
    console.log('Processing ZIP structure...');
    const allContacts = await processZipStructure(files);
    console.log(`Processed ${allContacts.length} contacts from ZIP`);
    onProgress(40);

    if (allContacts.length === 0) {
      console.log('No contacts found in zip file');
      onProgress(100);
      return;
    }

    console.log(`Processing ${allContacts.length} contacts for ${selectedBucket} bucket`);

    // Upload all contacts to the manually selected bucket
    console.log('=== Starting upload to selected bucket ===');
    try {
      await uploadContactsToSelectedBucket(allContacts, selectedBucket, onProgress);
      console.log('Upload completed successfully');
    } catch (uploadError) {
      console.error('Error during upload:', uploadError);
      throw new Error(`Failed during contact upload: ${uploadError.message}`);
    }
    
    onProgress(100);
    console.log('=== ZIP file processing completed successfully ===');
    console.log(`All contacts have been uploaded to ${selectedBucket} bucket`);
  } catch (error) {
    console.error('=== ERROR during ZIP processing ===', error);
    throw error;
  }
};
