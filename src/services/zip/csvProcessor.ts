import { type MainBucketId } from "../bucketCategorizationService";
import { type ZipFileEntry } from "./zipExtractor";

export interface ProcessedContact {
  email: string;
  name?: string;
  company?: string;
  summit_history: string[];
  engagement_level: 'H' | 'L' | 'M' | 'U';
  tags: string[];
  bucket: MainBucketId;
  folder_path: string[]; // Store the full folder path for additional context
}

export const processZipStructure = async (files: ZipFileEntry[]): Promise<ProcessedContact[]> => {
  console.log(`Starting to process ${files.length} files from ZIP`);
  const contacts: ProcessedContact[] = [];

  for (const file of files) {
    console.log(`Processing file: ${file.name} at path: ${file.path.join('/')}`);
    
    if (!file.name.endsWith('.csv')) {
      console.log(`Skipping non-CSV file: ${file.name}`);
      continue;
    }

    const pathParts = file.path;
    if (pathParts.length < 1) {
      console.log(`Skipping file with empty path: ${file.name}`);
      continue;
    }

    // Check if this is from the "Aweber lists" main folder
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
        // Extract summit name from filename by removing engagement prefix
        const filename = file.name.replace(/\.(csv|CSV)$/, '');
        summitName = filename.replace(/^[HLMU]-/i, '').trim();
        console.log(`Summit name from filename: ${summitName}`);
      }
    } else {
      // Handle other bucket structures with flexible mapping
      const lowerBucketName = mainFolder.toLowerCase();
      if (lowerBucketName.includes('biz') || lowerBucketName.includes('business')) {
        bucket = 'biz-op';
      } else if (lowerBucketName.includes('health') || lowerBucketName.includes('medical') || lowerBucketName.includes('wellness')) {
        bucket = 'health';
      } else if (lowerBucketName.includes('survivalist') || lowerBucketName.includes('survival') || lowerBucketName.includes('prepper')) {
        bucket = 'survivalist';
      } else {
        // Default to biz-op for unknown folders
        console.warn(`Unknown bucket: ${mainFolder}, defaulting to biz-op bucket for file ${file.name}`);
        bucket = 'biz-op';
      }

      // Extract summit name - if there's a second level folder, use it, otherwise use the filename without engagement prefix
      if (pathParts.length >= 2) {
        summitName = pathParts[1];
      } else {
        // Extract summit name from filename by removing engagement prefix
        const filename = file.name.replace(/\.(csv|CSV)$/, '');
        summitName = filename.replace(/^[HLMU]-/i, '').trim();
      }
    }

    // Extract engagement level from filename (H-, L-, M-, U-)
    const filename = file.name;
    const engagementMatch = filename.match(/^([HLMU])-/i);
    if (!engagementMatch) {
      console.warn(`No engagement level found in filename: ${filename}, defaulting to M`);
      // Default to M (Medium) if no engagement level found
      const csvContacts = parseCSVContent(file.content, summitName, 'M', bucket, pathParts);
      contacts.push(...csvContacts);
      continue;
    }
    const engagementLevel = engagementMatch[1].toUpperCase() as 'H' | 'L' | 'M' | 'U';

    console.log(`Processing ${filename} - Summit: ${summitName}, Engagement: ${engagementLevel}, Bucket: ${bucket}`);

    // Parse CSV content
    try {
      const csvContacts = parseCSVContent(file.content, summitName, engagementLevel, bucket, pathParts);
      contacts.push(...csvContacts);
      console.log(`Successfully processed ${csvContacts.length} contacts from ${file.name}`);
    } catch (error) {
      console.error(`Error parsing CSV content for ${file.name}:`, error);
    }
  }

  console.log(`Total contacts processed: ${contacts.length}`);
  return contacts;
};

const parseCSVContent = (
  content: string, 
  summitName: string, 
  engagementLevel: 'H' | 'L' | 'M' | 'U',
  bucket: MainBucketId,
  folderPath: string[]
): ProcessedContact[] => {
  console.log(`Parsing CSV content for summit: ${summitName}, engagement: ${engagementLevel}, bucket: ${bucket}`);
  
  const lines = content.split('\n').filter(line => line.trim());
  console.log(`CSV has ${lines.length} lines`);
  
  if (lines.length <= 1) {
    console.log('No data rows found in CSV');
    return [];
  }

  const contacts: ProcessedContact[] = [];
  
  // Create comprehensive tags from folder structure and metadata
  const folderTags = folderPath.filter(folder => folder.trim() !== '');
  const engagementTag = `${engagementLevel}-Engagement`;
  const bucketTag = `${bucket}-bucket`;
  
  // Skip header row and process data
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Parse CSV line (assuming email is first column, name second, company third)
      const columns = parseCSVLine(line);
      if (columns.length === 0 || !columns[0]) continue;

      const email = columns[0].trim();
      if (!email || !isValidEmail(email)) {
        console.log(`Invalid email found: ${email}`);
        continue;
      }

      // Comprehensive tagging from folder structure and metadata
      const allTags = [
        summitName,
        engagementTag,
        bucketTag,
        ...folderTags
      ].filter(tag => tag && tag.trim() !== '');

      contacts.push({
        email,
        name: columns[1]?.trim() || undefined,
        company: columns[2]?.trim() || undefined,
        summit_history: [summitName],
        engagement_level: engagementLevel,
        tags: allTags,
        bucket,
        folder_path: folderPath
      });
    } catch (error) {
      console.error(`Error parsing line ${i}: ${line}`, error);
    }
  }

  console.log(`Parsed ${contacts.length} valid contacts from CSV`);
  return contacts;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
