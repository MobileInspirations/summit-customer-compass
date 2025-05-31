
import { type MainBucketId, SUMMIT_MAPPING } from "../bucketCategorizationService";

export interface BucketMappingResult {
  bucket: MainBucketId;
  summitName: string;
}

export const mapFolderToBucket = (pathParts: string[], filename: string): BucketMappingResult => {
  if (pathParts.length < 1) {
    console.log(`Skipping file with empty path: ${filename}`);
    return {
      bucket: 'biz-op',
      summitName: extractSummitFromFilename(filename)
    };
  }

  const mainFolder = pathParts[0];
  let bucket: MainBucketId;
  let summitName: string;

  console.log(`Main folder detected: ${mainFolder}`);

  if (mainFolder.toLowerCase().includes('aweber')) {
    // This is from Aweber lists - default to biz-op bucket
    bucket = 'biz-op';
    console.log(`Assigned to biz-op bucket (Aweber folder detected)`);
    
    // If there's a subfolder, use it as the summit name
    if (pathParts.length >= 2) {
      summitName = pathParts[1];
      console.log(`Summit name from subfolder: ${summitName}`);
    } else {
      summitName = extractSummitFromFilename(filename);
      console.log(`Summit name from filename: ${summitName}`);
    }
  } else {
    // Handle other bucket structures with flexible mapping
    bucket = mapFolderNameToBucket(mainFolder);

    // Extract summit name - if there's a second level folder, use it, otherwise use the filename without engagement prefix
    if (pathParts.length >= 2) {
      summitName = pathParts[1];
    } else {
      summitName = extractSummitFromFilename(filename);
    }
  }

  // Check if summit name maps to a specific bucket based on summit mapping
  const mappedBucket = SUMMIT_MAPPING[summitName as keyof typeof SUMMIT_MAPPING];
  if (mappedBucket) {
    bucket = mappedBucket;
    console.log(`Summit ${summitName} mapped to ${bucket} bucket`);
  }

  return { bucket, summitName };
};

const mapFolderNameToBucket = (folderName: string): MainBucketId => {
  const lowerBucketName = folderName.toLowerCase();
  
  if (lowerBucketName.includes('biz') || lowerBucketName.includes('business')) {
    return 'biz-op';
  } else if (lowerBucketName.includes('health') || lowerBucketName.includes('medical') || lowerBucketName.includes('wellness')) {
    return 'health';
  } else if (lowerBucketName.includes('survivalist') || lowerBucketName.includes('survival') || lowerBucketName.includes('prepper')) {
    return 'survivalist';
  } else {
    // Default to biz-op for unknown folders
    console.warn(`Unknown bucket: ${folderName}, defaulting to biz-op bucket`);
    return 'biz-op';
  }
};

const extractSummitFromFilename = (filename: string): string => {
  // Extract summit name from filename by removing engagement prefix
  const filenameWithoutExt = filename.replace(/\.(csv|CSV)$/, '');
  return filenameWithoutExt.replace(/^[HLMU]-/i, '').trim();
};

export const extractEngagementLevel = (filename: string): 'H' | 'L' | 'M' | 'U' | null => {
  const engagementMatch = filename.match(/^([HLMU])-/i);
  return engagementMatch ? engagementMatch[1].toUpperCase() as 'H' | 'L' | 'M' | 'U' : null;
};
