
import { type ZipFileEntry } from "./zipExtractor";
import { type ProcessedContact } from "./csvProcessor";
import { mapFolderToBucket, extractEngagementLevel } from "./bucketMapper";
import { parseCSVContent } from "./csvParser";

export const processZipFileEntry = (file: ZipFileEntry): ProcessedContact[] => {
  console.log(`Processing file: ${file.name} at path: ${file.path.join('/')}`);
  
  if (!file.name.endsWith('.csv')) {
    console.log(`Skipping non-CSV file: ${file.name}`);
    return [];
  }

  const { bucket, summitName } = mapFolderToBucket(file.path, file.name);

  // Extract engagement level from filename (H-, L-, M-, U-)
  const engagementLevel = extractEngagementLevel(file.name);
  
  if (!engagementLevel) {
    console.warn(`No engagement level found in filename: ${file.name}, defaulting to M`);
    return parseCSVContent(file.content, summitName, 'M', bucket, file.path);
  }

  console.log(`Processing ${file.name} - Summit: ${summitName}, Engagement: ${engagementLevel}, Bucket: ${bucket}`);

  // Parse CSV content
  try {
    const csvContacts = parseCSVContent(file.content, summitName, engagementLevel, bucket, file.path);
    console.log(`Successfully processed ${csvContacts.length} contacts from ${file.name}`);
    return csvContacts;
  } catch (error) {
    console.error(`Error parsing CSV content for ${file.name}:`, error);
    return [];
  }
};
